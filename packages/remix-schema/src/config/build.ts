import { defineUntypedSchema } from 'untyped';
import { defu } from 'defu';
import { join } from 'pathe';

export default defineUntypedSchema({
  /**
   * The builder to use for bundling your application.
   *
   * @type {'vite' | { bundle: (remix: typeof import('../src/types/remix').Remix) => Promise<void> }}
   */
  builder: {
    $resolve: async (val, get) => {
      if (typeof val === 'object') {
        return val;
      }
      const map: Record<string, string> = {
        vite: '@remix-kit/vite/setup',
      };
      return map[val] || val || map.vite;
    },
  },

  /**
   * The renderer to use for rendering your application.
   *
   * @type {'react' | 'vue' | { setup: (remix: typeof import('../src/types/remix').Remix) => Promise<void> }}
   */
    renderer: {
      $resolve: async (val, get) => {
        if (typeof val === 'object') {
          return val;
        }
        const map: Record<string, string> = {
          react: '@remix-kit/react/setup',
          vue: '@remix-kit/vue/setup',
        };
        return map[val] || val || map.react;
      },
    },

  /**
   * Whether to generate sourcemaps.
   *
   * @type {boolean | { server?: boolean, client?: boolean }}
   */
  sourcemap: {
    $resolve: async (val, get) => {
      if (typeof val === 'boolean') {
        return { server: val, client: val };
      }
      return defu(val, {
        server: true,
        client: await get('dev'),
      });
    },
  },

  /**
   * Shared build configuration.
   */
  build: {
    /**
     * If you want to transpile specific dependencies with Babel, you can add them here.
     * Each item in transpile can be a package name, a function, a string or regex object matching the
     * dependency's file name.
     *
     * You can also use a function to conditionally transpile. The function will receive an object ({ isDev, isServer, isClient, isModern, isLegacy }).
     *
     * @example
     * ```js
      transpile: [({ isLegacy }) => isLegacy && 'ky']
     * ```
     * @type {Array<string | RegExp | Function>}
     */
    transpile: {
      $resolve: (val) => [].concat(val).filter(Boolean),
    },

    /**
     * Remix uses `rollup-plugin-visualizer` to visualize your bundles and how to optimize them.
     *
     * Set to `true` to enable bundle analysis, or pass an object with options: [for vite](https://github.com/btd/rollup-plugin-visualizer#options).
     *
     * @example
     * ```js
     * analyze: {
     *   open: true
     * }
     * ```
     * @type {boolean | typeof import('rollup-plugin-visualizer').PluginVisualizerOptions}
     *
     */
    analyze: {
      $resolve: async (val, get) => {
        if (val !== true) {
          return val ?? false;
        }
        const rootDir = await get('rootDir');
        return {
          template: 'treemap',
          projectRoot: rootDir,
          filename: join(rootDir, 'build/stats', '{name}.html'),
        };
      },
    },
  },
});
