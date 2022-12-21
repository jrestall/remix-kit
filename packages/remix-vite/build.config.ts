import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  declaration: true,
  entries: [
    'src/index',
    'src/vite',
    { input: 'src/runtime/', outDir: 'dist/', format: "esm" },
    { input: 'src/compiler/defaults/', outDir: 'dist/compiler/defaults/', format: "esm" },
  ],
  externals: ['@remix-kit/schema', 'vite'],
  rollup: {
    emitCJS: true,
  },
});
