import {Device, SamplerProps, Texture} from '@luma.gl/core';
import isEqual from 'lodash.isequal';
import {AsyncTexture, AsyncTextureProps} from '@luma.gl/engine';
import {
  AnyTexture,
  AnyTextureProps,
  LoadedImageMap,
  RasterLayerProps,
} from './raster-layer/raster-layer';
import {ShaderModule} from '@luma.gl/shadertools';
import {isKey} from '../util';

type LoadImagesProps<M extends readonly ShaderModule[]> = {
  device: Device;
  images: Partial<LoadedImageMap<M>>;
  props: RasterLayerProps<M>;
  oldProps: RasterLayerProps<M>;
};

const defaultSamplerSettings: SamplerProps = {
  minFilter: 'nearest',
  magFilter: 'nearest',
  addressModeU: 'clamp-to-edge',
  addressModeV: 'clamp-to-edge',
};

export function loadImages<M extends readonly ShaderModule[]>({
  device,
  images,
  props,
  oldProps,
}: LoadImagesProps<M>): Partial<LoadedImageMap<M>> {
  // Change to `true` if we need to setState with a new `images` object
  let imagesDirty = false;

  // If there are any removed keys, which previously existed in oldProps and
  // this.state.images but no longer exist in props, remove from the images
  // object
  if (oldProps && oldProps.images) {
    for (const key in oldProps.images) {
      if (props.images && !(key in props.images) && isKey(images, key)) {
        delete images[key];
        imagesDirty = true;
      }
    }
  }

  // Check if any keys of props.images have changed
  const changedKeys = [];
  for (const key in props.images) {
    if (!isKey(props.images, key)) {
      return;
    }
    // If oldProps.images didn't exist or it existed and this key didn't exist
    if (!oldProps.images || (oldProps.images && !(key in oldProps.images))) {
      changedKeys.push(key);
      continue;
    }

    // Deep compare when the key previously existed to see if it changed
    if (!isEqual(props.images[key], oldProps.images[key])) {
      changedKeys.push(key);
    }
  }

  for (const key of changedKeys) {
    const imageData = props.images[key];
    if (!imageData) {
      continue;
    }

    if (Array.isArray(imageData)) {
      images[key] = imageData.map((x) => loadTexture(device, x));
    } else {
      images[key] = loadTexture(device, imageData);
    }
    imagesDirty = true;
  }

  if (imagesDirty) {
    return images;
  }

  return null;
}

function loadTexture(device: Device, imageData: AnyTextureProps | AnyTexture) {
  if (!imageData) {
    return null;
  }

  if (imageData instanceof Texture || imageData instanceof AsyncTexture)
    return imageData;

  const imageProps = structuredClone(imageData);

  if (!imageProps.sampler) {
    imageProps.sampler = defaultSamplerSettings;
  }

  if (!imageProps.dimension) {
    imageProps.dimension = '2d';
  }

  return new AsyncTexture(device, imageProps as AsyncTextureProps);
}
