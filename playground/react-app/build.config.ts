import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: [{ input: 'server.ts', name: 'index', outDir: 'dist/', format: 'esm' }],
  outDir: 'build',
  externals: ['@remix-kit/vite', '@remix-run/dev', '@remix-run/dev/server-build'],
});
