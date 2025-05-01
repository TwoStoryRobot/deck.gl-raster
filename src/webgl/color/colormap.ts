import { Texture, Sampler } from '@luma.gl/core';
import {ShaderModule, } from '@luma.gl/shadertools';

import fs from './colormap.fs.glsl';

type ColormapUniforms = {
  scale: number,
  offset: number,
}

type ColormapBindings = {
  u_colormap_texture: Texture
}

type ColormapProps = {
  image: Texture ,
  scale: number,
  offset: number,
}


export default {
  name: 'colormap',
  fs,
  getUniforms(props) {
    const {image, scale, offset} = props;

    return {
      u_colormap_texture: image,
      scale: Number.isFinite(scale) ? scale : 0.5,
      offset: Number.isFinite(offset) ? offset : 0.5,
    };
  },
  inject: {
    'fs:DECKGL_MUTATE_COLOR': `
      image = apply_colormap(u_colormap_texture, image, colormap.scale, colormap.offset);
    `,
  },
  uniformTypes: {
    scale: 'f32',
    offset: 'f32',
  },
} as const satisfies ShaderModule<ColormapProps, ColormapUniforms, ColormapBindings>;
