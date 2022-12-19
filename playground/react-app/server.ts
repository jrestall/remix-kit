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

let runner = new RemixKitRunner();
app.all('*', async (req, res, next) => {
  return await runner.execute((build) => {
    if (!build) return;
    const requestHandler = createRequestHandler({ build, mode: process.env.NODE_ENV });
    return requestHandler(req, res, next);
  });
});

const port = process.env.PORT || 3001;

console.log(`Express server starting...`);
app.listen(port, () => {
  console.log(`Express server listening on port ${port}`);
});
