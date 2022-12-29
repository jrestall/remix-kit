# Getting Started

Add RemixKit alongside your existing Remix dev experience in minutes by having the CLI install dependencies and add npm scripts to your package.json.

```shell
> cd ./your-remix-app
> npx remix-kit@latest install
```

All Done!

```shell
> npm run vite:dev
```

### Tips

- See the [status](https://github.com/jrestall/remix-kit#status) section for any additional setup steps if using a standard `create-remix` template.
- A `dev:server` package.json npm script is important so that the RemixKit dev server knows how to start your Remix app.
- An `--origin` flag should be passed to `remix-kit dev`. This specifies the URL of your Remix app that the dev server will proxy requests through to.
- You can remove any `purgeRequireCache` functions as they are no longer necessary.

# Manual Install

## Install Remix Kit

Install the RemixKit libraries as devDependencies to your existing Remix project. You can use your preferred package manager, below we use pnpm.

```shell
pnpm i -D remix-kit @remix-kit/vite @remix-kit/react
```

We require these three separate packages since Remix Kit's compiler and rendering library is extensible and you could replace with other options.

## Setup package.json

Add the RemixKit CLI commands such as below. Use a prefix such as `vite:` to support both Remix and RemixKit development experiences in parallel.

```json
"scripts": {
  "dev": "remix-kit dev --origin http://localhost:3000",
  "dev:server": "node ./server.js",
  "start": "remix-kit preview",
  "build": "remix-kit build"
}
```

- A "dev:server" script is required to tell the dev server how to start the Remix app.
- An `--origin` flag is required to tell the dev server where your Remix app is hosted.

## Done

Congrats! Now just run `npm run dev` to start both the development server and your Remix app.
