import type { AssetsManifest, RemixOptions } from '@remix-kit/schema';
import type { ConfigRoute } from '@remix-run/dev/dist/config/routes.js';
import { join } from 'pathe';

export function createServerManifest(options: RemixOptions, manifest?: AssetsManifest): string {
  const routeImports = Object.values(options.routes).map((route, index) => {
    // unbuild's cjsBridge import matching finds this code string incorrectly, so we break it up to not match.
    // https://github.com/unjs/unbuild/blob/973b144978134ca7b78eb4c7da9f5e0b49e7ae3f/src/builder/plugins/cjs.ts#L36
    // eslint-disable-next-line no-useless-concat
    return `import * as route${index} from ` + `"${createPath(options, route.file)}";`;
  });
  const routes = Object.entries(options.routes).map(([routeId, route], index) => {
    return `${JSON.stringify(routeId)}: {
          id: ${JSON.stringify(route.id)},
          parentId: ${JSON.stringify(route.parentId)},
          path: ${JSON.stringify(route.path)},
          index: ${JSON.stringify(route.index)},
          caseSensitive: ${JSON.stringify(route.caseSensitive)},
          module: route${index}
        }`;
  });
  // eslint-disable-next-line no-useless-concat
  return (
    `import * as entryServer from ` +
    `"${createPath(options, options.entryServerFile)}";
      ${routeImports.join('\n')}
      export const assetsBuildDirectory = ${JSON.stringify(options.relativeAssetsBuildDirectory)};
      export const future = ${JSON.stringify(options.future)};
      export const publicPath = ${JSON.stringify(options.publicPath)};
      export const entry = { module: entryServer };
      export const routes = {
        ${routes.join(',\n  ')}
      };
      export const assets = ${JSON.stringify(manifest)};
    `
  );
}

export function createEntryRoute(
  route: ConfigRoute,
  routeModule: string,
  routeExports: string[],
  routeImports?: string[]
) {
  return {
    id: route.id,
    parentId: route.parentId,
    path: route.path,
    index: route.index,
    caseSensitive: route.caseSensitive,
    module: routeModule,
    imports: routeImports || [],
    hasAction: routeExports.includes('action'),
    hasLoader: routeExports.includes('loader'),
    hasCatchBoundary: routeExports.includes('CatchBoundary'),
    hasErrorBoundary: routeExports.includes('ErrorBoundary'),
  };
}

function createPath(options: RemixOptions, file: string): string {
  return join('/', options.appDirectory, file);
}
