import { defineUntypedSchema } from 'untyped';

export default defineUntypedSchema({
  devServer: {
    /**
     * Whether to enable HTTPS.
     *
     * @example
     * ```
     * import { fileURLToPath } from 'node:url'
     * export default {
     *   server: {
     *     https: {
     *       key: fs.readFileSync(fileURLToPath(new URL('./server.key', import.meta.url))),
     *       cert: fs.readFileSync(fileURLToPath(new URL('./server.crt', import.meta.url)))
     *     }
     *   }
     * }
     * ```
     *
     *
     * @type {false | { key: string; cert: string }}
     *
     */
    https: false,

    /** Dev server listening port */
    port: process.env.REMIX_PORT || process.env.PORT || 3005,

    /** Dev server listening host */
    host: process.env.REMIX_HOST || process.env.HOST || 'localhost',

    /**
     * Listening dev server url
     */
    url: 'http://localhost:3005',

    /**
     * Whether to automatically inject the HMR refresh component e.g. <ReactRefresh />.
     */
    injectRefresh: true,
  },
});
