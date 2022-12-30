import { mkdirSync, copyFileSync } from 'fs-extra';
import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  declaration: true,
  entries: ['./src/index', './src/vite'],
  externals: ['@remix-kit/schema', 'vite'],
  rollup: {
    cjsBridge: true,
    emitCJS: true,
  },
  hooks: {
    'build:done': () => {
      mkdirSync('dist/runtime/', { recursive: true });
      copyFileSync('src/runtime/dev-entry.mjs', 'dist/runtime/dev-entry.mjs');
      copyFileSync('src/runtime/dev-server-entry.js', 'dist/runtime/dev-server-entry.js');
      copyFileSync('src/runtime/dev-client.js', 'dist/runtime/dev-client.js');

      mkdirSync('dist/compiler/defaults/', { recursive: true });
      copyFileSync(
        'src/compiler/defaults/server-entry.js',
        'dist/compiler/defaults/server-entry.js'
      );
    },
  },
});
