import type { MetaFunction } from '@remix-run/node';
import { Links, LiveReload, Meta, Outlet, Scripts, useLoaderData } from '@remix-run/react';

import React from 'react';
import stylesUrl from './styles/tailwind.css';
import { json } from '@remix-run/node';

export const meta: MetaFunction = () => ({
  charset: 'utf-8',
  title: 'My Remix App',
  viewport: 'width=device-width,initial-scale=1',
});

export async function loader() {
  return json({ test: 'Root Loader Data Test' });
}

export function links() {
  return [{ rel: 'stylesheet', href: stylesUrl }];
}

export default function App() {
  const data = useLoaderData<typeof loader>();
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <LiveReload />
        <Scripts />
        {data.test}
      </body>
    </html>
  );
}
