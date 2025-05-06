import {ShaderModule} from '@luma.gl/shadertools';
import fs from './linear-rescale.fs.glsl';

type LinearRescaleUniforms = {
  scale: number;
  offset: number;
};

type LinearRescaleProps = {
  scale: number;
  offset: number;
};

export default {
  name: 'linearRescale',
  fs,
  getUniforms(opts = {}) {
    const {scale, offset} = opts;

    return {
      scale: scale || 1,
      offset: offset || 0,
    };
  },
  inject: {
    'fs:DECKGL_MUTATE_COLOR': `
    image = linear_rescale(image, linearRescale.scale, linearRescale.offset);
    `,
  },
  uniformTypes: {
    scale: 'f32',
    offset: 'f32',
  },
} as const satisfies ShaderModule<
  LinearRescaleProps,
  LinearRescaleUniforms,
  {}
>;
