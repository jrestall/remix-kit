import { resolve } from 'pathe';
import consola from 'consola';
import { rmRecursive } from './fs';

export async function cleanupRemixDirs(rootDir: string) {
  consola.info('Cleaning up generated files and caches...');

  await rmRecursive(['public/build', 'node_modules/.vite'].map((dir) => resolve(rootDir, dir)));
}
