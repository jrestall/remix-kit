import { basename, dirname, resolve } from 'pathe';
import * as vite from 'vite';
import type { ServerOptions } from 'vite';
import { logger } from '@remix-kit/kit';
import { getPort } from 'get-port-please';
import { defu } from 'defu';
import type { ViteBuildContext, ViteOptions } from '../vite';
import type { Remix } from '@remix-kit/schema';
import nodeResolve from '@rollup/plugin-node-resolve';
import { viteNodePlugin } from '../vite-node';
import { isRelative } from 'ufo';

export async function buildClient(ctx: ViteBuildContext) {
  // TODO: async entry support for module federation
  const routes = getRemixRoutes(ctx.remix);
  const clientConfig: vite.InlineConfig = vite.mergeConfig(ctx.config, {
    define: {
      'process.server': false,
      'process.client': true,
      'module.hot': false,
    },
    ssr: {
      noExternal: [],
    },
    build: {
      sourcemap: ctx.remix.options.sourcemap.client ? ctx.config.build?.sourcemap ?? true : false,
      assetsDir: '',
      outDir: ctx.remix.options.relativeAssetsBuildDirectory,
      rollupOptions: {
        preserveEntrySignatures: 'allow-extension',
        input: {
          'entry.client': resolve(
            ctx.remix.options.appDirectory,
            ctx.remix.options.entryClientFile
          ),
          ...Object.fromEntries(routes),
        },
      },
      plugins: [
        nodeResolve({
          browser: true,
          extensions: ['.js', '.json', '.jsx', '.ts', '.tsx'],
          preferBuiltins: false,
        }),
      ],
    },
    plugins: [viteNodePlugin(ctx)],
    appType: 'custom',
    server: {
      middlewareMode: true,
    },
  } as ViteOptions);

  // In build mode we explicitly override any vite options that vite is relying on
  // to detect whether to inject production or development code (such as HMR code)
  if (!ctx.remix.options.dev) {
    clientConfig.server!.hmr = false;
  }

  if (clientConfig.server && clientConfig.server.hmr !== false) {
    const hmrPortDefault = 24679; // Vite's default HMR port 24678
    const hmrPort = await getPort({
      port: hmrPortDefault,
      ports: Array.from({ length: 20 }, (_, i) => hmrPortDefault + 1 + i),
    });
    clientConfig.server = defu(clientConfig.server, {
      https: ctx.remix.options.devServer.https,
      hmr: {
        protocol: ctx.remix.options.devServer.https ? 'wss' : 'ws',
        port: hmrPort,
      },
    } as ServerOptions);
  }

  // Add analyze plugin if needed
  if (ctx.remix.options.build.analyze) {
    clientConfig.plugins!.push(
      ...(await import('./plugins/analyze').then((r) => r.analyzePlugin(ctx)))
    );
  }

  await ctx.remix.callHook('vite:extendConfig', clientConfig, { isClient: true, isServer: false });

  if (ctx.remix.options.dev) {
    // Dev
    await ctx.remix.callHook('vite:serverCreating', clientConfig, {
      isClient: true,
      isServer: false,
    });
    const viteServer = await vite.createServer(clientConfig);
    await ctx.remix.callHook('vite:serverCreated', viteServer, { isClient: true, isServer: false });
    ctx.clientServer = viteServer;

    ctx.remix.hook('close', async () => {
      await viteServer.close();
    });
  } else {
    // Build
    const start = Date.now();
    await vite.build(clientConfig);
    await ctx.remix.callHook('vite:compiled');
    logger.success(`Client built in ${Date.now() - start}ms`);
  }
}

function getRemixRoutes(remix: Remix) {
  return Object.entries(remix.options.routes).map(([id, route]) => {
    const routeId = isRelative(id) ? 'routes' + id.split('routes')[1] : id;
    return [
      routeId,
      resolve(remix.options.appDirectory, dirname(route.file), basename(route.file)),
    ];
  });
}
