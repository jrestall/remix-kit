import type { Remix } from '@remix-kit/schema';
import { bold, green } from 'colorette';
import reactPlugin from '@vitejs/plugin-react-swc';
import { ReactRefresh } from './plugins/react-refresh';
import { tryRequireModule } from '@remix-kit/kit';
import { InjectReactRefresh } from './plugins/inject-react-refresh';

export function setup(remix: Remix) {
  showReactVersion(remix.options.rootDir);

  remix.hook('vite:extendConfig', (config) => {
    config.optimizeDeps?.include?.push('react', 'react-dom');
    config.plugins?.push(InjectReactRefresh.vite(remix), ReactRefresh.vite(), reactPlugin());
  });
}

function showReactVersion(cwd: string) {
  const getPkgVersion = (pkg: string) => {
    return tryRequireModule(`${pkg}/package.json`, cwd)?.version || '';
  };
  const reactVersion = getPkgVersion('react');
  console.log(green(`React ${bold(reactVersion)}`));
}
