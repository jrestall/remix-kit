import express from 'express';
import compression from 'compression';
import morgan from 'morgan';
import { createRequestHandler } from '@remix-run/express';
import * as build from '@remix-run/dev/server-build';

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

app.all('*', (req, res, next) => {
  return createRequestHandler({
    build,
    mode: process.env.NODE_ENV,
  })(req, res, next);
});

const port = process.env.PORT || 3000;

if (process.env.NODE_ENV === "production") {
  console.log(`Express server starting...`);
  app.listen(port, () => {
    console.log(`Express server listening on port ${port}`);
  });
}

export const devServer = app;
