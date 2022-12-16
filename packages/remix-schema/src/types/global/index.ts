import { ViteImportMeta } from './vite';

export type BundlerImportMeta = ViteImportMeta;

declare global {
  interface ImportMeta extends BundlerImportMeta {
    /** the `file:` url of the current file (similar to `__filename` but as file url) */
    url: string;

    readonly env: Record<string, string | boolean | undefined>;
  }
}
