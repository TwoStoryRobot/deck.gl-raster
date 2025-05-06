import {ShaderModule} from '@luma.gl/shadertools';
import fs from './normalized-difference.fs.glsl';

export default {
  name: 'normalized_difference',
  fs,
  inject: {
    'fs:DECKGL_MUTATE_COLOR': `
    image = vec4(normalized_difference_calc(image), 0., 0., 0.);
    `,
  },
} as const satisfies ShaderModule<never, never, never>;
