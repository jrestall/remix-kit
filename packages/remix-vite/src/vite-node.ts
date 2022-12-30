import {
  createApp,
  createError,
  defineEventHandler,
  fromNodeMiddleware,
  proxyRequest,
  toNodeListener,
} from 'h3';
import { ViteNodeServer } from 'vite-node/server';
import type { ViteBuildContext } from './vite';
import { createIsExternal } from './utils/external';
import type { Connect, ModuleNode, ViteDevServer } from 'vite';
import { logger } from '@remix-kit/kit';
import type { VitePlugin } from 'unplugin';
import { writeFile } from 'fs-extra';
import { fileURLToPath, resolve as resolveModule } from 'mlly';
import { join, resolve } from 'pathe';
import { distDir } from './dirs';
import { createWebSocketServer } from './vite-server';
import nodeFetch from 'node-fetch-native';
import { removeExperimentalFetchWarnings } from './utils/node-patch';

// Store the invalidates for the next rendering
const invalidates = new Set<string>();

export function viteNodePlugin(ctx: ViteBuildContext): VitePlugin {
  function markInvalidate(mod: ModuleNode) {
    if (!mod.id) {
      return;
    }
    if (invalidates.has(mod.id)) {
      return;
    }
    invalidates.add(mod.id);
    for (const importer of mod.importers) {
      markInvalidate(importer);
    }
  }

  return {
    name: 'remix:vite-node-server',
    enforce: 'post',
    async configureServer(server) {
      // Invalidate server build when manifest rebuilt
      ctx.remix.hook('build:assetsManifest', () => {
        for (const [id, mod] of server.moduleGraph.idToModuleMap) {
          if (id.startsWith('@remix-run/dev/server-build')) {
            markInvalidate(mod);
          }
        }
      });
    },
    handleHotUpdate({ file, server }) {
      let mods = ctx.ssrServer?.moduleGraph.getModulesByFile(file);
      if (!mods) {
        mods = server.moduleGraph.getModulesByFile(file);
      }
      if (!mods) return;
      for (const mod of mods) {
        markInvalidate(mod);
      }
      if (ctx.wsServer) ctx.wsServer.handleUpdates(invalidates);
    },
  };
}

function createNodeServer(viteServer: ViteDevServer, ctx: ViteBuildContext) {
  const node: ViteNodeServer = new ViteNodeServer(viteServer, {
    deps: {
      inline: [/^#/, ...(ctx.remix.options.build.transpile as string[])],
    },
    transformMode: {
      web: [/entry.client.tsx/],
      ssr: [/.*/],
    },
  });
  const isExternal = createIsExternal(viteServer, ctx.remix.options.rootDir);
  node.shouldExternalize = async (id: string) => {
    const result = await isExternal(id);
    if (result?.external) {
      const module = await resolveModule(result.id, { url: ctx.remix.options.modulesDir });
      return fileURLToPath(module);
    }
    return false;
  };

  return node;
}

function createDevServerApp(ctx: ViteBuildContext, node: ViteNodeServer) {
  const app = createApp();

  app.use(
    '/app/manifest-dev.js',
    defineEventHandler(async (event) => {
      event.node.res.setHeader('Content-Type', 'application/javascript');
      return `window.__remixManifest=${JSON.stringify(ctx.remix._assetsManifest)};`;
    })
  );

  app.use(
    '/__remix_dev_server__/invalidates',
    defineEventHandler(() => {
      const ids = Array.from(invalidates);
      invalidates.clear();
      return ids;
    })
  );

  app.use(
    '/__remix_dev_server__/module',
    defineEventHandler(async (event) => {
      const moduleId = decodeURIComponent(event.node.req.url!).substring(1);
      if (moduleId === '/') {
        throw createError({ statusCode: 400 });
      }
      const module = await node.fetchModule(moduleId).catch((err) => {
        const errorData = {
          code: 'VITE_ERROR',
          id: moduleId,
          stack: '',
          ...err,
        };
        throw createError({ data: errorData });
      });
      return module;
    })
  );

  app.use(fromNodeMiddleware(ctx.clientServer!.middlewares));

  // Proxy all other requests through to the Remix application
  removeExperimentalFetchWarnings();
  app.use(
    '/',
    defineEventHandler(async (event) => {
      logRequestInfo(event.node.req);

      if (!process.env.ORIGIN_SERVER || process.env.ORIGIN_SERVER === 'undefined') {
        const message =
          "No 'dev:server' npm script found in package.json or --origin flag specified to 'remix-kit dev'. " +
          "Dev server can't proxy requests to Remix server without a configured origin server.";
        logger.error(message);

        const errorData = {
          code: 'VITE_ERROR',
          path: event.path,
          stack: '',
          message,
        };
        throw createError({ data: errorData });
      }

      await proxyRequest(event, process.env.ORIGIN_SERVER + event.node.req.url, {
        fetch: nodeFetch,
        sendStream: event.node.req.method === 'GET',
      }).catch((err) => {
        const errorData = {
          code: 'VITE_ERROR',
          path: event.path,
          stack: '',
          ...err,
        };
        throw createError({ data: errorData });
      });

      // h3's proxyRequest doesn't end the proxy response
      // when there is no body for a 204 response.
      if (event.node.res.statusCode === 204) {
        event.node.res.end();
      }
    })
  );

  return app;
}

function logRequestInfo(req: Connect.IncomingMessage) {
  if (!req.url || !req.headers.host) return;

  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method !== 'GET' && req.method !== 'OPTIONS' && req.method !== 'CONNECT') {
    logger.info(`Action request (${req.url})`);
  } else if (url.searchParams.has('_data')) {
    logger.info(`Loader request (${url.searchParams.get('_data')})`);
  } else {
    logger.info(`Document request (${req.url})`);
  }
}

export async function initViteNodeServer(ctx: ViteBuildContext) {
  const defaultServerEntryPoint = join(distDir, 'compiler', 'defaults', 'server-entry.js');
  const serverEntry = ctx.remix.options.serverEntryPoint
    ? resolve(ctx.remix.options.rootDir, ctx.remix.options.serverEntryPoint)
    : defaultServerEntryPoint;

  // Serialize and pass dev server options for the client runner
  // These will be passed as environment variables when we create the child process.
  const devServerOptions = {
    baseURL: `${ctx.remix.options.devServer.url}__remix_dev_server__/`,
    root: ctx.remix.options.srcDir,
    base: ctx.ssrServer!.config.base,
    serverEntryPoint: serverEntry,
    wssPort: 24688,
  };
  process.env.REMIX_DEV_SERVER_OPTIONS = JSON.stringify(devServerOptions);

  if (!ctx.wsServer) {
    const wsServer = await createWebSocketServer();
    devServerOptions.wssPort = wsServer.port;
    ctx.wsServer = wsServer;
  }

  const node = createNodeServer(ctx.ssrServer!, ctx);
  const app = createDevServerApp(ctx, node);
  ctx.remix.server = toNodeListener(app);

  const serverEntryPath = resolve(distDir, 'runtime/dev-server-entry.js');
  const serverBuildPath = ctx.remix.options.serverBuildPath;

  await writeFile(serverBuildPath, `module.exports = require(${JSON.stringify(serverEntryPath)});`);

  // Immediately start warming up the vite-node server cache
  node.fetchModule('@remix-run/dev/server-build').catch(logger.error);
}
