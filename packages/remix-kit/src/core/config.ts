import { resolve } from 'pathe';
import { applyDefaults } from 'untyped';
import type { LoadConfigOptions } from 'c12';
import { loadConfig } from 'c12';
import type { RemixOptions, RemixConfig } from '@remix-kit/schema';
import { RemixConfigSchema } from '@remix-kit/schema';
import { readConfig } from '@remix-run/dev/dist/config.js';
import type { RemixConfig as StandardRemixConfig } from '@remix-run/dev/dist/config.js';

export type LoadRemixConfigOptions = LoadConfigOptions<RemixConfig>

export async function loadRemixConfig(opts: LoadRemixConfigOptions): Promise<RemixOptions> {
  (globalThis as any).defineRemixConfig = (c: any) => c;
  const result = await loadConfig<RemixConfig>({
    name: 'remix',
    configFile: 'remix.config',
    rcFile: '.remixrc',
    extend: { extendKey: ['extends'] },
    dotenv: true,
    globalRc: true,
    ...opts,
  });
  delete (globalThis as any).defineRemixConfig;
  const { configFile, layers = [], cwd } = result;
  const remixConfig = result.config!;

  // Fill config
  remixConfig.rootDir = remixConfig.rootDir || cwd;
  remixConfig._remixConfigFile = configFile;
  remixConfig._remixConfigFiles = [configFile];

  // Resolve `rootDir` & `srcDir` of layers
  for (const layer of layers) {
    layer.config = layer.config || {};
    layer.config.rootDir = layer.config.rootDir ?? layer.cwd;
    layer.config.srcDir = resolve(layer.config.rootDir!, layer.config.srcDir!);
  }

  // Filter layers
  const _layers = layers.filter(
    (layer) => layer.configFile && !layer.configFile.endsWith('.remixrc')
  );
  (remixConfig as any)._layers = _layers;

  // Ensure at least one layer remains (without remix.config)
  if (!_layers.length) {
    _layers.push({
      cwd,
      config: {
        rootDir: cwd,
        srcDir: cwd,
      },
    });
  }

  // Resolve and apply defaults
  const config = (await applyDefaults(RemixConfigSchema, remixConfig)) as RemixOptions;
  return await mergeStandardRemixConfig(config);
}

async function mergeStandardRemixConfig(config: RemixOptions): Promise<RemixOptions> {
  const remixConfig: StandardRemixConfig = await readConfig();
  return { ...config, ...remixConfig };
}
