import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  declaration: true,
  clean: true,
  entries: ['src/cli', 'src/index'],
  externals: ['fsevents'],
});
