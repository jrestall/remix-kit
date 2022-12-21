import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: [{ input: 'server.dev.ts', name: 'server.dev', outDir: 'dist/', format: 'esm' }],
  outDir: 'build',
  externals: ['@remix-kit/vite', '@remix-run/dev', '@remix-run/dev/server-build'],
});
