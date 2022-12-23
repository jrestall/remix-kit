import fs from 'fs-extra';
import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  declaration: true,
  clean: true,
  entries: ['src/index', 'src/setup'],
  externals: ['@remix-kit/schema'],
  rollup: {
    emitCJS: true,
    cjsBridge: true,
  },
  hooks: {
    'build:done': () => {
      fs.copyFileSync('src/plugins/react-refresh-runtime.mjs', 'dist/react-refresh-runtime.mjs');
    },
  },
});
