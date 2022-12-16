import { json } from '@remix-run/node';
import { getServerData } from '../test.server';
import { Link } from '@remix-run/react';

export async function loader() {
  const data = getServerData();
  return json(data);
} 

export default function Index() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', lineHeight: '1.4' }}>
      <h1>Welcome to Remix!11</h1>
      <ul>
        <li>
          <Link to="/teams">Teams List</Link>
        </li>
        <li>
          <a target="_blank" href="https://remix.run/tutorials/jokes" rel="noreferrer">
            Deep Dive Jokes App Tutorial
          </a>
        </li>
        <li>
          <Link to="/teams" prefetch="intent">Teams List (Prefetch On Hover)</Link>
        </li>
      </ul>
    </div>
  );
}
