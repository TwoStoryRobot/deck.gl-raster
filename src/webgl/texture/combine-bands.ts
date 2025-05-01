import { Sampler, Texture } from "@luma.gl/core";
import { ShaderModule } from "@luma.gl/shadertools";

const fs = `\
precision mediump float;
precision mediump int;
precision mediump usampler2D;

#ifdef SAMPLER_TYPE
  uniform SAMPLER_TYPE bitmapTexture_r;
  uniform SAMPLER_TYPE bitmapTexture_g;
  uniform SAMPLER_TYPE bitmapTexture_b;
  uniform SAMPLER_TYPE bitmapTexture_a;
#else
  uniform sampler2D bitmapTexture_r;
  uniform sampler2D bitmapTexture_g;
  uniform sampler2D bitmapTexture_b;
  uniform sampler2D bitmapTexture_a;
#endif
`;

type CombineBandsProps = {
  image?: [Texture, Texture, Texture, Texture] | Texture[] | [];
  anotherOption?: string
}

type CombineBandsBindings = {
  bitmapTexture_r: Texture;
  bitmapTexture_g: Texture;
  bitmapTexture_b: Texture;
  bitmapTexture_a: Texture;
} | null

export default {
  name: 'combineBands',
  fs,
  getUniforms(props) {
    const {image} = props;
    if (!image || image.length === 0) {
      return null;
    }

    if (image.length === 1) {
      return {
        bitmapTexture_r: image[0],
        bitmapTexture_g: image[0],
        bitmapTexture_b: image[0],
        bitmapTexture_a: image[0],
      };
    }

    const [
      bitmapTexture_r,
      bitmapTexture_g,
      bitmapTexture_b,
      bitmapTexture_a,
    ] = image;

    return {
      bitmapTexture_r: bitmapTexture_r,
      bitmapTexture_g: bitmapTexture_g,
      bitmapTexture_b: bitmapTexture_b,
      bitmapTexture_a: bitmapTexture_a,
    };
  },
  defines: {
    SAMPLER_TYPE: 'sampler2D',
  },
  inject: {
    'fs:DECKGL_CREATE_COLOR': `
    float channel1 = texture(bitmapTexture_r, coord).r;
    float channel2 = texture(bitmapTexture_g, coord).r;
    float channel3 = texture(bitmapTexture_b, coord).r;
    float channel4 = texture(bitmapTexture_a, coord).r;

    image = vec4(channel1, channel2, channel3, channel4);
    `,
  },
} as const satisfies ShaderModule<CombineBandsProps, {}, CombineBandsBindings>;
