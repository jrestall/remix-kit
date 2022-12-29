import type { AssetsManifest as RemixAssetsManifest, Remix, RemixOptions } from '@remix-kit/schema';
import type { OutputBundle, RenderedModule } from 'rollup';
import { createUnplugin } from 'unplugin';
import { createHash } from 'crypto';
import * as path from 'path';
import { createEntryRoute } from '../../utils/manifest';

export const AssetsManifest = createUnplugin(function (remix: Remix) {
  let fileName = 'manifest-[hash].js';
  const globalVar = '__remixManifest';
  return {
    name: 'remix:asset-manifest',
    vite: {
      async generateBundle(this, _options, bundle) {
        const manifest = getAssetsManifest(bundle, remix.options.routes, remix.options);

        // Store the client asset manifest so that the server build can use it in server-manifest.ts
        remix._assetsManifest = manifest;

        fileName = fileName.replace('[hash]', manifest.version);

        manifest.url = createUrl(remix.options.publicPath, fileName);

        // Emit the manifest for direct consumption by the browser.
        const source = getGlobalScript(manifest, globalVar);

        await remix.callHook('build:assetsManifest', manifest);

        this.emitFile({ type: 'asset', fileName, source });
      },
    },
  };
});

function getAssetsManifest(
  bundle: OutputBundle,
  routeManifest: RemixOptions['routes'],
  options: RemixOptions
): RemixAssetsManifest {
  const routeIds = Object.keys(routeManifest);
  let entry: RemixAssetsManifest['entry'] = { module: '', imports: [] };
  const routes: RemixAssetsManifest['routes'] = Object.create(null);

  for (const key in bundle) {
    const chunk = bundle[key];
    if (chunk.type !== 'chunk') continue;

    if (chunk.name === 'entry.client') {
      entry = {
        module: createUrl(options.publicPath, chunk.fileName),
        imports: chunk.imports.map((file) => createUrl(options.publicPath, file)),
      };
    } else if (routeIds.includes(chunk.name) && chunk.facadeModuleId?.endsWith('?route')) {
      const route = routeManifest[chunk.name];

      // When we build route modules, we put a shim in front that ends with a ?route
      // string. Removing this suffix gets us back to the original source module id.
      const sourceModuleId = chunk.facadeModuleId.replace('?route', '');

      // Usually the source module will be contained in this chunk, but if
      // someone imports a route module from within another route module, Rollup
      // will place the source module in a shared chunk. So we have to go find
      // the chunk with the source module in it. If the source module was empty,
      // it will have the ?empty-route-module suffix on it.
      const sourceModule =
        chunk.modules[sourceModuleId] ||
        chunk.modules[sourceModuleId + '?empty-route'] ||
        findRenderedModule(bundle, sourceModuleId) ||
        findRenderedModule(bundle, sourceModuleId + '?empty-route');

      const routeModule = createUrl(options.publicPath, chunk.fileName);
      const routeExports = sourceModule.removedExports;
      const routeImports = chunk.imports.map((file) => createUrl(options.publicPath, file));
      routes[route.id] = createEntryRoute(route, routeModule, routeExports, routeImports);
    }
  }

  const version = getBundleHash(bundle).slice(0, 8);
  return {
    version,
    entry,
    routes,
  };
}

function createUrl(publicPath: string, file: string): string {
  return publicPath.split(path.win32.sep).join('/') + (file || '').split(path.win32.sep).join('/');
}

function findRenderedModule(bundle: OutputBundle, name: string): RenderedModule | undefined {
  for (const key in bundle) {
    const chunk = bundle[key];
    if (chunk.type === 'chunk' && name in chunk.modules) {
      return chunk.modules[name];
    }
  }
}

export function getBundleHash(bundle: OutputBundle): string {
  const hash = createHash('sha1');

  for (const key of Object.keys(bundle).sort()) {
    const output = bundle[key];
    hash.update(output.type === 'asset' ? output.source : output.code);
  }

  return hash.digest('hex');
}

function getGlobalScript(manifest: RemixAssetsManifest, globalVar: string): string {
  return `window.${globalVar}=${JSON.stringify(manifest)};`;
}
