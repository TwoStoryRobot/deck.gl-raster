import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import glsl from 'rollup-plugin-glsl';
import dts from 'rollup-plugin-dts';

const config = {
  input: 'src/index.ts',
  output: [
    {
      name: 'deck.gl-raster',
      format: 'es',
      indent: false,
      file: './dist/deck.gl-raster.mjs',
      sourcemap: true,
    },
    {
      name: 'deck.gl-raster',
      format: 'umd',
      indent: false,
      file: './dist/deck.gl-raster.umd.js',
      sourcemap: true,
      globals: {
        '@deck.gl/core': 'deck',
        '@deck.gl/layers': 'deck',
        '@deck.gl/mesh-layers': 'deck',
        '@luma.gl/core': 'luma',
        '@luma.gl/constants': 'luma.GL',
        '@luma.gl/engine': 'luma',
        '@luma.gl/shadertools': 'luma',
        '@luma.gl/webgl': 'luma',
      },
    },
  ],
  plugins: [
    typescript(),
    commonjs(),
    resolve(),
    glsl({
      include: 'src/**/*.glsl',
      sourceMap: true,
      compress: true,
    }),
  ],
  external: [
    '@deck.gl/core',
    '@deck.gl/layers',
    '@deck.gl/mesh-layers',
    '@luma.gl/core',
    '@luma.gl/constants',
    '@luma.gl/engine',
    '@luma.gl/shadertools',
    '@luma.gl/webgl',
  ],
};

export default [
  config,
  {
    input: './src/index.ts',
    output: [{file: 'dist/deck.gl-raster.d.ts', format: 'es', sourcemap: true}],
    plugins: [dts()],
  },
];
