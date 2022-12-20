import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  declaration: false,
  entries: ['src/index'],
  externals: ['fsevents', '@remix-kit/schema', 'vite'],
  failOnWarn: false,
});
