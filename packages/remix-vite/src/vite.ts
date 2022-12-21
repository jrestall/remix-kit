import * as vite from 'vite';
import { join, resolve } from 'pathe';
import type { Remix } from '@remix-kit/schema';
import type { InlineConfig, SSROptions } from 'vite';
import { isIgnored, addVitePlugin } from '@remix-kit/kit';
import replace from '@rollup/plugin-replace';
import { sanitizeFilePath } from 'mlly';
import { withoutLeadingSlash } from 'ufo';
import { filename } from 'pathe/utils';
import { resolveTSConfig } from 'pkg-types';
import { buildClient } from './compiler/browser';
import { buildServer } from './compiler/server';
import { resolveCSSOptions } from './css';
import { previewServer } from './compiler/plugins/preview-server';

export interface ViteOptions extends InlineConfig {
  ssr?: SSROptions;
}

export interface ViteBuildContext {
  remix: Remix;
  config: ViteOptions;
  serverEntry: string;
  clientServer?: vite.ViteDevServer;
  ssrServer?: vite.ViteDevServer;
}

export async function bundle(remix: Remix) {
  const ctx: ViteBuildContext = {
    remix,
    serverEntry: resolve(remix.options.rootDir, remix.options.serverEntryPoint!),
    config: vite.mergeConfig(
      {
        define: {
          'import.meta.env.PROD': process.env.PROD,
          'import.meta.env.DEV': process.env.DEV,
        },
        resolve: {
          alias: {
            ...remix.options.alias,
            '~': remix.options.appDirectory,
            '#app': remix.options.appDir,
            '#build': remix.options.buildDir,
          },
        },
        css: await resolveCSSOptions(remix),
        build: {
          manifest: false,
          rollupOptions: {
            output: {
              sanitizeFileName: sanitizeFilePath,
              assetFileNames: remix.options.dev
                ? undefined
                : (chunk) =>
                    withoutLeadingSlash(
                      join(
                        remix.options.app.buildAssetsDir,
                        `${sanitizeFilePath(filename(chunk.name!))}.[hash].[ext]`
                      )
                    ),
            },
          },
          watch: {
            exclude: remix.options.ignore,
          },
        },
        plugins: [
          replace({
            ...Object.fromEntries(
              [';', '(', '{', '}', ' ', '\t', '\n'].map((d) => [`${d}global.`, `${d}globalThis.`])
            ),
            preventAssignment: true,
          }),
        ],
        server: {
          watch: { ignored: isIgnored },
          fs: {
            allow: [remix.options.appDir, ...remix.options._layers.map((l) => l.config.rootDir)],
          },
        },
      } as ViteOptions,
      remix.options.vite
    ),
  };

  // In build mode we explicitly override any vite options that vite is relying on
  // to detect whether to inject production or development code (such as HMR code)
  if (!remix.options.dev) {
    ctx.config.server!.watch = undefined;
    ctx.config.build!.watch = undefined;
  }

  await remix.callHook('vite:extend', ctx);

  // Add type-checking
  if (
    ctx.remix.options.typescript.typeCheck === true ||
    (ctx.remix.options.typescript.typeCheck === 'build' && !ctx.remix.options.dev)
  ) {
    const checker = await import('vite-plugin-checker').then((r) => r.default);
    addVitePlugin(
      checker({
        typescript: {
          tsconfigPath: await resolveTSConfig(ctx.remix.options.rootDir),
        },
      })
    );
  }

  await buildClient(ctx);
  await buildServer(ctx);
}

export async function preview(remix: Remix) {
  const previewDefaults: InlineConfig = {
    plugins: [await previewServer(remix)],
    build: {
      outDir: 'public/',
    },
  };
  const previewConfig = vite.mergeConfig(previewDefaults, remix.options.vite);
  const server = await vite.preview(previewConfig);
  server.printUrls();
}
