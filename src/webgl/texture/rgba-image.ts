import {Texture} from '@luma.gl/core';
import {ShaderModule} from '@luma.gl/shadertools';

const fs = `\
#ifdef SAMPLER_TYPE
  uniform SAMPLER_TYPE bitmapTexture_rgba;
#else
  uniform sampler2D bitmapTexture_rgba;
#endif
`;

type RgbaImageBindings = {
  bitmapTexture_rgba: Texture;
};

type RgbaImageProps = {
  image: Texture;
};

export default {
  name: 'rgbaImage',
  fs,
  getUniforms(opts = {}) {
    const {image} = opts;

    return {
      bitmapTexture_rgba: image,
    };
  },
  defines: {
    SAMPLER_TYPE: 'sampler2D',
  },
  inject: {
    'fs:DECKGL_CREATE_COLOR': `
    image = vec4(texture(bitmapTexture_rgba, coord));
    `,
  },
} as const satisfies ShaderModule<RgbaImageProps, {}, RgbaImageBindings>;
