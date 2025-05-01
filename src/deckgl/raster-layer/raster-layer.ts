import {BitmapLayer, BitmapLayerProps} from '@deck.gl/layers';
import {
  DefaultProps,
  Layer,
  LayerContext,
  UpdateParameters,
} from '@deck.gl/core';
import {ShaderAssembler, ShaderModule} from '@luma.gl/shadertools';
import {Texture, TextureProps} from '@luma.gl/core';
import {AsyncTexture, AsyncTextureProps} from '@luma.gl/engine';
import isEqual from 'lodash.isequal';

import {loadImages} from '../images';
import fs from './raster-layer-webgl2.fs.glsl';
import vs from './raster-layer-webgl2.vs.glsl';

export type AnyTexture = Texture | AsyncTexture;
export type AnyTextureProps = (Omit<TextureProps, 'data'> | Omit<AsyncTextureProps, 'data'>) & {
  data?: string | TextureProps['data'] | AsyncTextureProps['data'];
};

type ExtractShaderModuleProps<Type> = Type extends ShaderModule<infer P, any, any> ? P : {}

type ModuleProps<M extends readonly ShaderModule[]> = {
  [K in M[number]['name']]: Partial<Omit<ExtractShaderModuleProps<Extract<M[number], {name: K}>>, 'image'>>
}

type ImageMap<M extends readonly ShaderModule[]> = {
  [P in M[number]['name']]: AnyTexture | AnyTextureProps | (AnyTexture | AnyTextureProps)[]
}

export type LoadedImageMap<M extends readonly ShaderModule[]> = {
  [P in M[number]['name']]: AnyTexture | AnyTexture[]
}

export type RasterLayerProps<M extends readonly ShaderModule[]> = Omit<BitmapLayerProps, 'image'> & {
  modules: M;
  images: Partial<ImageMap<M>>;
  moduleProps: Partial<ModuleProps<M>>
};

export default class RasterLayer<const M extends ShaderModule[]> extends BitmapLayer<RasterLayerProps<M>> {
  state!: BitmapLayer['state'] & {
    images: Partial<LoadedImageMap<M>>;
  };

  static layerName = 'RasterLayer';

  static defaultProps: DefaultProps<RasterLayerProps<[]>> = {
    ...BitmapLayer.defaultProps,
    modules: {type: 'array', value: [], compare: true},
    images: {type: 'object', value: {}, compare: true},
    moduleProps: {type: 'object', value: {}, compare: true},
  };

  initializeState() {
    const shaderAssembler = ShaderAssembler.getDefaultShaderAssembler();

    const fsStr1 = 'fs:DECKGL_MUTATE_COLOR(inout vec4 image, in vec2 coord)';
    const fsStr2 = 'fs:DECKGL_CREATE_COLOR(inout vec4 image, in vec2 coord)';

    // Only initialize shader hook functions _once globally_
    // Since the program manager is shared across all layers, but many layers
    // might be created, this solves the performance issue of always adding new
    // hook functions. See #22
    if (!shaderAssembler['_hookFunctions'].includes(fsStr1)) {
      shaderAssembler.addShaderHook(fsStr1);
    }
    if (!shaderAssembler['_hookFunctions'].includes(fsStr2)) {
      shaderAssembler.addShaderHook(fsStr2);
    }

    // images is a mapping from keys to Texture2D objects. The keys should match
    // names of uniforms in shader modules
    this.setState({images: {}});

    super.initializeState();
  }

  draw(opts: Parameters<Layer['draw']>[0]) {
    const {
      model,
      images,
      coordinateConversion,
      bounds,
      disablePicking,
    } = this.state;
    const {
      moduleProps,
      desaturate,
      transparentColor,
      tintColor,
    } = this.props;

    if (opts.shaderModuleProps.picking.isActive && disablePicking) {
      return;
    }

    // Render the image
    if (
      !model ||
      !images ||
      Object.keys(images).length === 0 ||
      !Object.values(images).every((item) => item)
    ) {
      return;
    }

    const merged = Object.fromEntries(
      Object.entries(images).map(([key, image]) => {
        const moduleName = key as M[number]['name']
        return [
          key,
          {
            image,
            ...moduleProps[moduleName],
          },
        ];
      })
    );

    model.shaderInputs.options.disableWarnings = false;
    model.shaderInputs.setProps({
      ...merged,
      bitmap: {
        bounds,
        coordinateConversion,
        desaturate,
        tintColor: tintColor.slice(0, 3).map((x) => x / 255) as [
          number,
          number,
          number
        ],
        transparentColor: transparentColor.map((x) => x / 255) as [
          number,
          number,
          number,
          number
        ],
      },
    });
    model.draw(this.context.renderPass);
  }

  getShaders() {
    const {modules = []} = this.props;

    const parentShaders = super.getShaders();
    return {
      ...parentShaders,
      vs,
      fs,
      modules: [...parentShaders.modules, ...modules],
    };
  }

  updateState({props, oldProps, changeFlags}: UpdateParameters<RasterLayer<M>>) {
    // setup model first
    const modulesChanged =
      props &&
      props.modules &&
      oldProps &&
      !isEqual(props.modules, oldProps.modules);
    if (changeFlags.extensionsChanged || modulesChanged) {
      if (this.state.model) {
        this.state.model.destroy();
      }
      this.setState({model: this._getModel()});
      this.getAttributeManager().invalidateAll();
    }

    if (props && props.images) {
      this.updateImages({props, oldProps});
    }

    const attributeManager = this.getAttributeManager();

    if (props.bounds !== oldProps.bounds) {
      const oldMesh = this.state.mesh;
      const mesh = this._createMesh();
      this.state.model!.setVertexCount(mesh.vertexCount);
      for (const key in mesh) {
        if (oldMesh && oldMesh[key] !== mesh[key as keyof typeof mesh]) {
          attributeManager.invalidate(key);
        }
      }
      this.setState({mesh, ...this._getCoordinateUniforms()});
    } else if (
      props._imageCoordinateSystem !== oldProps._imageCoordinateSystem
    ) {
      this.setState(this._getCoordinateUniforms());
    }
  }

  updateImages({
    props,
    oldProps,
  }: Pick<UpdateParameters<RasterLayer<M>>, 'props' | 'oldProps'>) {
    const {images} = this.state;

    const newImages = loadImages({
      device: this.context.device,
      images,
      props,
      oldProps,
    });
    if (newImages) {
      this.setState({images: newImages});
    }
  }

  finalizeState(context: LayerContext) {
    super.finalizeState(context);


    if (this.state.images) {
      for (const image of Object.values<LoadedImageMap<M>[keyof LoadedImageMap<M>]>(this.state.images)) {
        if (Array.isArray(image)) {
          image.map((x) => x && x.destroy());
        } else {
          image && image.destroy();
        }
      }
    }
  }
}
