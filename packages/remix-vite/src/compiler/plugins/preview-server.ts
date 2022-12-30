import { logger } from '@remix-kit/kit';
import type { Remix } from '@remix-kit/schema';
import type { ServerBuild } from '@remix-run/server-runtime';
import { createRequestHandler } from '@remix-run/server-runtime';
import { createServerAdapter } from '@whatwg-node/server';
import type { Plugin } from 'vite';
import { waitUntil } from 'async-wait-until';

export async function previewServer(remix: Remix): Promise<Plugin> {
  const build = (await import(remix.options.serverBuildPath)).default as ServerBuild;

  try {
    await waitUntil(() => build.routes, { timeout: 6000, intervalBetweenAttempts: 30 });
  } catch (err: unknown) {
    logger.error(
      `Couldn't find exported server build from ${remix.options.serverBuildPath}.\n` +
        `If using your own server file, you need to include "export * from '@remix-run/dev/server-build';".`
    );
  }

  const requestHandler = createRequestHandler(build, process.env.NODE_ENV);
  const nodeServerAdapter = createServerAdapter(requestHandler);

  return {
    name: 'remix:preview-server',
    configurePreviewServer(server) {
      return () => {
        // We use @whatwg-node/server to translate the node http.IncomingMessage
        // request to a server agnostic Fetch Request that Remix understands.
        server.middlewares.use(nodeServerAdapter);
      };
    },
  };
}
