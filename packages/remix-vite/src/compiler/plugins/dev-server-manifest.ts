import type { AssetsManifest, Remix, RemixOptions } from '@remix-kit/schema';
import { resolve, relative } from 'pathe';
import { getRouteExports, createServerManifest, createEntryRoute } from '@remix-kit/kit';
import type { ViteDevServer, Plugin } from 'vite';
import { joinUrlSegments } from '../../utils/url';

// Since @remix-run/dev/server-build looks like a normal non-virtual or '\0'
// prefixed module, if we don't execute this plugin first as 'pre' to claim
// the module then the core plugins will.
export function devServerManifestPre(remix: Remix): Plugin {
  let virtualServerBuildId = '@remix-run/dev/server-build';
  const resolvedVirtualServerBuildId = '\0' + virtualServerBuildId;
  let server: ViteDevServer;
  return {
    name: 'remix:server-manifest-dev-temp',
    enforce: 'pre',
    apply: 'serve',
    configureServer(_server: ViteDevServer) {
      server = _server;
    },
    resolveId(id) {
      if (id === virtualServerBuildId) {
        return resolvedVirtualServerBuildId;
      }
      return null;
    },
    load(id) {
      if (id === resolvedVirtualServerBuildId) {
        // Return the initial manifest so that imports are generated and vite resolves the new
        // route dependencies from the imports in the generated server manifest.
        //  We then transform this module to add the asset manifest.
        if (!remix._assetsManifest) {
          const routes: AssetsManifest['routes'] = {};
          const remixRoutes = Object.entries(remix.options.routes);
          for (const [id, route] of remixRoutes) {
            const routeModule = createUrl(remix.options, server.config.base, route.file);
            routes[id] = createEntryRoute(route, routeModule, []);
          }
          remix._assetsManifest = createDevAssetsManifest(
            remix.options,
            server.config.base,
            routes
          );
        }
        return createServerManifest(remix.options, remix._assetsManifest);
      }
    },
  };
}

export function devServerManifest(remix: Remix): Plugin {
  let virtualServerBuildId = '@remix-run/dev/server-build';
  const resolvedVirtualServerBuildId = '\0' + virtualServerBuildId;
  let server: ViteDevServer;
  return {
    name: 'remix:dev-server-manifest',
    apply: 'serve',
    configureServer(_server: ViteDevServer) {
      server = _server;
    },
    async transform(code, id) {
      let routes = Object.values(remix.options.routes);
      const route = routes.find((r) => id.endsWith(r.file));
      if (!route) return;

      const [, exports] = await getRouteExports(code);
      if (!exports || !exports.length) return;

      const updatedExports = exports.map((e) => e.n);
      const existingRoute = remix._assetsManifest?.routes[route.id];
      const routeModule =
        existingRoute?.module ?? createUrl(remix.options, server.config.base, route.file);
      const updatedRoute = createEntryRoute(route, routeModule, updatedExports);

      remix._assetsManifest =
        remix._assetsManifest ?? createDevAssetsManifest(remix.options, server.config.base);
      remix._assetsManifest.routes[route.id] = updatedRoute;

      const serverBuildModule = server.moduleGraph.getModuleById(resolvedVirtualServerBuildId);
      if (serverBuildModule) server.moduleGraph.invalidateModule(serverBuildModule);
    },
  };
}

export function createDevAssetsManifest(
  options: RemixOptions,
  base: string,
  routes?: AssetsManifest['routes']
): AssetsManifest {
  return {
    version: 'dev',
    entry: {
      module: createUrl(options, base, options.entryClientFile),
      imports: [],
    },
    routes: routes ?? {},
    url: createUrl(options, base, 'manifest-dev.js'),
  };
}

function createUrl(options: RemixOptions, base: string, file: string): string {
  const absolutePath = resolve(options.appDirectory, file);
  const relativePath = relative(options.rootDirectory, absolutePath);
  return joinUrlSegments(base, relativePath);
}
