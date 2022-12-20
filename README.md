<p align="center">
<img src="docs/assets/remix-kit.png?raw=true" height="150">
</p>
<h1 align="center">
RemixKit
</h1>
<p align="center">
Remix development, streamlined with <a href="https://vitejs.dev/">Vite</a>. 
</p>
<p align="center">
An alternative dev server and compiler for the brilliant <a href="https://remix.run/docs">Remix</a> web framework.
</p>
<p align="center">
  <a href="https://github.com/jrestall/remix-kit/releases"><img src="https://img.shields.io/badge/stability-alpha-f4d03f.svg"></a>
  <a href="https://www.npmjs.com/package/remix-kit"><img src="https://img.shields.io/npm/v/@remix-kit/cli?color=FCC72B&label="></a>
</p>

### Features
- [Hot Module Replacement (HMR)](https://vitejs.dev/guide/features.html#hot-module-replacement) for **instant, precise updates** on the browser and server without reloading the page or blowing away application state.
- Instant development server startup, **no pre-bundling required**, scales to any project size. 
- [Vite](https://vitejs.dev/) for development and build bundling. Includes [vite-node](https://github.com/vitest-dev/vitest/tree/main/packages/vite-node) for extremely fast targeted server code replacement. No purgeRequireCache needed, keep objects in-memory between requests to match production behavior.
- Fully **configurable** & easily **extensible**
  - An extensible compiler and hooks system gives you complete control. 
  - Use [hooks](packages/remix-schema/src/types/hooks.ts) from your own `plugin modules` to extend any part of the build process.
  - Benefit from the large ecosystem of vite plugins.
- Easy to use CLI `remix-kit` for development, build, previews and more.
- **Seamless integration** of Tailwind CSS with PostCSS. No need for multiple CLIs.
- View **library agnostic**, with existing plugin for [React](https://reactjs.org/).
- Monorepo support, place your routes in libraries outside the main app to better separate your functionality amongst teams.
- Integrated dotenv, bundle analysis, hierarchy based `remix.config.js`, file ignore with `.remixignore` and much more!

#### Future Roadmap
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

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for information on how to develop RemixKit locally.

## Supporting RemixKit

RemixKit is an MIT-licensed open source project with its ongoing development made possible entirely by volunteer time. If you'd like to support this effort, please consider:

## Credit

This project was bootstrapped using code from [Nuxt](https://github.com/nuxt). Their MIT license can be found [here](./COPYRIGHTS.md). In addition it benefits greatly from a large number of libraries from the [UnJS](https://github.com/unjs) ecosystem. [Vite](https://vitejs.dev/) and [vite-node](https://github.com/vitest-dev/vitest/tree/main/packages/vite-node#readme) provide most of the core functionality and their usage is based on the approach pioneered by [@pi0](https://github.com/pi0) and described in detail by [@antfu](https://github.com/antfu) at [antfu.me](https://antfu.me/posts/dev-ssr-on-nuxt#approach-3-vite-node).

## License

[MIT](https://github.com/sveltejs/kit/blob/master/LICENSE)
