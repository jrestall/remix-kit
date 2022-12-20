import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  declaration: true,
  entries: ['src/index', { input: 'src/runtime/', outDir: 'dist/runtime' }],
  rollup: {
    emitCJS: true,
  },
  externals: ['@remix-kit/schema', 'vite'],
});
