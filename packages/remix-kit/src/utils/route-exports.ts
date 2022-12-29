import type { ExportSpecifier, ImportSpecifier } from 'es-module-lexer';
import { init, parse as parseImports } from 'es-module-lexer';
import { logger } from '..';

type RouteExports = readonly [
  imports: ReadonlyArray<ImportSpecifier>,
  exports: ReadonlyArray<ExportSpecifier>
];

export async function getRouteExports(source: string): Promise<RouteExports> {
  await init;

  let imports!: readonly ImportSpecifier[];
  let exports!: readonly ExportSpecifier[];
  try {
    // parseImports is super quick and takes ~0.4ms
    [imports, exports] = parseImports(source);
  } catch (e) {
    logger.error(
      `Failed to parse source for development route tree-shaking analysis because the content ` +
        `contains invalid JS syntax. `,
      e.idx
    );
  }

  return [imports, exports];
}

// Simply removes the export keyword from the expression so that the code is tree shaken out.
export async function removeRouteExports(
  source: string,
  exports: ReadonlyArray<ExportSpecifier>
): Promise<string> {
  for (let i = exports.length - 1; i >= 0; i--) {
    const { s: start } = exports[i];

    // Find the nearest export declaration and remove it

    // export async function loader() {
    const exportIndex = source.lastIndexOf('export', start);
    if (exportIndex) {
      source = source.substring(0, exportIndex) + source.substring(exportIndex + 'export'.length);
    }

    // TODO: Use https://www.npmjs.com/package/mlly findExports instead?
    // TODO: export { action, headers, loader };
  }
  return source;
}
