import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  declaration: false,
  entries: ['src/index', 'src/setup', 'src/plugins/react-refresh-runtime'],
  rollup: {
    emitCJS: true
  }
});
