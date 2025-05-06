import {ShaderModule} from '@luma.gl/shadertools';
import fs from './sigmoidal-contrast.fs.glsl';

type SigmoidalContrastUniforms = {
  contrast: number;
  bias: number;
};

type SigmoidalContrastProps = {
  contrast: number;
  bias: number;
};

export default {
  name: 'sigmoidalContrast',
  fs,
  getUniforms(opts = {}) {
    const {contrast, bias} = opts;

    return {
      contrast: contrast ?? 0,
      bias: bias ?? 0.5,
    };
  },
  inject: {
    'fs:DECKGL_MUTATE_COLOR': `
    image = sigmoidal_contrast(image, sigmoidalContrast.contrast, sigmoidalContrast.bias);
    `,
  },
  uniformTypes: {
    contrast: 'f32',
    bias: 'f32',
  },
} as const satisfies ShaderModule<
  SigmoidalContrastProps,
  SigmoidalContrastUniforms,
  {}
>;
