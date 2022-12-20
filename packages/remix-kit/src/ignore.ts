import fse from 'fs-extra';
import ignore from 'ignore';
import { join, relative } from 'pathe';
import { tryUseRemix } from './context';

/**
 * Return a filter function to filter an array of paths
 */
export function isIgnored(pathname: string): boolean {
  const remix = tryUseRemix();

  // Happens with CLI reloads
  if (!remix) {
    return false;
  }

  if (!remix._ignore) {
    remix._ignore = ignore(remix.options.ignoreOptions);
    remix._ignore.add(remix.options.ignore);

    const remixignoreFile = join(remix.options.rootDir, '.remixignore');
    if (fse.existsSync(remixignoreFile)) {
      remix._ignore.add(fse.readFileSync(remixignoreFile, 'utf-8'));
    }
  }

  const relativePath = relative(remix.options.rootDir, pathname);
  if (relativePath.startsWith('..')) {
    return false;
  }
  return !!(relativePath && remix._ignore.ignores(relativePath));
}
