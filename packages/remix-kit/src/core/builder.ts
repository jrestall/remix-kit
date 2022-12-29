import chokidar from 'chokidar';
import type { Remix, RemixBuilder } from '@remix-kit/schema';
import { normalize } from 'pathe';
import { isIgnored } from '../ignore';
import { importModule } from '../utils/cjs';

export async function getBuilder(remix: Remix): Promise<RemixBuilder> {
  try {
    return typeof remix.options.builder === 'string'
      ? await importModule(remix.options.builder, remix.options.rootDir)
      : remix.options.builder;
  } catch (error: any) {
    await remix.callHook('build:error', error);

    if (error.toString().includes("Cannot find module '@remix-kit/vite'")) {
      throw new Error(
        [
          'Could not load `@remix-kit/vite`. You may need to add it to your project dependencies.',
        ].join('\n')
      );
    }

    throw error;
  }
}

export async function buildRemix(remix: Remix) {
  if (remix.options.dev) {
    watch(remix);
  }

  const { bundle } = await getBuilder(remix);
  await remix.callHook('build:before');
  await bundle(remix);
  await remix.callHook('build:done');

  if (!remix.options.dev) {
    await remix.callHook('close', remix);
  }
}

function watch(remix: Remix) {
  const watcher = chokidar.watch(
    remix.options._layers.map((i) => i.config.srcDir as string).filter(Boolean),
    {
      ...remix.options.watchers.chokidar,
      cwd: remix.options.srcDir,
      ignoreInitial: true,
      ignored: [isIgnored, '.cache', 'node_modules'],
    }
  );

  watcher.on('all', (event, path) => remix.callHook('builder:watch', event, normalize(path)));
  remix.hook('close', () => watcher.close());
  return watcher;
}
