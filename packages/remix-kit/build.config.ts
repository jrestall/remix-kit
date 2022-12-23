import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  declaration: true,
  entries: ['src/index'],
  externals: ['fsevents', '@remix-kit/schema', 'vite'],
  rollup: {
    emitCJS: true,
    cjsBridge: true,
  }
});
