import { json } from '@remix-run/node';
import { getServerData } from '../test';
import { Link, useLoaderData } from '@remix-run/react';

export async function loader() {
  let data = await getServerData();
  return json(data);
}

export default function Index() {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="leading-7 text-cyan-800">
      <h1 className="text-2xl">Welcome to RemixKit!</h1>
      <ul>
        <li>
          <a href="/__inspect/">Vite Plugin Inspect</a>
        </li>
        <li>
          <Link to="/teams">Test Page</Link>
        </li>
        <li>
          <Link to="/blog">A Test Blog (from the referenced project)</Link>
        </li>
        <li>
          <Link to="/teams" prefetch="intent">
            Test Prefetch (Prefetch On Hover)
          </Link>
        </li>
      </ul>
      Hey I'm loader data: {data}
    </div>
  );
}
