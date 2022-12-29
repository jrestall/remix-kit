import type { TSConfig } from 'pkg-types';
import type { Server as HttpServer } from 'node:http';
import type { Server as HttpsServer } from 'node:https';
import type { InlineConfig as ViteInlineConfig, ViteDevServer } from 'vite';
import type { EventHandler } from 'h3';
import type { Import, InlinePreset } from 'unimport';
import type { Remix, RemixApp } from './remix';
import type { AssetsManifest } from './remix';

export type HookResult = Promise<void> | void;

// https://www.typescriptlang.org/docs/handbook/triple-slash-directives.html
export type TSReference = { types: string } | { path: string };

export type WatchEvent = 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir';

export interface ImportPresetWithDeprecation extends InlinePreset {}

export interface RemixHooks {
  // Remix
  ready: (Remix: Remix) => HookResult;
  close: (Remix: Remix) => HookResult;

  'modules:before': () => HookResult;
  'modules:done': () => HookResult;

  'app:resolve': (app: RemixApp) => HookResult;

  'build:before': () => HookResult;
  'build:done': () => HookResult;
  'build:assetsManifest': (manifest: AssetsManifest) => HookResult;

  'builder:watch': (event: WatchEvent, path: string) => HookResult;

  'server:devHandler': (handler: EventHandler) => HookResult;

  'imports:sources': (presets: ImportPresetWithDeprecation[]) => HookResult;
  'imports:extend': (imports: Import[]) => HookResult;
  'imports:dirs': (dirs: string[]) => HookResult;

  // CLI
  'build:error': (error: Error) => HookResult;
  'prepare:types': (options: {
    references: TSReference[];
    declarations: string[];
    tsConfig: TSConfig;
  }) => HookResult;
  listen: (listenerServer: HttpServer | HttpsServer, listener: any) => HookResult;

  // Vite
  'vite:extend': (viteBuildContext: { remix: Remix; config: ViteInlineConfig }) => HookResult;
  'vite:extendConfig': (
    viteInlineConfig: ViteInlineConfig,
    env: { isClient: boolean; isServer: boolean }
  ) => HookResult;
  'vite:serverCreating': (
    viteInlineConfig: ViteInlineConfig,
    env: { isClient: boolean; isServer: boolean }
  ) => HookResult;
  'vite:serverCreated': (
    viteServer: ViteDevServer,
    env: { isClient: boolean; isServer: boolean }
  ) => HookResult;
  'vite:compiled': () => HookResult;
}

export type RemixHookName = keyof RemixHooks;
