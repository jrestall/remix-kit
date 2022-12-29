import { relative, resolve } from 'pathe';
import consola from 'consola';
import { defineRemixCommand } from './index';
import { getBuilder, loadRemix } from '@remix-kit/kit';

export default defineRemixCommand({
  meta: {
    name: 'preview',
    usage: 'npx remix-kit preview|start [--dotenv] [rootDir]',
    description: 'Launches a server for local testing after `remix-kit build`.',
  },
  async invoke(args) {
    process.env.NODE_ENV = process.env.NODE_ENV || 'production';
    const cwd = resolve(args._[0] || '.');

    const remix = await loadRemix({
      cwd,
      dotenv: {
        cwd,
        fileName: args.dotenv,
      },
    });

    remix.hook('build:error', (err: any) => {
      consola.error('Remix Preview Error:', err);
      process.exit(1);
    });

    consola.info('Node.js version:', process.versions.node);
    consola.info('Working dir:', relative(cwd, remix.options.buildDir));
    consola.log('');
    consola.info('Starting preview.');
    consola.log('');

    const builder = await getBuilder(remix);
    await builder.preview(remix);

    return 'wait' as const;
  },
});
