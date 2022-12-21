import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  declaration: false,
  entries: ['src/index', 'src/setup'],
  rollup: {
    emitCJS: true,
  },
});
