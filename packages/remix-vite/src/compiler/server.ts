import { dirname, join } from 'pathe';
import * as vite from 'vite';
import { logger } from '@remix-kit/kit';
import type { ViteBuildContext, ViteOptions } from '../vite';
import { initViteNodeServer } from '../vite-node';
import nodeResolve from '@rollup/plugin-node-resolve';
import polyfillNode from 'rollup-plugin-polyfill-node';
import type { InputPluginOption } from 'rollup';
import { devServerManifest, devServerManifestPre } from './plugins/dev-server-manifest';
import { distDir } from '../dirs';

export async function buildServer(ctx: ViteBuildContext) {
  const options = ctx.remix.options;
  // TODO: async entry support
  /*const useAsyncEntry = options.experimental.asyncEntry || options.dev;
  const serverEntry = await resolvePath(
    resolve(options.appDir, useAsyncEntry ? 'entry.async' : options.entryServerFile)
  );*/

  let entryPoint: string | undefined;
  if (options.serverEntryPoint) {
    entryPoint = options.serverEntryPoint;
  } else {
    const defaultServerEntryPoint = join(distDir, 'compiler', 'defaults', 'server-entry.mjs');
    entryPoint = defaultServerEntryPoint;
  }

  let isCloudflareRuntime = ['cloudflare-pages', 'cloudflare-workers'].includes(
    options.serverBuildTarget ?? ''
  );
  let isDenoRuntime = options.serverBuildTarget === 'deno';

  const serverConfig: vite.InlineConfig = vite.mergeConfig(ctx.config, {
    define: {
      'process.server': true,
      'process.client': false,
    },
    plugins: [],
    ssr: {
      target: 'node',
      noExternal: [
        ...ctx.remix.options.build.transpile,
        /\/esm\/.*\.js$/,
        /\.(es|esm|esm-browser|esm-bundler).js$/,
        '#app',
      ],
    },
    resolve: {
      mainFields: isCloudflareRuntime
        ? ['browser', 'module', 'main']
        : options.serverModuleFormat === 'esm'
        ? ['module', 'main']
        : ['main', 'module'],
      conditions: isCloudflareRuntime ? ['worker'] : isDenoRuntime ? ['deno', 'worker'] : undefined,
    },
    esbuild: {
      platform: options.serverPlatform,
      format: "esm",
      target: 'node14',
    },
    build: {
      ssr: true,
      sourcemap: ctx.remix.options.sourcemap.server ? ctx.config.build?.sourcemap ?? true : false,
      outDir: dirname(options.serverBuildPath),
      rollupOptions: {
        input: { index: entryPoint },
        output: {
          format: 'esm',
          generatedCode: {
            constBindings: true,
          },
          entryFileNames: "[name].mjs"
        },
        onwarn(warning, rollupWarn) {
          if (warning.code && ['UNUSED_EXTERNAL_IMPORT'].includes(warning.code)) {
            return;
          }
          rollupWarn(warning);
        },
        plugins: [
          nodeResolve({
            browser: false,
            extensions: ['.js', '.json', '.jsx', '.ts', '.tsx'],
            preferBuiltins: true,
          }),
        ],
      },
    },
    server: {
      // https://github.com/vitest-dev/vitest/issues/229#issuecomment-1002685027
      preTransformRequests: false,
      hmr: false,
    },
  } as ViteOptions);

  if (options.serverPlatform !== 'node') {
    const plugins = serverConfig.build?.rollupOptions?.plugins as InputPluginOption[];
    plugins.unshift(polyfillNode());
    serverConfig.ssr!.noExternal = true;
    serverConfig.ssr!.target = 'webworker';
  }

  await ctx.remix.callHook('vite:extendConfig', serverConfig, { isClient: false, isServer: true });

  if (options.dev) {
    serverConfig.plugins?.push(devServerManifestPre(ctx.remix), devServerManifest(ctx.remix));
  }

  const onBuild = () => ctx.remix.callHook('vite:compiled');

  // Production build
  if (!options.dev) {
    const start = Date.now();
    logger.info('Building server...');
    await vite.build(serverConfig);
    await onBuild();
    logger.success(`Server built in ${Date.now() - start}ms`);
    return;
  }

  // Start development server
  await ctx.remix.callHook('vite:serverCreating', serverConfig, {
    isClient: false,
    isServer: true,
  });
  const viteServer = await vite.createServer(serverConfig);
  await ctx.remix.callHook('vite:serverCreated', viteServer, { isClient: false, isServer: true });

  ctx.ssrServer = viteServer;

  // Close server on exit
  ctx.remix.hook('close', () => viteServer.close());

  // Initialize plugins
  await viteServer.pluginContainer.buildStart({});

  await initViteNodeServer(ctx);
}
