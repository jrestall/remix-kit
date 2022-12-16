import { createError } from 'h3';
import { ViteNodeRunner } from 'vite-node/client';
import consola from 'consola';
import type { ViteNodeServer } from 'vite-node/server';
import { isRelative } from 'ufo';
import { dirname, resolve } from 'pathe';

export function createRunner(node: ViteNodeServer, rootDir: string, base: string) {
  const _importers = new Map();
  return new ViteNodeRunner({
    root: rootDir, // Equals to Remix `srcDir`
    base,
    async resolveId(id, importer) {
      console.debug(`resolveId-runner (${importer}): ` + id);
      _importers.set(id, importer);
      return null;
    },
    async fetchModule(id) {
      const importer = _importers.get(id);
      console.debug('fetchModule: ' + id);
      if (isRelative(id)) {
        console.debug('isRelative');
        console.debug(id);
        return await node.fetchModule(resolve(dirname(importer), id));
      }

      _importers.delete(id);
      id = id.replace(/\/\//g, '/'); // TODO: fix in vite-node
      const module = await node.fetchModule(id).catch((err) => {
        console.debug('module request failed: ' + err);
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

      return module;
    },
  });
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
