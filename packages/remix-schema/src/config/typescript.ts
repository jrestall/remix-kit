import { defineUntypedSchema } from 'untyped';

export default defineUntypedSchema({
  /**
   * Configuration for Remix's TypeScript integration.
   */
  typescript: {
    /**
     * TypeScript comes with certain checks to give you more safety and analysis of your program.
     * Once you’ve converted your codebase to TypeScript, you can start enabling these checks for greater safety.
     * [Read More](https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html#getting-stricter-checks)
     */
    strict: true,

    /**
     * Include parent workspace in the Remix project. Mostly useful for module authors.
     */
    includeWorkspace: false,

    /**
     * Enable build-time type checking.
     *
     * If set to true, this will type check in development. You can restrict this to build-time type checking by setting it to `build`.
     * Requires to install `typescript` as dev dependencies.
     *
     * @type {boolean | 'build'}
     */
    typeCheck: false,

    /**
     * You can extend generated `build/tsconfig.json` using this option.
     * @type {typeof import('pkg-types')['readPackageJSON']}
     */
    tsConfig: {},
  },
});
