import { withoutLeadingSlash } from 'ufo';
import { defineUntypedSchema } from 'untyped';

export default defineUntypedSchema({
  /**
   * Configuration that will be passed directly to Vite.
   *
   * See https://vitejs.dev/config for more information.
   * Please note that not all vite options are supported in RemixKit.
   *
   * @type {typeof import('../src/types/config').ViteConfig}
   */
  vite: {
    root: {
      $resolve: async (val, get) => val ?? (await get('srcDir')),
    },
    mode: {
      $resolve: async (val, get) => val ?? ((await get('dev')) ? 'development' : 'production'),
    },
    logLevel: 'info',
    define: {
      $resolve: async (val, get) => ({
        'process.dev': await get('dev'),
        ...(val || {}),
      }),
    },
    resolve: {
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
    },
    publicDir: {
      $resolve: async (val) => val ?? '',
    },
    optimizeDeps: {
      exclude: {
        $resolve: async (val, get) => [
          ...(val || []),
          ...(await get('build.transpile')).filter((i: string) => typeof i === 'string'),
        ],
      },
    },
    esbuild: {
      jsxFactory: 'h',
      jsxFragment: 'Fragment',
      tsconfigRaw: '{}',
    },
    clearScreen: false,
    build: {
      assetsDir: {
        $resolve: async (val, get) => val ?? withoutLeadingSlash((await get('app')).buildAssetsDir),
      },
      emptyOutDir: false,
    },
    server: {
      fs: {
        allow: {
          $resolve: async (val, get) => [
            await get('buildDir'),
            await get('srcDir'),
            await get('rootDir'),
            await get('workspaceDir'),
            ...(await get('modulesDir')),
            ...(val ?? []),
          ],
        },
      },
    },
    preview: {
      port: 3000,
      strictPort: true
    }
  },
});
