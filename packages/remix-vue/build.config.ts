import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  declaration: false,
  entries: ['src/index', 'src/setup'],
  externals: ['hookable', 'ignore'],
  rollup: {
    emitCJS: true,
  },
  failOnWarn: false
});
