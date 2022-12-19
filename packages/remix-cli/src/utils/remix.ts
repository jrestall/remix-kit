import { resolve } from 'pathe';
import consola from 'consola';
import { rmRecursive } from './fs';

export async function cleanupRemixDirs(rootDir: string) {
  consola.info('Cleaning up generated remix files and caches...');

  await rmRecursive(
    [
      'dist',
      'public/build',
      'node_modules/.vite',
      'node_modules/.cache',
    ].map((dir) => resolve(rootDir, dir))
  );
}
