import { Sampler, Texture } from "@luma.gl/core";
import { ShaderModule } from "@luma.gl/shadertools";

type MaskImageProps = {
  image?: Texture
}

type MaskImageBindings = {
  bitmapTexture_mask: Texture
} | null


const fs = `\
uniform sampler2D bitmapTexture_mask;
`;

export default {
  name: 'maskImage',
  fs,
  getUniforms(props) {
    const {image} = props;

    if (!image) {
      return null;
    }

    return {
      bitmapTexture_mask: image,
    };
  },
  inject: {
    'fs:DECKGL_MUTATE_COLOR': `
    float alpha = texture(bitmapTexture_mask, coord).r;
    image = vec4(image.rgb, alpha);
    `,
  },
} as const satisfies ShaderModule<MaskImageProps, {}, MaskImageBindings>;
