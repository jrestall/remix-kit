import type { Remix } from '@remix-kit/schema';
import { bold, green } from 'colorette';
import vuePlugin from '@vitejs/plugin-vue';
import type { Options as VuePluginOptions } from '@vitejs/plugin-vue'
import viteJsxPlugin from '@vitejs/plugin-vue-jsx';
import { tryRequireModule } from '@remix-kit/kit';
import type { UserConfig as ViteUserConfig } from 'vite'

interface ViteConfig extends ViteUserConfig {
  /**
   * Options passed to @vitejs/plugin-vue
   * @see https://github.com/vitejs/vite/tree/main/packages/plugin-vue
   */
   vue?: VuePluginOptions
}

export function setup(remix: Remix) {
  showVueVersion(remix.options.rootDir);

  remix.hook('vite:extend', (ctx) => {
    ctx.config.optimizeDeps?.include?.push('vue');
    const vueViteConfig = ctx.config as ViteConfig;
    ctx.config.plugins?.push(vuePlugin(vueViteConfig.vue), viteJsxPlugin());
  });

  remix.hook('vite:extendConfig', (config, env) => {
    if (env.isServer) {
      if (Array.isArray(config.ssr?.noExternal)) {
        config.ssr?.noExternal?.push('/__vue-jsx');
      }
    }
  });
}

function showVueVersion(cwd: string) {
  const getPkgVersion = (pkg: string) => {
    return tryRequireModule(`${pkg}/package.json`, cwd)?.version || '';
  };
  const vueVersion = getPkgVersion('vue');
  console.log(green(`Vue ${bold(vueVersion)}`));
}
