import {ShaderModule} from '@luma.gl/shadertools';
import fs from './evi.fs.glsl';

export default {
  name: 'enhancedVegetationIndex',
  fs,
  inject: {
    'fs:DECKGL_MUTATE_COLOR': `
    image = vec4(enhanced_vegetation_index_calc(image), 0., 0., 0.);
    `,
  },
} as const satisfies ShaderModule<{}, {}, {}>;
