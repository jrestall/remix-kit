import { RemixHooks } from './hooks';
import type { Remix } from './remix';

export interface ModuleMeta {
  /** Module name. */
  name?: string;

  /** Module version. */
  version?: string;

  /**
   * The configuration key used within `remix.config` for this module's options.
   * For example, a `@remix-kit/axios` module could use `axios`.
   */
  configKey?: string;

  [key: string]: any;
}

/** The options received.  */
export type ModuleOptions = Record<string, any>;

/** Input module passed to defineRemixModule. */
export interface ModuleDefinition<T extends ModuleOptions = ModuleOptions> {
  meta?: ModuleMeta;
  defaults?: T | ((remix: Remix) => T);
  schema?: T;
  hooks?: Partial<RemixHooks>;
  setup?: (this: void, resolvedOptions: T, remix: Remix) => void | Promise<void>;
}

/** Remix modules are always a simple function. */
export interface RemixModule<T extends ModuleOptions = ModuleOptions> {
  (this: void, inlineOptions: T, remix: Remix): void | Promise<void>;
  getOptions?: (inlineOptions?: T, remix?: Remix) => Promise<T>;
  getMeta?: () => Promise<ModuleMeta>;
}
