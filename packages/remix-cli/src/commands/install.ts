import { execSync } from 'node:child_process';
import consola from 'consola';
import { resolve } from 'pathe';
import { getPackageManager, packageManagerLocks } from '../utils/packageManagers';
import { rmRecursive, touchFile } from '../utils/fs';
import { cleanupRemixDirs } from '../utils/remix';
import { defineRemixCommand } from './index';
import { readPackageJSON, resolvePackageJSON, writePackageJSON } from 'pkg-types';

async function getRemixKitVersion(path: string): Promise<string | null> {
  try {
    const pkg = await readPackageJSON('@remix-kit/kit', { url: path });
    if (!pkg.version) {
      consola.warn('Cannot find any installed RemixKit versions in ', path);
    }
    return pkg.version || null;
  } catch {
    return null;
  }
}

export default defineRemixCommand({
  meta: {
    name: 'install',
    usage: 'npx remix-kit install [--force|-f] [--noscripts|-ns]',
    description: 'Install or upgrade remix-kit in an existing Remix app',
  },
  async invoke(args) {
    const rootDir = resolve(args._[0] || '.');

    // Check package manager
    const packageManager = getPackageManager(rootDir);
    if (!packageManager) {
      console.error('Cannot detect Package Manager in', rootDir);
      process.exit(1);
    }
    const packageManagerVersion = execSync(`${packageManager} --version`).toString('utf8').trim();
    consola.info('Package Manager:', packageManager, packageManagerVersion);

    // Check currently installed remix version
    const currentVersion = await getRemixKitVersion(rootDir);
    if (currentVersion) {
      consola.info('Found RemixKit version to upgrade:', currentVersion);
    }

    // Force install
    if (args.force || args.f) {
      consola.info('Removing lock-file and node_modules...');
      const pmLockFile = resolve(rootDir, packageManagerLocks[packageManager]);
      await rmRecursive([pmLockFile, resolve(rootDir, 'node_modules')]);
      await touchFile(pmLockFile);
    }

    // Install latest version
    consola.info('Installing latest RemixKit release...');
    execSync(
      `${packageManager} ${
        packageManager === 'yarn' ? 'add' : 'install'
      } -D remix-kit @remix-kit/vite @remix-kit/react`,
      { stdio: 'inherit', cwd: rootDir }
    );

    // Cleanup after install/upgrade
    await cleanupRemixDirs(rootDir);

    // Check installed remix version again
    const upgradedVersion = (await getRemixKitVersion(rootDir)) || '[unknown]';
    consola.info('Installed RemixKit version:', upgradedVersion);

    if (upgradedVersion === currentVersion) {
      consola.success("You're already using the latest version of RemixKit.");
    } else if (currentVersion) {
      consola.success('Successfully upgraded RemixKit from', currentVersion, 'to', upgradedVersion);
    } else {
      consola.success('Successfully installed RemixKit', upgradedVersion);
    }

    // Add default RemixKit npm scripts to package.json
    if (!args.noscripts && !args.ns) {
      consola.info('Adding default RemixKit npm scripts to...');

      const filename = await resolvePackageJSON();
      if (!filename) {
        consola.warn('Cannot find any package.json in ', process.cwd());
      } else {
        consola.log(`  ${filename}`);

        const pkg = await readPackageJSON();

        pkg.scripts = pkg.scripts || {};

        if (!pkg.scripts['vite:dev']) {
          pkg.scripts['vite:dev'] = 'remix-kit dev --origin http://localhost:3000';
          consola.info(`Added "vite:dev": "${pkg.scripts['vite:dev']}"`);
          consola.warn(`Update the --origin flag based on your Remix App Server URL.`);
        }

        if (!pkg.scripts['vite:build']) {
          pkg.scripts['vite:build'] = 'remix-kit build';
          consola.info(`Added "vite:build": "${pkg.scripts['vite:build']}"`);
        }

        if (!pkg.scripts['vite:preview']) {
          pkg.scripts['vite:preview'] = 'remix-kit preview';
          consola.info(`Added "vite:preview": "${pkg.scripts['vite:preview']}"`);
        }

        if (!pkg.scripts['dev:server']) {
          pkg.scripts['dev:server'] = 'remix-kit preview';
          consola.info(`Added a stub "dev:server": "${pkg.scripts['dev:server']}"`);
          consola.warn(`Update 'dev:server' script with a command to start your Remix App server.`);
        }

        await writePackageJSON(filename, pkg);

        consola.success(`Updated package.json npm scripts.\n`);
        consola.success(
          `All done! Run '${packageManager} run vite:dev' after reviewing the above.`
        );
      }
    }
  },
});
