import React from 'react';

export const ReactRefresh =
  process.env.NODE_ENV !== 'development'
    ? () => null
    : function ReactRefresh() {
        return React.createElement('script', {
          type: 'module',
          suppressHydrationWarning: true,
          dangerouslySetInnerHTML: {
            __html: `
            import { injectIntoGlobalHook } from '/@react-refresh';
            injectIntoGlobalHook(window);
            window.$RefreshReg$ = () => {};
            window.$RefreshSig$ = () => (type) => type;
            window.__vite_plugin_react_preamble_installed__ = true;`,
          },
        });
      };
