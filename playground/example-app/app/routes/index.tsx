import { json } from '@remix-run/node';
import { getServerData } from '../test';
import { Link } from '@remix-run/react';

export async function loader() {
  const data = await getServerData();
  return json(data);
}

export default function Index() {
  return (
    <div className="leading-7 text-cyan-800">
      <h1 className="text-2xl">Welcome to RemixKit!</h1>
      <ul>
        <li>
          <Link to="/teams">Teams List</Link>
        </li>
        <li>
          <a href="/__inspect/">Vite Plugin Inspect</a>
        </li>
        <li>
          <Link to="/teams" prefetch="intent">
            Teams List (Prefetch On Hover)
          </Link>
        </li>
      </ul>
    </div>
  );
}
