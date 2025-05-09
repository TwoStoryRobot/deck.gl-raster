uniform sampler2D u_colormap_texture;

uniform colormapUniforms {
  uniform float scale;
  uniform float offset;
} colormap;

// Apply colormap texture given value
// Since the texture only varies in the x direction, setting v to 0.5 as a
// constant is fine
// Default input range of value is -1 to 1
vec4 apply_colormap(sampler2D cmap, vec4 image, float scaler, float offset) {
  vec2 uv = vec2(scaler * image.r + offset, 0.5);
  return texture(cmap, uv);
}
