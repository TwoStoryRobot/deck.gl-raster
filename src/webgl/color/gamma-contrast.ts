import {ShaderModule} from '@luma.gl/shadertools';
import fs from './gamma-contrast.fs.glsl';

type GammaContrastUniforms = {
  r: number;
  g: number;
  b: number;
  a: number;
};

type GammaContrastProps = {
  r: number;
  g: number;
  b: number;
  a: number;
};

export default {
  name: 'gammaContrast',
  fs,
  getUniforms(opts = {}) {
    const {r, g, b, a} = opts;

    return {
      r: r ?? 1,
      g: g ?? 1,
      b: b ?? 1,
      a: a ?? 1,
    };
  },
  inject: {
    'fs:DECKGL_MUTATE_COLOR': `
    image = gammaContrast(image, gamma.r, gamma.g, gamma.b, gamma.a);
    `,
  },
} as const satisfies ShaderModule<
  GammaContrastProps,
  GammaContrastUniforms,
  {}
>;
