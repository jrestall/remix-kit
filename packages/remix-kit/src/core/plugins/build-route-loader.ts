import type { Remix } from '@remix-kit/schema';
import { createUnplugin } from 'unplugin';

// Tree shakes server code out of the routes for the browser bundle by wrapping
// each in a virtual route module that only imports the browser exports.

// The leading \0 instructs other plugins not to try
// to resolve, load or transform our proxy modules.
const VIRTUAL_PREFIX = '\0virtual:';
const VIRTUAL_SUFFIX = '?route';

const BROWSER_EXPORTS = [
  'CatchBoundary',
  'ErrorBoundary',
  'default',
  'handle',
  'links',
  'meta',
  'unstable_shouldReload',
] as const;

export const BuildRouteLoader = createUnplugin(function (remix: Remix) {
  return {
    name: 'remix:build-route-loader',
    enforce: 'pre',
    vite: {
      apply: 'build',
      buildStart(this, options) {
        let input = options.input;
        // Make all browser route entries virtual so they can be proxied and tree shaken.
        if (input && typeof input === 'object' && !Array.isArray(input)) {
          let routeIds = Object.keys(remix.options.routes);

          for (let alias in input) {
            if (routeIds.includes(alias)) {
              input[alias] = VIRTUAL_PREFIX + input[alias];
            }
          }
        }
      },
      async resolveId(id, importer, options) {
        // Confirm any virtual routes e.g. id = \0virtual:/routes/index.tsx
        if (id.startsWith(VIRTUAL_PREFIX)) {
          const resolveId = id.slice(VIRTUAL_PREFIX.length);
          return { id: `${resolveId}${VIRTUAL_SUFFIX}`, moduleSideEffects: true };
        }

        // When the real route is being resolved, set syntheticNamedExports to true
        // so that even if a route doesn't implement an export, rollup won't complain.
        // e.g. id = /routes/index.tsx, importer = /routes/index.tsx?route
        if (
          importer &&
          importer.endsWith(VIRTUAL_SUFFIX) &&
          importer.slice(0, -VIRTUAL_SUFFIX.length) === id
        ) {
          const resolution = await this.resolve(id, importer, { skipSelf: true, ...options });
          if (resolution && !resolution.external) {
            // https://rollupjs.org/guide/en/#synthetic-named-exports
            resolution.syntheticNamedExports = true;
            resolution.moduleSideEffects = true;
          }

          // As we already fully resolved the module, there is no reason to resolve it again
          return resolution;
        }

        return null;
      },
      load(id) {
        if (id.endsWith(VIRTUAL_SUFFIX)) {
          const routePath = id.slice(0, -VIRTUAL_SUFFIX.length);
          const virtualModule = `export { ${BROWSER_EXPORTS.join(', ')} } from "${routePath}";`;
          return { code: virtualModule, moduleSideEffects: true };
        }

        return null;
      },
    },
  };
});
