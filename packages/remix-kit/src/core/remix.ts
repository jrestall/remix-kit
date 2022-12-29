import { join, normalize, resolve } from 'pathe';
import { createHooks, createDebugger } from 'hookable';
import type { Remix, RemixOptions, RemixHooks } from '@remix-kit/schema';
import fse from 'fs-extra';
import { pkgDir } from '../dirs';
import { version } from '../../package.json';
import { addModuleTranspiles } from './modules';
import type { LoadRemixConfigOptions } from './config';
import { loadRemixConfig } from './config';
import { remixCtx } from '../context';
import { installModule } from '../module/install';
import { addVitePlugin } from '../build';
import { BuildRouteLoader } from './plugins/build-route-loader';
import { DevRouteLoader } from './plugins/dev-route-loader';
import { EmptyModule } from './plugins/empty-module';
import { AssetsManifest } from './plugins/assets-manifest';
import { ServerManifest } from './plugins/server-manifest';
import { loadRenderer } from './renderer';
import { CssImportUrl } from './plugins/css-import-url';

export interface LoadRemixOptions extends LoadRemixConfigOptions {
  /** Load remix in development mode */
  dev?: boolean;

  /** Use lazy initialization of remix if set to false */
  ready?: boolean;
}

export function createRemix(options: RemixOptions): Remix {
  const hooks = createHooks<RemixHooks>();

  const remix: Remix = {
    _version: version,
    options,
    hooks,
    callHook: hooks.callHook,
    addHooks: hooks.addHooks,
    hook: hooks.hook,
    ready: () => initRemix(remix),
    close: () => Promise.resolve(hooks.callHook('close', remix)),
    vfs: {},
  };

  return remix;
}

async function initRemix(remix: Remix) {
  // Register user hooks
  remix.hooks.addHooks(remix.options.hooks);

  // Set remix instance for useRemix
  remixCtx.set(remix);
  remix.hook('close', () => remixCtx.unset());

  // Add remix types
  remix.hook('prepare:types', (opts) => {
    opts.references.push({ types: '@remix-run/dev' });
    opts.references.push({ types: '@remix-run/node' });
    opts.references.push({ types: 'vite/client' });
    // Add module augmentations directly to RemixConfig
    opts.references.push({
      path: resolve(remix.options.buildDir, 'types/schema.d.ts'),
    });

    for (const layer of remix.options._layers) {
      const declaration = join(layer.cwd, 'index.d.ts');
      if (fse.existsSync(declaration)) {
        opts.references.push({ path: declaration });
      }
    }
  });

  // Include server manifest in server bundle
  addVitePlugin(ServerManifest.vite(remix), { client: false });

  // Ignore '.server.' files in client bundles
  addVitePlugin(EmptyModule.vite({ target: `.server.` }), { server: false });

  // Ignore '.client.' files in server bundles
  addVitePlugin(EmptyModule.vite({ target: `.client.` }), { client: false });

  // Tree-shake routes for browser builds
  addVitePlugin(BuildRouteLoader.vite(remix), { server: false });

  // Tree-shake routes during development for browser requests
  addVitePlugin(DevRouteLoader.vite(remix), { server: false });

  // Generate browser asset manifest
  addVitePlugin(AssetsManifest.vite(remix), { server: false });

  // Import CSS as URL by default. Added seperately to be added last in client/server plugins.
  addVitePlugin(CssImportUrl.vite(remix), { client: false });
  addVitePlugin(CssImportUrl.vite(remix), { server: false });

  // Transpile layers within node_modules
  remix.options.build.transpile.push(
    ...remix.options._layers
      .filter((i) => i.cwd.includes('node_modules'))
      .map((i) => i.cwd as string)
  );

  // Init user modules
  await remix.callHook('modules:before');

  const modulesToInstall = [...remix.options.modules, ...remix.options._modules];
  for (const m of modulesToInstall) {
    if (Array.isArray(m)) {
      await installModule(m[0], m[1]);
    } else {
      await installModule(m, {});
    }
  }

  await remix.callHook('modules:done');

  // Normalize windows transpile paths added by modules
  remix.options.build.transpile = remix.options.build.transpile.map((t: any) =>
    typeof t === 'string' ? normalize(t) : t
  );

  addModuleTranspiles();

  await remix.callHook('ready', remix);
}

export async function loadRemix(opts: LoadRemixOptions): Promise<Remix> {
  // Apply dev as config override
  opts.overrides = opts.overrides || {};
  opts.overrides.dev = !!opts.dev;

  const options = await loadRemixConfig(opts);

  options.appDir = options.alias['#app'] = resolve(options.srcDir, 'app');
  options.modulesDir.push(resolve(options.workspaceDir, 'node_modules'));
  options.modulesDir.push(resolve(pkgDir, 'node_modules'));

  const remix = createRemix(options);

  if (remix.options.debug) {
    createDebugger(remix.hooks, { tag: 'remix' });
  }

  // Load the UI library e.g. @remix-kit/react or @remix-kit/vue
  await loadRenderer(remix);

  if (opts.ready !== false) {
    await remix.ready();
  }

  return remix;
}
