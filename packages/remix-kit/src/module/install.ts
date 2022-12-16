import type { Remix, RemixModule } from '@remix-kit/schema';
import { useRemix } from '../context';
import { resolveModule, requireModule, importModule } from '../utils/cjs';
import { resolveAlias } from '../resolve';

/** Installs a module on a Remix instance. */
export async function installModule(
  moduleToInstall: string | RemixModule,
  _inlineOptions?: any,
  _remix?: Remix
) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const remix = useRemix();
  const { remixModule, inlineOptions } = await normalizeModule(
    moduleToInstall,
    _inlineOptions
  );

  // Call module
  await remixModule(inlineOptions, remix);

  if (typeof moduleToInstall === 'string') {
    remix.options.build.transpile.push(moduleToInstall);
  }

  remix.options._installedModules = remix.options._installedModules || [];
  remix.options._installedModules.push({
    meta: await remixModule.getMeta?.(),
    entryPath:
      typeof moduleToInstall === 'string'
        ? resolveAlias(moduleToInstall)
        : undefined,
  });
}

// --- Internal ---

async function normalizeModule(
  remixModule: string | RemixModule,
  inlineOptions?: any
) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const remix = useRemix();

  // Import if input is string
  if (typeof remixModule === 'string') {
    const _src = resolveModule(resolveAlias(remixModule), remix.options.modulesDir);
    // TODO: also check with type: 'module' in closest `package.json`
    const isESM = _src.endsWith('.mjs');

    try {
      remixModule = isESM ? await importModule(_src) : requireModule(_src);
    } catch (error: unknown) {
      console.error(`Error while requiring module \`${remixModule}\`: ${error}`);
      throw error;
    }
  }

  // Throw error if input is not a function
  if (typeof remixModule !== 'function') {
    throw new TypeError('Remix module should be a function: ' + remixModule);
  }

  return { remixModule, inlineOptions } as {
    remixModule: RemixModule<any>;
    inlineOptions: undefined | Record<string, any>;
  };
}
