import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  declaration: true,
  entries: [
    'src/index',
    'src/setup',
    {
      builder: 'mkdist',
      input: './src/plugins/',
      outDir: './dist/',
      format: 'esm',
    },
  ],
  externals: ['@remix-kit/schema'],
  rollup: {
    emitCJS: true,
  },
});
