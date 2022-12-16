import type { ConfigSchema } from '../../schema/config';
import type {
  ServerOptions as ViteServerOptions,
  UserConfig as ViteUserConfig,
} from 'vite';
import type { Remix } from './remix';
import type { RemixConfig as StandardRemixConfig } from "@remix-run/dev/dist/config";

type DeepPartial<T> = T extends Function
  ? T
  : T extends Record<string, any>
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

/** User configuration in `remix.config` file */
export interface RemixConfig extends DeepPartial<Omit<ConfigSchema, 'vite'>> {
  // Avoid DeepPartial for vite config interface (#4772)
  vite?: ConfigSchema['vite'];
}

// TODO: Expose ConfigLayer<T> from c12
interface ConfigLayer<T> {
  config: T;
  cwd: string;
  configFile: string;
}
export type RemixConfigLayer = ConfigLayer<
  RemixConfig & {
    srcDir: ConfigSchema['srcDir'];
    rootDir: ConfigSchema['rootDir'];
  }
>;

/** Normalized Remix options available as `remix.options.*` */
export interface RemixOptions extends Omit<ConfigSchema, 'builder'>, StandardRemixConfig {
  sourcemap: Required<Exclude<ConfigSchema['sourcemap'], boolean>>;
  builder: '@remix-kit/vite' | { bundle: (remix: Remix) => Promise<void> };
  _layers: RemixConfigLayer[];
}

export interface ViteConfig extends ViteUserConfig {
  /**
   * Warmup vite entrypoint caches on dev startup.
   */
  warmupEntry?: boolean;

  /**
   * Use environment variables or top level `server` options to configure Remix server.
   */
  server?: Omit<ViteServerOptions, 'port' | 'host'>;
}

// -- Runtime Config --

type RuntimeConfigNamespace = Record<string, any>;

export interface PublicRuntimeConfig extends RuntimeConfigNamespace {}

export interface RuntimeConfig extends RuntimeConfigNamespace {
  public: PublicRuntimeConfig;
}

export interface AppConfig { }
