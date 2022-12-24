# Getting Started

## Install Remix Kit

First step is to install the `@remix-kit/*` dependencies to your Remix project. You can use your preferred package manager, below we use npm.

`npm i @remix-kit/cli --save-dev`

`npm i @remix-kit/vite`

`npm i @remix-kit/react`

We require these three separate packages since Remix Kit's compiler and rendering library is extensible and you could replace with other options.

## Setup package.json

Replace the Remix CLI commands with the Remix Kit CLI commands such as below.
**Important: A "dev:server" script is required if you want the Remix Kit Development Server to automatically start your Remix Server App.**
```json
"scripts": {
  "build": "remix-kit build",
  "dev": "remix-kit dev",
  "dev:server": "node ./server.js",
  "start": "remix-kit preview"
}
```

Without a "dev:server" script you will need to tell the development server where your Remix app is hosted by passing the `--origin` flag to the dev command.
```json
"scripts": {
  "build": "remix-kit build",
  "dev": "remix-kit dev --origin http://localhost:3000",
}
```

## Setup server file

The Remix Kit development server uses a client/server architecture during development to support HMR and on-demand compilation for a fast experience. You must install the development client in your Remix server file to support these functionalities.

An example for an express app would look like the below. Please see a full example [here](https://github.com/jrestall/remix-kit/blob/main/playground/react-app/server.ts).
```ts
import { RemixKitRunner } from '@remix-kit/vite';

const runner = new RemixKitRunner({ mode: process.env.NODE_ENV });
app.all('*', (req, res, next) => {
  runner.execute(({ build, mode, err }) => {
    if (err) res.end(err);
    if (build) createRequestHandler({ build, mode })(req, res, next);
  });
});

console.log(`Express server starting...`);
app.listen(port, () => {
  console.log(`Express server listening on port ${port}`);
  runner.ready(`http://localhost:${port}`);
});
```
 - Please note the `runner.ready('http://localhost:${port}');` on the last line which is important to notify the development server that your app has started and the host it should proxy requests to. 
 - Please remove any purgeRequireCache functions you may have as they are no longer necessary.
 - If you wish to only use Remix Kit in development (recommended during alpha), then please see the example [here](https://github.com/jrestall/remix-kit/blob/main/playground/react-app/) of having a prod and dev server file.
 - Other nodejs based environments are also supported, environments such as Cloudflare's wrangler are unlikely to work.

## Root.tsx route setup

- Please remove the LiveReload component and add the ReactRefresh component to the head as shown [here](https://github.com/jrestall/remix-kit/blob/main/playground/react-app/app/root.tsx).

```tsx
import { ReactRefresh } from '@remix-kit/react';
...
<head>
  <Meta />
  <ReactRefresh />
  <Links />
</head>
```

## Importing CSS as URL
When you import a CSS file, Vite will by [default](https://vitejs.dev/guide/features.html#css) return the CSS in the default export, rather than the URL that Remix does.

To fix this you can add a `?url` [suffix](https://vitejs.dev/guide/assets.html#importing-asset-as-url) to the css file import as below.

```tsx
import tailwindStylesheetUrl from "./styles/tailwind.css?url";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: tailwindStylesheetUrl }];
};
```
## Done

Congrats! Now just run `npm run dev` to start both the development server and your Remix app.

