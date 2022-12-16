import { requireModule } from '@remix-kit/kit'
import type { Remix } from '@remix-kit/schema'
import type { ViteOptions } from './vite'
import { distDir } from './dirs'

export function resolveCSSOptions (remix: Remix): ViteOptions['css'] {
  const css: ViteOptions['css'] & { postcss: NonNullable<Exclude<NonNullable<ViteOptions['css']>['postcss'], string>> } = {
    postcss: {
      plugins: []
    }
  }

  const lastPlugins = ['autoprefixer', 'cssnano']
  css.postcss.plugins = Object.entries(remix.options.postcss.plugins)
    .sort((a, b) => lastPlugins.indexOf(a[0]) - lastPlugins.indexOf(b[0]))
    .filter(([, opts]) => opts)
    .map(([name, opts]) => {
      const plugin = requireModule(name, [
        ...remix.options.modulesDir,
        distDir
      ])
      return plugin(opts)
    })

  return css
}