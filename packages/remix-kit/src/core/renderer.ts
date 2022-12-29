import type { Remix, RemixRenderer } from '@remix-kit/schema';
import { importModule } from '../utils/cjs';

export async function getRenderer(remix: Remix): Promise<RemixRenderer> {
  try {
    return typeof remix.options.renderer === 'string'
      ? await importModule(remix.options.renderer, remix.options.rootDir)
      : remix.options.renderer;
  } catch (error: any) {
    await remix.callHook('build:error', error);

    if (error.toString().includes("Cannot find module '@remix-kit/react'")) {
      throw new Error(
        [
          'Could not load `@remix-kit/react`. You may need to add it to your project dependencies.',
        ].join('\n')
      );
    }

    throw error;
  }
}

export async function loadRenderer(remix: Remix) {
  const renderer = await getRenderer(remix);
  await renderer.setup(remix);
}
