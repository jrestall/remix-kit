import type { AssetsManifest, RemixOptions } from '@remix-kit/schema';
import type { ConfigRoute } from '@remix-run/dev/dist/config/routes.js';
import { resolve } from 'pathe';

export function createServerManifest(options: RemixOptions, manifest?: AssetsManifest): string {
  const routeImports = Object.values(options.routes).map((route, index) => {
    return `import * as route${index} from "${resolve(options.appDirectory, route.file)}";`;
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
  return `
      import * as entryServer from "${resolve(options.appDirectory, options.entryServerFile)}";
      ${routeImports.join('\n')}
      export const assetsBuildDirectory = ${JSON.stringify(options.relativeAssetsBuildDirectory)};
      export const future = ${JSON.stringify(options.future)};
      export const publicPath = ${JSON.stringify(options.publicPath)};
      export const entry = { module: entryServer };
      export const routes = {
        ${routes.join(',\n  ')}
      };
      export const assets = ${JSON.stringify(manifest)};
    `;
}

export function createEntryRoute(
  route: ConfigRoute,
  routeModule: string,
  routeExports: string[],
  routeImports?: string[],
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
