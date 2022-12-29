import type { AddressInfo } from 'node:net';
import type { RequestListener } from 'node:http';
import { resolve, relative, normalize } from 'pathe';
import chokidar from 'chokidar';
import { debounce } from 'perfect-debounce';
import type { Remix } from '@remix-kit/schema';
import consola from 'consola';
import { withTrailingSlash } from 'ufo';
import { setupDotenv } from 'c12';
import { showBanner, showVersions } from '../utils/banner';
import { loadRemix, buildRemix, logger } from '@remix-kit/kit';
import { overrideEnv } from '../utils/env';
import { cleanupRemixDirs } from '../utils/remix';
import { defineRemixCommand } from './index';
import { writeTypes } from '../utils/prepare';
import { startOriginServer } from '../utils/origin';
import { loading as loadingTemplate } from '../templates/loading';
import type { ChildProcess } from 'child_process';

export default defineRemixCommand({
  meta: {
    name: 'dev',
    usage:
      'npx remix-kit dev [rootDir] [--dotenv] [--clipboard] [--open, -o] [--port, -p] [--host, -h] [--https] [--ssl-cert] [--ssl-key] [--origin, -o]',
    description: 'Run remix-kit development server',
  },
  async invoke(args) {
    const start = performance.now();
    overrideEnv('development');

    const { listen } = await import('listhen');
    let currentHandler: RequestListener | undefined;
    let loadingMessage = 'Remix is starting...';
    const loadingHandler: RequestListener = async (_req, res) => {
      res.setHeader('Content-Type', 'text/html; charset=UTF-8');
      res.statusCode = 503; // Service Unavailable
      res.end(loadingTemplate(loadingMessage));
    };
    const serverHandler: RequestListener = (req, res) => {
      return currentHandler ? currentHandler(req, res) : loadingHandler(req, res);
    };

    const cwd = resolve(args._[0] || '.');
    showVersions(cwd);

    await setupDotenv({ cwd, fileName: args.dotenv });

    const listener = await listen(serverHandler, {
      showURL: false,
      clipboard: args.clipboard,
      open: args.open || args.o,
      port: args.port || args.p || process.env.REMIX_PORT || 3005,
      hostname: args.host || args.h || process.env.REMIX_HOST,
      https: args.https && {
        cert: args['ssl-cert'],
        key: args['ssl-key'],
      },
    });

    let currentRemix: Remix;
    const showURL = () => {
      listener.showURL({
        // TODO: Normalize URL with trailing slash within schema
        baseURL: withTrailingSlash(currentRemix?.options.app.baseURL) || '/',
      });
    };
    let originServer: ChildProcess | null, shouldRestart: boolean;
    const load = async (isRestart: boolean, reason?: string) => {
      try {
        loadingMessage = `${reason ? reason + '. ' : ''}${
          isRestart ? 'Restarting' : 'Starting'
        } Remix...`;
        currentHandler = undefined;
        if (isRestart) {
          consola.info(loadingMessage);
        }
        if (currentRemix) {
          await currentRemix.close();
        }
        currentRemix = await loadRemix({ cwd, dev: true, ready: false });
        if (!isRestart) {
          showURL();
        }

        // Check if we need cache invalidation
        if (!isRestart) {
          await cleanupRemixDirs(currentRemix.options.rootDir);
        }

        await currentRemix.ready();

        await currentRemix.hooks.callHook('listen', listener.server, listener);
        const address = listener.server.address() as AddressInfo;
        currentRemix.options.devServer.url = listener.url;
        currentRemix.options.devServer.port = address.port;
        currentRemix.options.devServer.host = address.address;
        currentRemix.options.devServer.https = listener.https;

        await Promise.all([
          writeTypes(currentRemix).catch(console.error),
          buildRemix(currentRemix),
        ]);

        currentHandler = currentRemix.server;

        if (isRestart && args.clear !== false) {
          showBanner();
          showURL();
        }

        if (!isRestart) {
          const time = Math.round((performance.now() - start) * 1000) / 1000;
          logger.success(`Dev server ready`, time ? `in ${time}ms` : '', '\n');

          process.env.ORIGIN_SERVER = args.origin || args.o || process.env.ORIGIN_SERVER;

          const restart = (process: ChildProcess) => {
            process.on('close', async () => {
              if (shouldRestart) {
                shouldRestart = false;
                originServer = await startOriginServer(currentRemix.options.rootDir);
                if (originServer) restart(originServer);
              }
            });
          };

          originServer = await startOriginServer(currentRemix.options.rootDir);
          if (originServer) restart(originServer);
        }

        if (isRestart && originServer) {
          shouldRestart = true;
          originServer.kill();
        }
      } catch (err) {
        consola.error(`Cannot ${isRestart ? 'restart' : 'start'} Remix server: `, err);
        currentHandler = undefined;
        loadingMessage = 'Error while loading Remix. Please check console and fix errors.';
      }
    };

    // Watch for config changes
    // TODO: Watcher service, modules, and requireTree
    const dLoad = debounce(load);
    const watcher = chokidar.watch([cwd], {
      ignoreInitial: true,
      depth: 1,
    });
    watcher.on('all', (event, _file) => {
      if (!currentRemix) {
        return;
      }
      const file = normalize(_file);
      const buildDir = withTrailingSlash(normalize(currentRemix.options.assetsBuildDirectory));
      if (file.startsWith(buildDir)) {
        return;
      }
      const relativePath = relative(cwd, file);
      if (file.match(/(remix\.config\.(js|ts|mjs|cjs)|\.remixignore|\.env|\.remixrc)$/)) {
        dLoad(true, `${relativePath} updated`);
      }

      const isDirChange = ['addDir', 'unlinkDir'].includes(event);
      const isFileChange = ['add', 'unlink'].includes(event);
      const reloadDirs = [currentRemix.options.assetsBuildDirectory].map((dir) =>
        resolve(currentRemix.options.srcDir, dir)
      );

      if (isDirChange) {
        if (reloadDirs.includes(file)) {
          return dLoad(
            true,
            `Directory \`${relativePath}/\` ${event === 'addDir' ? 'created' : 'removed'}`
          );
        }
      }

      if (isFileChange) {
        if (file.match(/(app|error|app\.config)\.(js|ts|mjs|jsx|tsx|vue)$/)) {
          return dLoad(true, `\`${relativePath}\` ${event === 'add' ? 'created' : 'removed'}`);
        }
      }
    });

    await load(false);

    return 'wait' as const;
  },
});
