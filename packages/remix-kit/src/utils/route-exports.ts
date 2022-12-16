import type { ExportSpecifier, ImportSpecifier } from 'es-module-lexer';
import { init, parse as parseImports } from 'es-module-lexer';
import { logger } from '..';

type RouteExports = readonly [
  imports: ReadonlyArray<ImportSpecifier>,
  exports: ReadonlyArray<ExportSpecifier>
];

export async function getRouteExports(source: string): Promise<RouteExports> {
  const start = performance.now();
  await init;

  let imports!: readonly ImportSpecifier[];
  let exports!: readonly ExportSpecifier[];
  try {
    console.log('Getting exports: ');
    console.log(source);
    [imports, exports] = parseImports(source);
    console.log(exports);
    console.log(JSON.stringify(exports));
  } catch (e: any) {
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
    for (var i = exports.length - 1; i >= 0; i--) {
    const { s: start } = exports[i];
    console.log('removeRouteExports' + start);
    // Find the nearest export declaration and remove it
    // Maybe this will be simpler in the future: https://github.com/guybedford/es-module-lexer/issues/112

    // TODO: Use https://www.npmjs.com/package/mlly findExports instead?
    // export async function loader() {
    const exportIndex = source.lastIndexOf('export', start);
    if (exportIndex) {
      source = source.substring(0, exportIndex) + source.substring(exportIndex + 'export'.length);
      //console.log("TRANSFORMED")
      //console.log(source);
    }

    // export { action, headers, loader };
  }
  return source;
}
