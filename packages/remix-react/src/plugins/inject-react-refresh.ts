import type { Remix } from '@remix-kit/schema';
import { createUnplugin } from 'unplugin';
import MagicString from 'magic-string';
import { logger } from '@remix-kit/kit';
import { sep } from 'pathe';
import { filename } from 'pathe/utils';

// Injects the ReactRefresh code into the root route to enable HMR

export const InjectReactRefresh = createUnplugin(function (remix: Remix) {
  return {
    name: 'remix:inject-react-refresh',
    enforce: 'pre',
    vite: {
      apply: 'serve',
    },
    async transform(code, id) {
      if (remix.options.devServer.injectRefresh !== true) return;

      // Match to the root.tsx route file. Root is never in /routes.
      if (filename(id) !== 'root' || id.split(sep).includes('routes')) return;

      // Remove any LiveReload component if present
      const magicString = new MagicString(code);
      magicString.replace(/<LiveReload .*\/>/, '');

      // Skip injection if component has been added manually
      if (code.indexOf('<ReactRefresh') >= 0 || code.indexOf('@react-refresh') >= 0) {
        return { code: magicString.toString(), map: magicString.generateMap() };
      }

      // Inject the ReactRefresh script into the <head>
      const headIndex = code.indexOf('</head>');
      if (headIndex === -1) {
        logger.warn("Couldn't find a </head> tag in the root route to inject ReactRefresh into.");
        return;
      }

      magicString.appendLeft(
        headIndex,
        `<script
          type="module"
          dangerouslySetInnerHTML={{
            __html: \`
              import { injectIntoGlobalHook } from '/@react-refresh';
              injectIntoGlobalHook(window);
              window.$RefreshReg$ = () => {};
              window.$RefreshSig$ = () => (type) => type;
              window.__vite_plugin_react_preamble_installed__ = true;\`
          }}
        />`
      );

      return { code: magicString.toString(), map: magicString.generateMap() };
    },
  };
});
