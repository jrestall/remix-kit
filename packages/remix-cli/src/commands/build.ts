import { resolve } from 'pathe';
import consola from 'consola';
import { clearDir } from '../utils/fs';
import { overrideEnv } from '../utils/env';
import { showVersions } from '../utils/banner';
import { defineRemixCommand } from './index';
import { loadRemix, buildRemix } from '@remix-kit/kit';
import { writeTypes } from '../utils/prepare';

export default defineRemixCommand({
  meta: {
    name: 'build',
    usage: 'npx remix build [--dotenv] [rootDir]',
    description: 'Build remix for production deployment',
  },
  async invoke(args) {
    overrideEnv('production');

    const cwd = resolve(args._[0] || '.');
    showVersions(cwd);

    const remix = await loadRemix({
      cwd,
      dotenv: {
        cwd,
        fileName: args.dotenv,
      },
    });

    await clearDir(remix.options.buildDir);

    await writeTypes(remix)

    remix.hook('build:error', (err: any) => {
      consola.error('Remix Build Error:', err);
      process.exit(1);
    });

    await buildRemix(remix);
  },
});
