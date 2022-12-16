import { execa } from 'execa';
import { resolve } from 'pathe';
import { buildRemix, loadRemix, tryResolveModule } from '@remix-kit/kit';
import { defineRemixCommand } from './index';
import { writeTypes } from '../utils/prepare';

export default defineRemixCommand({
  meta: {
    name: 'typecheck',
    usage: 'npx remix typecheck [rootDir]',
    description: 'Runs `tsc` to check types throughout your app.'
  },
  async invoke (args) {
    process.env.NODE_ENV = process.env.NODE_ENV || 'production';
    const cwd = resolve(args._[0] || '.');

    const remix = await loadRemix({ cwd });

    // Generate types and build remix instance
    await writeTypes(remix)
    await buildRemix(remix);
    await remix.close();

    // Prefer local install if possible
    const hasLocalInstall = tryResolveModule('typescript', cwd) && tryResolveModule('tsc/package.json', cwd);
    if (hasLocalInstall) {
      await execa('tsc', ['--noEmit'], { preferLocal: true, stdio: 'inherit', cwd });
    } else {
      await execa('npx', '-p tsc -p typescript tsc --noEmit'.split(' '), { stdio: 'inherit', cwd });
    }
  }
})