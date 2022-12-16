import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  declaration: false,
  entries: [
    'src/index',
    'src/setup',
    'src/plugins/react-refresh-runtime'
  ],
  externals: ['chokidar', 'fs-extra', 'webpack-sources', '@swc/core', 'unplugin'],
  rollup: {
    emitCJS: true,
  },
  failOnWarn: false,
});
