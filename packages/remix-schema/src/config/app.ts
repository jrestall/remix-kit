import { defineUntypedSchema } from 'untyped';

export default defineUntypedSchema({
  /**
   * Remix App configuration.
   */
  app: {
    /**
     * The base path of your Remix application.
     *
     * This can be set at runtime by setting the REMIX_APP_BASE_URL environment variable.
     * @example
     * ```bash
     * REMIX_APP_BASE_URL=/prefix/ node .output/server/index.mjs
     * ```
     */
    baseURL: {
      $resolve: async (val) => val || process.env.REMIX_APP_BASE_URL || '/',
    },

    /** The folder name for the built site assets, relative to `baseURL` (or `cdnURL` if set). This is set at build time and should not be customized at runtime. */
    buildAssetsDir: {
      $resolve: async (val) => val || process.env.REMIX_APP_BUILD_ASSETS_DIR || '/build/',
    },

    /**
     * An absolute URL to serve the public folder from (production-only).
     *
     * This can be set to a different value at runtime by setting the `REMIX_APP_CDN_URL` environment variable.
     * @example
     * ```bash
     * REMIX_APP_CDN_URL=https://mycdn.org/ node .output/server/index.mjs
     * ```
     */
    cdnURL: {
      $resolve: async (val, get) =>
        (await get('dev')) ? '' : (process.env.REMIX_APP_CDN_URL ?? val) || '',
    },
  },
});
