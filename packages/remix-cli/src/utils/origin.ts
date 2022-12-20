import { logger, tryRequireModule } from '@remix-kit/kit';
import { gray } from 'colorette';
import shell from 'shelljs';

export async function startOriginServer(rootDir: string) {
  const start = performance.now();

  // Get the package.json scripts for the remix app
  const scripts = tryRequireModule(`${rootDir}/package.json`)?.scripts || null;
  if (!scripts) throw new Error(`Couldn't find the remix server's package.json in ${rootDir}`);

  // Get "dev:server" script
  const command = scripts['dev:server'];
  if (!scripts) {
    // Just warn here as developer may want to start the remix server manually on a remote server.
    logger.warn(`Dev server couldn't find a 'dev:server' npm script to automatically start the remix server in the package.json in ${rootDir}`);
    return null;
  }

  logger.info(`Starting Remix server... \`${gray(command)}\`\n`);

  // Execute the script
  const withTimeout = (millis: number | undefined, promise: any) => {
    const timeout = new Promise((resolve, reject) =>
      setTimeout(() => reject(`Timed out after ${millis} ms.`), millis)
    );
    return Promise.race([promise, timeout]);
  };

  const child = shell.exec(command, { async: true });

  // Skip waiting for origin server config if it's already been provided.
  if (process.env.ORIGIN_SERVER && process.env.ORIGIN_SERVER !== 'undefined'){
    return child;
  };

  const waitForConfig = new Promise<void>((resolve, reject) => {
    if (child.stdout && child.stderr) {
      child.stdout.on('data', (data: string) => {
        const prefix = 'ℹ Runner started on ';
        if (typeof data === 'string' && data.startsWith(prefix)) {
          const origin_server = data.substring(prefix.length);
          process.env.ORIGIN_SERVER = origin_server;
          resolve();
        }
      });
      child.stderr.on('error', (err: Error) => {
        reject(err);
      });
    }
  });

  await withTimeout(45000, waitForConfig);

  const time = Math.round((performance.now() - start) * 1000) / 1000;
  logger.success(`Remix server ready`, time ? `in ${time}ms` : '', '\n');

  return child;
}
