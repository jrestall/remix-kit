import { resolveAlias as _resolveAlias } from 'pathe/utils';
import { tryUseRemix } from './context';
import { tryResolveModule } from './utils/cjs'
import { resolve, join, normalize, isAbsolute } from 'pathe'
import { promises as fsp, existsSync } from 'node:fs'

export interface ResolvePathOptions {
  /** Base for resolving paths from. Default is remix rootDir. */
  cwd?: string

  /** An object of aliases. Default is remix configured aliases. */
  alias?: Record<string, string>

  /** The file extensions to try. Default is remix configured extensions. */
  extensions?: string[]
}

/**
 * Resolve full path to a file or directory respecting remix alias and extensions options
 *
 * If path could not be resolved, normalized input path will be returned
 */
export async function resolvePath (path: string, opts: ResolvePathOptions = {}): Promise<string> {
  // Always normalize input
  const _path = path
  path = normalize(path)

  // Fast return if the path exists
  if (isAbsolute(path) && existsSync(path) && !(await isDirectory(path))) {
    return path
  }

  // Use current remix options
  const remix = tryUseRemix()
  const cwd = opts.cwd || (remix ? remix.options.rootDir : process.cwd())
  const extensions = opts.extensions || (remix ? remix.options.extensions : ['.ts', '.mjs', '.cjs', '.json'])
  const modulesDir = remix ? remix.options.modulesDir : []

  // Resolve aliases
  path = resolveAlias(path)

  // Resolve relative to cwd
  if (!isAbsolute(path)) {
    path = resolve(cwd, path)
  }

  // Check if resolvedPath is a file
  let _isDir = false
  if (existsSync(path)) {
    _isDir = await isDirectory(path)
    if (!_isDir) {
      return path
    }
  }

  // Check possible extensions
  for (const ext of extensions) {
    // path.[ext]
    const pathWithExt = path + ext
    if (existsSync(pathWithExt)) {
      return pathWithExt
    }
    // path/index.[ext]
    const pathWithIndex = join(path, 'index' + ext)
    if (_isDir && existsSync(pathWithIndex)) {
      return pathWithIndex
    }
  }

  // Try to resolve as module id
  const resolveModulePath = tryResolveModule(_path, [cwd, ...modulesDir])
  if (resolveModulePath) {
    return resolveModulePath
  }

  // Return normalized input
  return path
}

// Usage note: We assume path existance is already ensured
async function isDirectory (path: string) {
  return (await fsp.lstat(path)).isDirectory()
}

/**
 * Resolve path aliases respecting Remix alias options
 */
export function resolveAlias(
  path: string,
  alias?: Record<string, string>
): string {
  if (!alias) {
    alias = tryUseRemix()?.options.alias || {};
  }
  return _resolveAlias(path, alias);
}
