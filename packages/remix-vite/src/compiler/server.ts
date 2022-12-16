import { resolve, dirname } from 'pathe';
import * as vite from 'vite';
import { logger, resolvePath } from '@remix-kit/kit';
import { withoutLeadingSlash, withTrailingSlash } from 'ufo';
import type { ViteBuildContext, ViteOptions } from '../vite';
import { initViteNodeServer } from '../vite-node';
import nodeResolve from '@rollup/plugin-node-resolve';
import polyfillNode from 'rollup-plugin-polyfill-node';
import { InputPluginOption } from 'rollup';
import { devServerManifest, devServerManifestPre } from './plugins/dev-server-manifest';

export async function buildServer(ctx: ViteBuildContext) {
  const options = ctx.remix.options;
  const useAsyncEntry = options.experimental.asyncEntry || options.dev;
  const serverEntry = await resolvePath(
    resolve(options.appDir, useAsyncEntry ? 'entry.async' : options.entryServerFile)
  );

  let entryPoint: string | undefined;
  if (options.serverEntryPoint) {
    entryPoint = options.serverEntryPoint;
  } else {
    const defaultsDirectory = resolve(__dirname, 'defaults');
    const defaultServerEntryPoint = resolve(defaultsDirectory, 'server-entry.ts');
    entryPoint = defaultServerEntryPoint;
  }
  const serverConfig: vite.InlineConfig = vite.mergeConfig(ctx.config, {
    entry: ctx.serverEntry,
    //base: options.dev
    //  ? joinURL(options.app.baseURL.replace(/^\.\//, '/') || '/', options.app.buildAssetsDir)
    //  : undefined,
    experimental: {
      renderBuiltUrl: (filename, { type, hostType }) => {
        if (hostType !== 'js') {
          // In CSS we only use relative paths until we craft a clever runtime CSS hack
          return { relative: true };
        }
        if (type === 'public') {
          return { runtime: `globalThis.__publicAssetsURL(${JSON.stringify(filename)})` };
        }
        if (type === 'asset') {
          const relativeFilename = filename.replace(
            withTrailingSlash(withoutLeadingSlash(options.app.buildAssetsDir)),
            ''
          );
          return { runtime: `globalThis.__buildAssetsURL(${JSON.stringify(relativeFilename)})` };
        }
      },
    },
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
      middlewareMode: true,
    },
  } as ViteOptions);

  if (options.dev) {
    serverConfig.plugins?.push(devServerManifestPre(ctx.remix), devServerManifest(ctx.remix));
  }

  if (options.serverPlatform !== 'node') {
    const plugins = serverConfig.build?.rollupOptions?.plugins as InputPluginOption[];
    plugins.push(polyfillNode);
    serverConfig.ssr!.noExternal = true;
    serverConfig.ssr!.target = 'webworker';
  }

  if (options.experimental.inlineSSRStyles) {
    /*const chunksWithInlinedCSS = new Set<string>()
    serverConfig.plugins!.push(ssrStylesPlugin({
      srcDir: options.srcDir,
      chunksWithInlinedCSS,
      shouldInline: typeof options.experimental.inlineSSRStyles === 'function'
        ? options.experimental.inlineSSRStyles
        : undefined
    }))

    // Remove CSS entries for files that will have inlined styles
    ctx.remix.hook('build:manifest', (manifest) => {
      for (const key in manifest) {
        const entry = manifest[key]
        const shouldRemoveCSS = chunksWithInlinedCSS.has(key)
        if (shouldRemoveCSS) {
          entry.css = []
        }
      }
    })*/
  }

  await ctx.remix.callHook('vite:extendConfig', serverConfig, { isClient: false, isServer: true });

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
  await ctx.remix.callHook('vite:serverCreating', serverConfig, { isClient: false, isServer: true });
  const viteServer = await vite.createServer(serverConfig);
  await ctx.remix.callHook('vite:serverCreated', viteServer, { isClient: false, isServer: true });
  
  ctx.ssrServer = viteServer;

  // Close server on exit
  ctx.remix.hook('close', () => viteServer.close());

  // Initialize plugins
  await viteServer.pluginContainer.buildStart({});

  await initViteNodeServer(ctx);
}
