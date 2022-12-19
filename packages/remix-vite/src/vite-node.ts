import { createApp, createError, defineEventHandler, fromNodeMiddleware, proxyRequest } from 'h3';
import { ViteNodeServer } from 'vite-node/server';
import type { ViteBuildContext } from './vite';
import { createIsExternal } from './utils/external';
import type { Connect, ModuleNode, ViteDevServer } from 'vite';
import { logger } from '@remix-kit/kit';
import type { VitePlugin } from 'unplugin';

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
      const mods = server.moduleGraph.getModulesByFile(file) || [];
      for (const mod of mods) {
        markInvalidate(mod);
      }
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
    let result = await isExternal(id);
    if (result?.external) {
      return id;
    }
    return false;
  };

  return node;
}

function createDevServerApp(ctx: ViteBuildContext, node: ViteNodeServer) {
  const app = createApp();

  app.use(
    '/build/manifest-dev.js',
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
      const moduleId = decodeURI(event.node.req.url!).substring(1);
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
  app.use(
    '/',
    defineEventHandler((event) => {
      logRequestInfo(event.node.req);
      return proxyRequest(event, 'http://localhost:3001' + event.path, {
        fetch,
        sendStream: true,
      }).catch((err) => {
        const errorData = {
          code: 'VITE_ERROR',
          path: event.path,
          stack: '',
          ...err,
        };
        throw createError({ data: errorData });
      });
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
  const node = createNodeServer(ctx.ssrServer!, ctx);
  const app = createDevServerApp(ctx, node);
  ctx.remix.server = app;
}
