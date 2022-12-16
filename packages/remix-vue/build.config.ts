import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  declaration: false,
  entries: [
    'src/index',
    'src/setup',
  ],
  externals: [],
  rollup: {
    emitCJS: true,
  },
  failOnWarn: false,
});
