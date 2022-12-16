import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  declaration: false,
  entries: [
    'src/index',
    { input: 'src/runtime/', outDir: 'dist/runtime', format: 'esm' },
  ],
  dependencies: ['react'],
  externals: ['@remix-kit/schema'],
  failOnWarn: false
});
