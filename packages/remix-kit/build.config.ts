import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  declaration: false,
  entries: ['src/index'],
  externals: ['fsevents', '@remix-kit/schema', 'vite'],
  rollup: {
    emitCJS: true,
  },
  failOnWarn: false,
});
