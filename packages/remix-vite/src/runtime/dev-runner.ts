import { createError } from 'h3';
import { ViteNodeRunner } from 'vite-node/client';
import consola from 'consola';
import { resolve } from 'pathe';
import type { ServerBuild } from '@remix-run/server-runtime';
import { Agent as HTTPSAgent } from 'node:https';
import { $fetch } from 'ofetch';
import serverBuild from '@remix-run/dev/server-build';

const viteNodeOptions = {
  root: '/Users/jrestall/Dev/remix-kit/playground/react-app',
  base: '',
  baseURL: 'http://localhost:3000',
};

export interface ExecuteFunction<T> {
  (build?: ServerBuild, mode?: string, err?: string): Promise<T> | T;
}

export interface DevRunnerOptions {
  mode: string;
}

export class RemixKitRunner {
  options: DevRunnerOptions;
  runner: ViteNodeRunner;
  executor: any;
  entryPath: string;
  viteNodeFetch: any;

  constructor(options?: DevRunnerOptions) {
    this.options = options ?? { mode: 'production' };
    this.runner = this.createRunner(viteNodeOptions.root, viteNodeOptions.base);
    this.entryPath = resolve(__dirname, 'dev-entry.ts');

    if (this.options.mode !== 'production') {
      this.viteNodeFetch = $fetch.create({
        baseURL: `${viteNodeOptions.baseURL}/__remix_dev_server__`,
        // @ts-expect-error
        agent: viteNodeOptions.baseURL.startsWith('https://')
          ? new HTTPSAgent({ rejectUnauthorized: false })
          : null,
      });
    }
  }

  async execute<T>(execute: ExecuteFunction<T>): Promise<T> {
    // In production, we bypass Vite and just run the given function.
    if (this.options.mode === 'production') {
      return execute(serverBuild, this.options.mode);
    }

    try {
      // Invalidate cache for files changed since last rendering
      const invalidates = await viteNodeFetch('/invalidates');
      const updates = this.runner.moduleCache.invalidateDepTree(invalidates);

      const start = performance.now();

      // Execute SSR bundle on demand
      // https://antfu.me/posts/dev-ssr-on-nuxt#approach-3-vite-node
      this.executor =
        updates.size > 0 || !this.executor
          ? (await this.runner.executeFile(this.entryPath)).default
          : this.executor;
      if (updates.size) {
        const time = Math.round((performance.now() - start) * 1000) / 1000;
        consola.success(`Vite server hmr ${updates.size} files`, time ? `in ${time}ms` : '');
      }
      return this.executor(execute);
    } catch (err) {
      return execute(undefined, err.toString());
    }
  }

  createRunner(rootDir: string, base: string) {
    const runner = this;
    const _importers = new Map();
    return new ViteNodeRunner({
      root: rootDir, // Equals to Remix `srcDir`
      base,
      async resolveId(id, importer) {
        _importers.set(id, importer);
        return null;
      },
      async fetchModule(id) {
        const importer = _importers.get(id);
        _importers.delete(id);
        id = id.replace(/\/\//g, '/'); // TODO: fix in vite-node
        return await runner.fetchModule(id, importer);
      },
    });
  }

  async fetchModule(id: string, importer: any) {
    return await viteNodeFetch('/module/' + encodeURI(id)).catch((err: any) => {
      const errorData = err?.data?.data;
      if (!errorData) {
        throw err;
      }
      let _err;
      try {
        const { message, stack } = formatViteError(errorData, id, importer);
        _err = createError({
          statusMessage: 'Vite Error',
          message,
          stack,
        });
      } catch (formatError) {
        consola.warn(
          'Internal remix error while formatting vite-node error. Please report this!',
          formatError
        );
        const message = `[vite-node] [TransformError] ${errorData?.message || '-'}`;
        consola.error(message, errorData);
        throw createError({
          statusMessage: 'Vite Error',
          message,
          stack: `${message}\nat ${id}\n` + (errorData?.stack || ''),
        });
      }
      throw _err;
    });
  }
}

function formatViteError(errorData: any, id: any, importer: any) {
  const errorCode = errorData.name || errorData.reasonCode || errorData.code;
  const frame = errorData.frame || errorData.source || errorData.pluginCode;

  // @ts-expect-error
  const getLocId = (locObj = {}) => locObj.file || locObj.id || locObj.url || id || '';
  // @ts-expect-error
  const getLocPos = (locObj = {}) => (locObj.line ? `${locObj.line}:${locObj.column || 0}` : '');
  const locId =
    getLocId(errorData.loc) ||
    getLocId(errorData.location) ||
    getLocId(errorData.input) ||
    getLocId(errorData);
  const locPos =
    getLocPos(errorData.loc) ||
    getLocPos(errorData.location) ||
    getLocPos(errorData.input) ||
    getLocPos(errorData);
  const loc = locId.replace(process.cwd(), '.') + (locPos ? `:${locPos}` : '');

  const message = [
    '[vite-node]',
    errorData.plugin && `[plugin:${errorData.plugin}]`,
    errorCode && `[${errorCode}]`,
    loc,
    errorData.reason && `: ${errorData.reason}`,
    frame &&
      `<br><pre>${frame
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')}</pre><br>`,
  ]
    .filter(Boolean)
    .join(' ');

  const stack = [
    message,
    `at ${loc} ${importer ? `(imported from ${importer})` : ''}`,
    errorData.stack,
  ]
    .filter(Boolean)
    .join('\n');

  return {
    message,
    stack,
  };
}
