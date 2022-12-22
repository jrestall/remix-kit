import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  declaration: true,
  entries: [
    'src/index',
    'src/vite',
    {
      builder: 'mkdist',
      input: 'src/runtime/',
      outDir: 'dist/',
      format: 'cjs'
    },
    {
      builder: 'mkdist',
      input: 'src/runtime/',
      outDir: 'dist/',
      format: 'esm'
    },
    {
      builder: 'mkdist',
      input: 'src/compiler/defaults/',
      outDir: 'dist/compiler/defaults/',
      format: 'esm',
    },
  ],
  externals: ['@remix-kit/schema', 'vite'],
  rollup: {
    emitCJS: true,
  },
});
