import { json } from '@remix-run/node';
import { Link } from '@remix-run/react';
import { useLoaderData } from '@remix-run/react';

export async function loader() {
  return json({ name: 'Team 1' });
}

export default function Index() {
  const data = useLoaderData<typeof loader>();
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', lineHeight: '1.4' }}>
      <Link to="/">Back</Link>
      <h1>Welcome to {data.name}</h1>
    </div>
  );
}
