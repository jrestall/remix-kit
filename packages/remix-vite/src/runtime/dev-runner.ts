import { createError } from 'h3';
import { ViteNodeRunner } from 'vite-node/client';
import consola from 'consola';
import type { ServerBuild } from '@remix-run/server-runtime';
import { Agent as HTTPSAgent } from 'node:https';
import { $fetch } from 'ofetch';
import { readConfig } from '@remix-run/dev/dist/config.js';
import { fileURLToPath } from "node:url";

export interface ExecuteFunctionArgs {
  build?: ServerBuild;
  mode: string;
  err?: string;
}

export interface ExecuteFunction<T> {
  (args: ExecuteFunctionArgs): Promise<T> | T;
}

export interface DevRunnerOptions {
  mode: string;
}

export class RemixKitRunner {
  options: DevRunnerOptions;
  executor: any;
  runner?: ViteNodeRunner;
  serverBuildPath?: string;
  entryPath?: string;
  devServerFetch?: any;

  constructor(options: DevRunnerOptions) {
    this.options = options ?? { mode: 'production' };

    if (this.options.mode !== 'production') {
      const devServerOptions = JSON.parse(process.env.REMIX_DEV_SERVER_OPTIONS || '{}');

      this.runner = this.createRunner(devServerOptions.root, devServerOptions.base);
      this.entryPath = fileURLToPath(new URL('dev-entry.mjs', import.meta.url));

      this.devServerFetch = $fetch.create({
        baseURL: devServerOptions.baseURL,
        // @ts-expect-error
        agent: devServerOptions.baseURL.startsWith('https://')
          ? new HTTPSAgent({ rejectUnauthorized: false })
          : null,
      });
    }
  }

  async ready(origin: string) {
    const config = await readConfig();
    this.serverBuildPath = config.serverBuildPath;

    if (this.options.mode === 'production') return;

    // Dev server listens to the stdout of the child process and picks up the origin server url.
    consola.log('');
    consola.info(`Runner started on ${origin}`);
  }

  async execute<T>(execute: ExecuteFunction<T>): Promise<T> {
    // In production, we bypass Vite and just run the given function.
    // Remix server file no longer controls the build import as this is simpler but also
    // lets us modify the build dynamically per request such as for lib support in the future.
    if (this.options.mode === 'production') {
      if (!this.serverBuildPath) {
        throw new Error("Can't get serverBuildPath. Did you forget to call runner.ready?");
      }
      let build = require(this.serverBuildPath);
      return execute({build, mode: this.options.mode});
    }

    if (!this.runner || !this.entryPath) {
      throw new Error('No development client runner setup.');
    }

    try {
      // Invalidate cache for files changed since last rendering
      const invalidates = await this.devServerFetch('/invalidates');
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
      return this.executor(execute, this.options.mode);
    } catch (err) {
      consola.error(err);
      throw err;
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
    return await this.devServerFetch('/module/' + encodeURI(id)).catch((err: any) => {
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
