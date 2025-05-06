import {ShaderModule} from '@luma.gl/shadertools';
import fs from './savi.fs.glsl';

export default {
  name: 'soilAdjustedVegetationIndex',
  fs,
  inject: {
    'fs:DECKGL_MUTATE_COLOR': `
    image = vec4(soil_adjusted_vegetation_index_calc(image), 0., 0., 0.);
    `,
  },
} as const satisfies ShaderModule<never, never, never>;
