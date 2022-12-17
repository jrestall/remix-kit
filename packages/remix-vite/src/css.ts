import { requireModule } from '@remix-kit/kit';
import type { Remix } from '@remix-kit/schema';
import type { ViteOptions } from './vite';
import { distDir } from './dirs';
import { loadConfig } from 'c12';

type PostCSS = NonNullable<Exclude<NonNullable<ViteOptions['css']>['postcss'], string>>;

export async function resolveCSSOptions(remix: Remix): Promise<ViteOptions['css']> {
  let css: ViteOptions['css'] & {
    postcss: PostCSS;
  } = {
    postcss: {
      plugins: [],
    },
  };

  // merge any postcss.config.js file with the other postcss options
  const result = await loadConfig<PostCSS>({
    cwd: remix.options.rootDir,
    defaults: remix.options.postcss as PostCSS,
    name: 'postcss',
  });

  if (result.config) {
    css.postcss = result.config;
    remix.options.postcss = result.config;
  }

  if (remix.options.postcss.plugins) {
    const lastPlugins = ['autoprefixer', 'cssnano'];
    css.postcss.plugins = Object.entries(remix.options.postcss.plugins)
      .sort((a, b) => lastPlugins.indexOf(a[0]) - lastPlugins.indexOf(b[0]))
      .filter(([, opts]) => opts)
      .map(([name, opts]) => {
        const plugin = requireModule(name, [...remix.options.modulesDir, distDir]);
        return plugin(opts);
      });
  }

  return css;
}
