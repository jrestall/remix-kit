import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: ['./server'],
  outDir: 'build',
  rollup: {
    emitCJS: true,
  },
});
