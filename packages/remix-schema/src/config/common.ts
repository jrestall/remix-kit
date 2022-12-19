import { defineUntypedSchema } from 'untyped';
import { join, resolve } from 'pathe';
import { isDebug, isDevelopment } from 'std-env';
import { findWorkspaceDir } from 'pkg-types';

export default defineUntypedSchema({
  /**
   * Extend project from multiple local or remote sources.
   *
   * Value should be either a string or array of strings pointing to source directories or config path relative to current config.
   *
   * You can use `github:`, `gitlab:`, `bitbucket:` or `https://` to extend from a remote git repository.
   *
   * @type {string|string[]}
   *
   */
  extends: null,

  /**
   * Define the root directory of your application.
   *
   * This property can be overwritten (for example, running `remix ./my-app/`
   * will set the `rootDir` to the absolute path of `./my-app/` from the
   * current/working directory.
   *
   * It is normally not needed to configure this option.
   */
  rootDir: {
    $resolve: (val) => (typeof val === 'string' ? resolve(val) : process.cwd()),
  },

  /**
   * Define the workspace directory of your application.
   *
   * Often this is used when in a monorepo setup. Remix will attempt to detect
   * your workspace directory automatically, but you can override it here.
   *
   * It is normally not needed to configure this option.
   */
  workspaceDir: {
    $resolve: async (val, get) =>
      val
        ? resolve(await get('rootDir'), val)
        : await findWorkspaceDir(await get('rootDir')).catch(() =>
            get('rootDir')
          ),
  },

  /**
   * Define the source directory of your Remix application.
   *
   * If a relative path is specified, it will be relative to the `rootDir`.
   *
   * @example
   * ```js
   * export default {
   *   srcDir: 'app/'
   * }
   * ```
   * This would work with the following folder structure:
   * ```bash
   * -| myapp/
   * ---| node_modules/
   * ---| remix.config.js
   * ---| package.json
   * ---| app/
   * ------| routes/
   * ```
   */
  srcDir: {
    $resolve: async (val, get) => resolve(await get('rootDir'), val || '.'),
  },

  /**
   * Define the directory where your built Remix files will be placed.
   *
   * @example
   * ```js
   * export default {
   *   buildDir: 'build'
   * }
   * ```
   */
  buildDir: {
    $resolve: async (val, get) => resolve(await get('rootDir'), val || 'build'),
  },

  /**
   * Used to set the modules directories for path resolving.
   *
   * The configuration path is relative to `options.rootDir` (default is current working directory).
   *
   * Setting this field may be necessary if your project is organized as a yarn workspace-styled mono-repository.
   *
   * @example
   * ```js
   * export default {
   *   modulesDir: ['../../node_modules']
   * }
   * ```
   */
  modulesDir: {
    $default: ['node_modules'],
    $resolve: async (val, get) => [
      ...(await Promise.all(
        val.map(async (dir: string) => resolve(await get('rootDir'), dir))
      )),
      resolve(process.cwd(), 'node_modules'),
    ],
  },

  /**
   * Whether Remix is running in development mode.
   *
   * Normally, you should not need to set this.
   */
  dev: Boolean(isDevelopment),

  /**
   * Whether your app is being unit tested.
   */
  test: Boolean(isDevelopment),

  /**
   * Set to `true` to enable debug mode.
   *
   * At the moment, it prints out hook names and timings on the server, and
   * logs hook arguments as well in the browser.
   *
   */
  debug: {
    $resolve: async (val, get) => val ?? isDebug,
  },

  /**
   * Modules are RemixKit compiler extensions which can extend its core functionality and add endless integrations.
   *
   * Each module is either a string (which can refer to a package, or be a path to a file), a
   * tuple with the module as first string and the options as a second object, or an inline module function.
   *
   * RemixKit tries to resolve each item in the modules array using node require path
   * (in `node_modules`) and then will be resolved from project `srcDir` if `~` alias is used.
   *
   * @note Modules are executed sequentially so the order is important.
   *
   * @example
   * ```js
   * modules: [
   *   // Using package name
   *   '@sentry/remix-kit',
   *   // Relative to your project srcDir
   *   '~/modules/awesome.js',
   *   // Providing options
   *   ['@remix-kit/google-analytics', { ua: 'X1234567' }],
   *   // Inline definition
   *   function () {}
   * ]
   * ```
   * @type {(typeof import('../src/types/module').RemixModule | string | [typeof import('../src/types/module').RemixModule | string, Record<string, any>])[]}
   */
  modules: [],

  /**
   * Customize default directory structure used by Remix.
   *
   * It is better to stick with defaults unless needed.
   */
  dir: {
    /**
     * The assets directory (aliased as `~assets` in your build).
     */
    assets: '_assets',

    /**
     * The directory containing your static files, which will be directly accessible via the Remix server.
     */
    public: {
      $resolve: async (val, get) =>
        val || (await get('dir.static')) || 'public',
    },
  },

  /**
   * The extensions that should be resolved by the Remix resolver.
   */
  extensions: {
    $resolve: (val) =>
      ['.js', '.jsx', '.mjs', '.ts', '.tsx'].concat(val).filter(Boolean),
  },

  /**
   * You can improve your DX by defining additional aliases to access custom directories
   * within your JavaScript and CSS.
   *
   * @note These aliases will be automatically added to the generated `build/tsconfig.json` so you can get full
   * type support and path auto-complete. In case you need to extend options provided by `./build/tsconfig.json`
   * further, make sure to add them here or within the `typescript.tsConfig` property in `remix.config`.
   *
   * @example
   * ```js
   * export default {
   *   alias: {
   *     'images': fileURLToPath(new URL('./assets/images', import.meta.url)),
   *     'style': fileURLToPath(new URL('./assets/style', import.meta.url)),
   *     'data': fileURLToPath(new URL('./assets/other/data', import.meta.url))
   *   }
   * }
   * ```
   *
   * ```html
   * <img src="~images/main-bg.jpg">
   *
   *
   * <script>
   * import data from 'data/test.json'
   * </script>
   *
   * <style>
   * // Uncomment the below
   * //@import '~style/variables.scss';
   * //@import '~style/utils.scss';
   * //@import '~style/base.scss';
   * body {
   *   background-image: url('~images/main-bg.jpg');
   * }
   * </style>
   * ```
   *
   * @type {Record<string, string>}
   */
  alias: {
    $resolve: async (val, get) => ({
      '~~': await get('rootDir'),
      '@@': await get('rootDir'),
      '~': await get('srcDir'),
      '@': await get('srcDir'),
      [await get('dir.assets')]: join(
        await get('srcDir'),
        await get('dir.assets')
      ),
      [await get('dir.public')]: join(
        await get('srcDir'),
        await get('dir.public')
      ),
      ...val,
    }),
  },

  /**
   * Pass options directly to `node-ignore` (which is used by Remix to ignore files).
   *
   * @see [node-ignore](https://github.com/kaelzhang/node-ignore)
   *
   * @example
   * ```js
   * ignoreOptions: {
   *   ignorecase: false
   * }
   * ```
   */
  ignoreOptions: undefined,

  /**
   * Any file in the src directory will be ignored during
   * building if its filename starts with the prefix specified by `ignorePrefix`.
   */
  ignorePrefix: '-',

  /**
   * More customizable than `ignorePrefix`: all files matching glob patterns specified
   * inside the `ignore` array will be ignored in building.
   */
  ignore: {
    $resolve: async (val, get) =>
      [
        '**/*.stories.{js,ts,jsx,tsx}', // ignore storybook files
        '**/*.{spec,test}.{js,ts,jsx,tsx}', // ignore tests
        '**/*.d.ts', // ignore type declarations
        '.output',
        (await get('ignorePrefix')) && `**/${await get('ignorePrefix')}*.*`,
      ]
        .concat(val)
        .filter(Boolean),
  },

  /**
   * The watchers property lets you overwrite watchers configuration in your `remix.config`.
   */
  watchers: {
    /** An array of event types, which, when received, will cause the watcher to restart. */
    rewatchOnRawEvents: undefined,
    /**
     * Options to pass directly to `chokidar`.
     *
     * @see [chokidar](https://github.com/paulmillr/chokidar#api)
     */
    chokidar: {
      ignoreInitial: true,
    },
  },

  /**
   * Hooks are listeners to RemixKit events that are typically used in modules,
   * but are also available in `remix.config`.
   *
   * Internally, hooks follow a naming pattern using colons (e.g., build:done).
   *
   * For ease of configuration, you can also structure them as an hierarchical
   * object in `remix.config` (as below).
   *
   * @example
   * ```js'node:fs'
   * import fs from 'node:fs'
   * import path from 'node:path'
   * export default {
   *   hooks: {
   *     build: {
   *       done(builder) {
   *         const extraFilePath = path.join(
   *           builder.remix.options.buildDir,
   *           'extra-file'
   *         )
   *         fs.writeFileSync(extraFilePath, 'Something extra')
   *       }
   *     }
   *   }
   * }
   * ```
   * @type {typeof import('../src/types/hooks').RemixHooks}
   */
  hooks: null,
});
