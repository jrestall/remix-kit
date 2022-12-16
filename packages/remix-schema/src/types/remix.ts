import type { Hookable } from 'hookable';
import type { Ignore } from 'ignore';
import type { RemixHooks } from './hooks';
import type { RemixOptions } from './config';

export interface Remix {
  // Private fields.
  _version: string;
  _ignore?: Ignore;
  _assetsManifest?: AssetsManifest;

  /** The resolved Remix configuration. */
  options: RemixOptions;
  hooks: Hookable<RemixHooks>;
  hook: Remix['hooks']['hook'];
  callHook: Remix['hooks']['callHook'];
  addHooks: Remix['hooks']['addHooks'];

  ready: () => Promise<void>;
  close: () => Promise<void>;

  /** The production or development server. */
  server?: any;

  vfs: Record<string, string>;
}

export interface RemixBuilder {
  bundle(remix: Remix): Promise<void>;
  preview(remix: Remix): Promise<void>;
}

export interface RemixRenderer {
  setup(remix: Remix): Promise<void>;
}

export interface RemixApp {
  dir: string;
  extensions: string[];
  configs: string[];
}

export interface AssetsManifest {
  version: string;
  url?: string;
  entry: {
    module: string;
    imports: string[];
  };
  routes: {
    [routeId: string]: {
      id: string;
      parentId?: string;
      path?: string;
      index?: boolean;
      caseSensitive?: boolean;
      module: string;
      imports?: string[];
      hasAction: boolean;
      hasLoader: boolean;
      hasCatchBoundary: boolean;
      hasErrorBoundary: boolean;
    };
  };
}
