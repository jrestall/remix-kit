import type { Remix } from '@remix-kit/schema';
import { createUnplugin } from 'unplugin';
import { createServerManifest } from '../../utils/manifest';

// Replaces the virtual @remix-run/dev/server-build import with the server manifest for use in
// the server build bundle. Assets Manifest comes from the prior client bundle in assets-manifest.ts.

export const ServerManifest = createUnplugin(function (remix: Remix) {
  let virtualServerBuildId = '@remix-run/dev/server-build';
  const resolvedVirtualServerBuildId = '\0' + virtualServerBuildId;
  return {
    name: 'remix:server-manifest',
    enforce: 'pre',
    vite: {
      apply: 'build',
    },
    resolveId(id) {
      if (id === virtualServerBuildId) {
        return resolvedVirtualServerBuildId;
      }
      return null;
    },
    load(id) {
      if (id === resolvedVirtualServerBuildId) {
        return createServerManifest(remix.options, remix._assetsManifest);
      }
      return null;
    },
  };
});
