import { createUnplugin } from 'unplugin';
import { logger } from '../..';

// Replaces a module with an empty module if its id includes the given target string.

interface EmptyModulePluginOptions {
  target: string;
}

export const EmptyModule = createUnplugin(function (options: EmptyModulePluginOptions) {
  return {
    name: 'remix:empty-module',
    loadInclude(id: string) {
      return id.includes(options.target);
    },
    load(id) {
      logger.debug(`[EmptyModule Vite Plugin] Made module ${id} empty.`)
      return {
        code: 'export default {}',
        map: { mappings: '' },
        syntheticNamedExports: true,
      };
    },
  };
});
