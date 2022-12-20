import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  declaration: true,
  rollup: {
    inlineDependencies: true,
    resolve: {
      exportConditions: ['production', 'node'] as any,
    },
    emitCJS: true
  },
  clean: true,
  entries: ['src/cli', 'src/index'],
  externals: [
    'fsevents',
  ],
  failOnWarn: false
});
