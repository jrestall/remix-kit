import type { Plugin as VitePlugin, UserConfig as ViteConfig } from 'vite';
import { useRemix } from './context';

export interface ExtendConfigOptions {
  /**
   * Install plugin on dev
   *
   * @default true
   */
  dev?: boolean;
  /**
   * Install plugin on build
   *
   * @default true
   */
  build?: boolean;
  /**
   * Install plugin on server side
   *
   * @default true
   */
  server?: boolean;
  /**
   * Install plugin on client side
   *
   * @default true
   */
  client?: boolean;
}

export interface ExtendViteConfigOptions extends ExtendConfigOptions {}

/**
 * Extend Vite config
 */
export function extendViteConfig(
  fn: (config: ViteConfig) => void,
  options: ExtendViteConfigOptions = {}
) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const remix = useRemix();

  if (options.dev === false && remix.options.dev) {
    return;
  }
  if (options.build === false && remix.options.build) {
    return;
  }

  if (options.server !== false && options.client !== false) {
    // Call fn() only once
    return remix.hook('vite:extend', ({ config }: { config: ViteConfig }): void => fn(config));
  }

  remix.hook('vite:extendConfig', (config: ViteConfig, { isClient, isServer }: any) => {
    if (options.server !== false && isServer) {
      return fn(config);
    }
    if (options.client !== false && isClient) {
      return fn(config);
    }
  });
}

/**
 * Append Vite plugin to the config.
 */
export function addVitePlugin(
  plugin: VitePlugin | VitePlugin[],
  options?: ExtendViteConfigOptions
) {
  extendViteConfig((config) => {
    config.plugins = config.plugins || [];
    if (Array.isArray(plugin)) {
      config.plugins.push(...plugin);
    } else {
      config.plugins.push(plugin);
    }
  }, options);
}
