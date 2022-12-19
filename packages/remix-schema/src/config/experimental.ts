import { defineUntypedSchema } from 'untyped';

export default defineUntypedSchema({
  experimental: {
    /**
     * Set to true to generate an async entry point for the bundle (for module federation support).
     */
    asyncEntry: {
      $resolve: (val) => val ?? false,
    },
  },
});
