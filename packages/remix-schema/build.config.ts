import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  declaration: true,
  entries: [
    {
      input: 'src/config/index',
      outDir: 'schema',
      name: 'config',
      builder: 'untyped',
      defaults: {
        rootDir: '/<rootDir>/',
        vite: {
          base: '/',
        },
      },
    },
    'src/index',
  ],
  externals: [
    // Type imports
    'chalk',
    'hookable',
    'rollup-plugin-visualizer',
    'vite',
    'minimatch',
    'mini-css-extract-plugin',
    'h3',
    'postcss',
    'consola',
    'ignore',
    'fs-extra',
    'get-port',
    'prettier',
    'tsconfig-paths',
    'json5',
    '@remix-run/dev',
    '@vue/compiler-core',
  ],
  rollup: {
    inlineDependencies: true,
    emitCJS: true
  },
});
