import type { Remix } from '@remix-kit/schema';
import { createUnplugin } from 'unplugin';
import { createServerManifest } from '../../utils/manifest';

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
    async load(id) {
      if (id === resolvedVirtualServerBuildId) {
        return createServerManifest(remix.options, remix._assetsManifest);
      }
      return null;
    },
  };
});
