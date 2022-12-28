import { logger, tryRequireModule } from '@remix-kit/kit';
import { gray } from 'colorette';
import shell from 'shelljs';
import type { ChildProcess } from 'child_process';

export async function startOriginServer(rootDir: string): Promise<ChildProcess | null> {
  const start = performance.now();

  // Get the package.json scripts for the remix app
  const scripts = tryRequireModule(`${rootDir}/package.json`)?.scripts || null;
  if (!scripts) throw new Error(`Couldn't find the remix server's package.json in ${rootDir}`);

  // Get "dev:server" script
  const command = scripts['dev:server'];
  if (!command) {
    // Just warn here as developer may want to start the remix server manually on a remote server.
    logger.info(
      `Can't automatically start Remix server as no 'dev:server' npm script found in package.json.`
    );
    return null;
  }

  logger.info(`Starting Remix server... \`${gray(command)}\`\n`);

  // Execute the script
  const withTimeout = (millis: number | undefined, promise: any) => {
    const timeout = new Promise((_resolve, reject) =>
      setTimeout(() => reject(`Timed out after ${millis} ms.`), millis)
    );
    return Promise.race([promise, timeout]);
  };

  const child = shell.exec(command, { async: true });

  // Skip waiting for origin server config if it's already been provided.
  if (process.env.ORIGIN_SERVER && process.env.ORIGIN_SERVER !== 'undefined') {
    return child;
  }

  const waitForConfig = new Promise<void>((resolve, reject) => {
    if (!child.stdout || !child.stderr) {
      reject('No stdout!');
      return;
    }
    child.stdout.on('data', (data: string) => {
      if (typeof data !== 'string') return;
      if(data.indexOf("Remix server ready") >= 0) resolve();
      const prefix = 'Runner started on ';
      const index = data.indexOf(prefix);
      if (index >= 0) {
        // Extracts the url from "Runner started on http://localhost:3000\n"
        const newlineIndex = data.indexOf('\n', index + prefix.length);
        const origin_server = data.substring(index + prefix.length, newlineIndex);
        if(origin_server.length > 1) {
          process.env.ORIGIN_SERVER = origin_server;
        }
        resolve();
      }
    });
    child.stderr.on('error', (err: Error) => {
      reject(err);
    });
  });

  await withTimeout(40000, waitForConfig);

  const time = Math.round((performance.now() - start) * 1000) / 1000;
  logger.success(`Remix server ready`, time ? `in ${time}ms` : '', '\n');

  return child;
}
