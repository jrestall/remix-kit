import express from 'express';
import compression from 'compression';
import morgan from 'morgan';
import { createRequestHandler } from '@remix-run/express';
import { RemixKitRunner } from '@remix-kit/vite';

const app = express();

app.use(compression());

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable('x-powered-by');

// Remix fingerprints its assets so we can cache forever.
app.use('/build', express.static('public/build', { immutable: true, maxAge: '1y' }));

// Everything else (like favicon.ico) is cached for an hour. You may want to be
// more aggressive with this caching.
app.use(express.static('public', { maxAge: '1h' }));

app.use(morgan('tiny'));

const port = process.env.PORT || 3001;

const runner = new RemixKitRunner({ mode: process.env.NODE_ENV });
app.all('*', async (req, res, next) => {
  await runner.execute(({ build, mode, err }) => {
    if (err) res.end(err);
    if (build) createRequestHandler({ build, mode })(req, res, next);
  });
});

console.log(`Express server starting...`);
app.listen(port, async () => {
  console.log(`Express server listening on port ${port}`);
  await runner.ready(`http://localhost:${port}`);
});
