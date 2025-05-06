import {Texture} from '@luma.gl/core';
import fs from './pansharpen-brovey.fs.glsl';
import {ShaderModule} from '@luma.gl/shadertools';

type PansharpenBroveyUniforms = {
  panWeight: number;
};

type PansharpenBroveyBindings = {
  bitmapTexure_pan: Texture;
};

type PansharpenBroveyProps = {
  image: Texture;
  panWeight: number;
};

export default {
  name: 'pansharpenBrovey',
  fs,
  defines: {
    SAMPLER_TYPE: 'sampler2D',
  },
  getUniforms(opts) {
    const {image, panWeight = 0.2} = opts;

    return {
      bitmapTexture_pan: image,
      panWeight,
    };
  },
  inject: {
    'fs:DECKGL_MUTATE_COLOR': `
    float pan_band = float(texture(bitmapTexture_pan, coord).r);
    image = pansharpen_brovey_calc(image, pan_band, pansharpen.panWeight);
    `,
  },
  uniformTypes: {
    panWeight: 'f32',
  },
} as const satisfies ShaderModule<
  PansharpenBroveyProps,
  PansharpenBroveyUniforms,
  PansharpenBroveyBindings
>;
