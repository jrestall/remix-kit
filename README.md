<p align="center">
<img src="docs/assets/remix-kit.png?raw=true" height="130">
</p>
<h1 align="center">
RemixKit
</h1>
<p align="center">
Remix development, streamlined with <a href="https://vitejs.dev/">Vite</a>. 
</p>
<p align="center">
An alternative compiler for the brilliant <a href="https://remix.run/docs">Remix</a> web framework.
</p>
<p align="center">
  <a href="https://github.com/jrestall/remix-kit/releases"><img src="https://img.shields.io/badge/stability-alpha-f4d03f.svg"></a>
  <a href="https://www.npmjs.com/package/remix-kit"><img src="https://img.shields.io/npm/v/@remix-kit/cli?color=FCC72B&label="></a>
</p>

### Features
- [Hot Module Replacement (HMR)](https://vitejs.dev/guide/features.html#hot-module-replacement) for instant, precise updates on the browser and server without reloading the page or blowing away application state.
- [Vite](https://vitejs.dev/) for development and build bundling. Includes [vite-node](https://github.com/vitest-dev/vitest/tree/main/packages/vite-node) for extremely fast targeted server code replacement such as for your actions and loaders.
- View library agnostic, with existing plugins for [React](https://reactjs.org/) and [Vue](https://vuejs.org/).
- An extensible compiler and hooks system gives you complete control. 
  - Use [hooks](packages/remix-schema/src/types/hooks.ts) from custom modules to extend any part of the build process.
  - Benefit from the large ecosystem of vite plugins.
- Easy to use CLI `remix-kit` for development, build, previews and more.
- Top-level `await` support, hierarchy based `remix.config.js`, `.remixignore` and much more!.

#### Future Roadmap
- Separate client/server development architecture using vite-node for better web worker support. 
- Module federation DX enhancements with built-in async entry points for use with [gioboa/vite-module-federation](https://github.com/gioboa/vite-module-federation) or [originjs/vite-module-federation](https://github.com/originjs/vite-plugin-federation).
- Library compilation mode. Bundle your entire website functionality as modules for npm distribution and easy inclusion in other Remix websites.

### Packages

| Package                                                                     | Changelog                                                   |
| --------------------------------------------------------------------------- | ------------------------------------------------------------|
| [@remix-kit/cli](packages/remix-cli)                                        | [Changelog](packages/remix-cli/CHANGELOG.md)                |
| [@remix-kit/kit](packages/remix-kit)                                        | [Changelog](packages/remix-kit/CHANGELOG.md)                |
| [@remix-kit/react](packages/remix-react)                                    | [Changelog](packages/remix-react/CHANGELOG.md)              |
| [@remix-kit/schema](packages/remix-schema)                                  | [Changelog](packages/remix-schema/CHANGELOG.md)             | 
| [@remix-kit/vite](packages/remix-vite)                                      | [Changelog](packages/remix-vite/CHANGELOG.md)               |
| [@remix-kit/vue](packages/remix-vue)                                        | [Changelog](packages/remix-vue/CHANGELOG.md)                |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for information on how to develop RemixKit locally.

## Supporting RemixKit

RemixKit is an MIT-licensed open source project with its ongoing development made possible entirely by volunteer time. If you'd like to support this effort, please consider:

## Credit


## License

[MIT](https://github.com/sveltejs/kit/blob/master/LICENSE)
