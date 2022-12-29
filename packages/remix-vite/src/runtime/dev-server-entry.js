const consola = require('consola');
const destr = require('destr');
const { createError } = require('h3');
const { fetch } = require('@remix-run/web-fetch');
const { ViteNodeRunner, DEFAULT_REQUEST_STUBS } = require('vite-node/client');
const { DevClient } = require('./dev-client');

const devServerOptions = JSON.parse(process.env.REMIX_DEV_SERVER_OPTIONS || '{}');

const serverBuildStub = Object.create(null);
const runner = createRunner();

let entryPromise;
function executeEntry() {
  if (entryPromise == null) {
    if (!devServerOptions.serverEntryPoint) {
      throw new Error('No serverEntryPoint found on process.env.REMIX_DEV_SERVER_OPTIONS.');
    }
    entryPromise = runner.executeFile(devServerOptions.serverEntryPoint);
  }
  return entryPromise;
}

function entry(props) {
  return executeEntry().then(function (mod) {
    return mod.default(props);
  });
}

function onInvalidate(build) {
  Object.assign(serverBuildStub, build);
  Object.assign(module.exports, build);
}

runner.executeId('\0@remix-run/dev/server-build').then(onInvalidate).then(executeEntry);

const client = new DevClient(runner, onInvalidate);
client.connect(devServerOptions.wssPort);

module.exports.default = entry;

/* Polyfill node for Cloudflare's workerd etc
const vm = require("vm");
if(!vm.runInThisContext) {
  vm.runInThisContext = runInThisContext;
}

function runInThisContext(code, _options) {
  // eslint-disable-next-line no-eval
  return eval.call(global, code);
}*/

async function devServerFetch(path) {
  const url = new URL(path, devServerOptions.baseURL).href;
  const response = await fetch(url, this.fetchOptions);
  const data = await response.text();
  return destr(data);
}

function createRunner() {
  const _importers = new Map();
  return new ViteNodeRunner({
    root: devServerOptions.root, // Equals to Remix `srcDir`
    base: devServerOptions.base,
    requestStubs: {
      '@remix-run/dev/server-build': serverBuildStub,
      ...DEFAULT_REQUEST_STUBS,
    },
    resolveId(id, importer) {
      _importers.set(id, importer);
    },
    async fetchModule(id) {
      const importer = _importers.get(id);
      _importers.delete(id);
      id = id.replace(/\/\//g, '/'); // TODO: fix in vite-node
      return await devServerFetch('module/' + encodeURIComponent(id)).catch((err) => {
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
          console.log(_err);
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
    },
  });
}

function formatViteError(errorData, id, importer) {
  const errorCode = errorData.name || errorData.reasonCode || errorData.code;
  const frame = errorData.frame || errorData.source || errorData.pluginCode;

  const getLocId = (locObj = {}) => locObj.file || locObj.id || locObj.url || id || '';
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
