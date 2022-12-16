import { defineUntypedSchema } from 'untyped';

export default defineUntypedSchema({
  experimental: {
    /**
     * Set to true to generate an async entry point for the bundle (for module federation support).
     */
    asyncEntry: {
      $resolve: (val) => val ?? false,
    },

    /**
     * Inline styles when rendering HTML (currently vite only).
     *
     * @type {boolean}
     */
    inlineSSRStyles: {
      async $resolve(val, get) {
        if (
          val === false ||
          (await get('dev')) ||
          (await get('ssr')) === false
        ) {
          return false;
        }
        // Enabled by default for vite prod with ssr
        return val ?? true;
      },
    },

    /**
     * Turn off rendering of Remix scripts.
     */
    noScripts: false,
  },
});
