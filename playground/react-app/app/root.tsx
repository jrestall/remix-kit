import type { MetaFunction } from '@remix-run/node';
import { Links, Meta, Outlet, Scripts } from '@remix-run/react';
import { ReactRefresh } from '@remix-kit/react';
import React from 'react';
import stylesUrl from "./styles/tailwind.css?url"

export const meta: MetaFunction = () => ({
  charset: 'utf-8',
  title: 'My Remix App',
  viewport: 'width=device-width,initial-scale=1',
});   

export function links() {
  return [{ rel: "stylesheet", href: stylesUrl }]
}

export default function App() {
  return (
    <html lang="en">
      <head>
        <Meta />
        <ReactRefresh />
        <Links />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
