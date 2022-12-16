import { Remix } from '@remix-kit/schema';
import { createUnplugin } from 'unplugin';
import { getRouteExports, removeRouteExports } from '../../utils/route-exports';
import { transform, formatMessages } from 'esbuild';
import { logger } from '../..';
import type { ImportSpecifier } from 'es-module-lexer';
import { findStaticImports, parseStaticImport, ParsedStaticImport } from 'mlly';

type ParsedImportSpecifier = {
  spec: ImportSpecifier;
  parsed: ParsedStaticImport;
};
// Tree shakes server code out of the routes for the development browser bundle by
// using es-module-lexer to rewrite server exports and esbuild to then tree shake.

// es-module-lexer is crazy fast for this purpose, 0ms impact.

const SERVER_EXPORTS = ['action', 'loader'];

export const DevelopmentRouteLoader = createUnplugin(function (remix: Remix) {
  return {
    name: 'remix:development-route-loader',
    async transform(code, id) {
      // Determine if this is a route module
      let routes = Object.values(remix.options.routes);
      const route = routes.find((r) => id.endsWith(r.file));
      if (!route) return;

      console.debug(`Optimizing route module for development: ${id}`);

      // Use es-module-lexer to get all route module imports and exports
      const [imports, exports] = await getRouteExports(code);
      if (!exports || !exports.length) return;

      // Get any server exports from the route module
      const serverExports = exports.filter((_export) => SERVER_EXPORTS.includes(_export.n));
      if (!serverExports || !serverExports.length) return;

      // Rewrite the module exports to not export action and loader functions.
      // This will cause these functions to be tree shaken by esbuild.
      let source = `${code}`;
      source = await removeRouteExports(source, serverExports);

      // Replace all imports with a pure (no side-effects) function expression so that esbuild will remove the
      // call when it isn't used by any of the code when tree shaken. Remix route imports shouldn't
      // have side effects so this server code tree shaking approach should be fine.

      // Parse all import statements
      const parsedImports: ParsedImportSpecifier[] = [];
      for (const importSpec of imports) {
        const parsed = parseImport(source, importSpec);
        // We only support static type imports.
        if (parsed && parsed.type === 'static') parsedImports.push({ parsed, spec: importSpec });
      }

      // Remove all static imports from the code
      // Loop backwards through the imports so that their statement indexes remain accurate as we modify the source.
      for (var i = parsedImports.length - 1; i >= 0; i--) {
        const parsedImport = parsedImports[i];
        source = removeImport(source, parsedImport.spec);
      }

      const expressions: string[] = [];
      // Build replacement function expressions from the static imports
      for (const parsedImport of parsedImports) {
        const expression = buildExpression(parsedImport.parsed);
        expressions.push(expression);
      }

      // We now have an array of expressions that will be tree shaken.
      // ['const Link = /* @__PURE__ */ _used("import { json } from "@remix-run/node";");']
      const noop = 'const _used = () => {}; \n';
      source += noop + expressions.join('\n');

      // Use esbuild to tree shake the modified source
      const result = await transform(source, {
        loader: 'js',
        treeShaking: true,
        sourcemap: 'external',
      });

      if (result.warnings.length) {
        logger.warn(`Warnings given when converting route ${id} for development.`);
        const formatted = await formatMessages(result.warnings, {
          kind: 'warning',
          color: true,
          terminalWidth: 100,
        });
        logger.warn(formatted);
      }

      // Get the tree shaken expressions back out from the source, starting with the noop function.
      const expressionsStart = result.code.indexOf('const _used');
      const expressionsSource = result.code.substring(expressionsStart + noop.length);

      // Remove the temporary expressions from the code
      result.code = result.code.substring(0, expressionsStart);

      // Execute any remaining expressions to determine the used imports in this route module
      const usedImports: string[] = [];
      if (expressionsSource.length > 0) {
        // @ts-ignore - used in eval below
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _used = (_import) => {
          usedImports.push(_import);
        };
        // eslint-disable-next-line no-eval
        eval(expressionsSource);
      }

      // Add only the used imports back to the route module source
      let transformed = usedImports.join('\n') + result.code;

      // esbuild transform strips out the /* @vite-ignore */ annotation.
      // Here we add it back so that vite-analysis-plugin doesn't warn about dynamic imports.
      // https://github.com/evanw/esbuild/issues/221
      const searchString = 'import.meta.url).then((current) => {';
      transformed = transformed.replace(searchString, `/* @vite-ignore */ ${searchString}`);

      return { code: transformed, map: result.map };
    },
  };
});

function removeImport(source: string, importSpec: ImportSpecifier): string {
  return source.substring(0, importSpec.ss) + source.substring(importSpec.se + 1);
}

function buildExpression(parsed: ParsedStaticImport): string {
  let expressions = '';
  if (parsed.namespacedImport) {
    const expression = `const ${parsed.namespacedImport} = /* @__PURE__ */ _used("import ${parsed.imports} from '${parsed.specifier}';");`;
    expressions += expression + '\n';
  }
  if (parsed.defaultImport) {
    const expression = `const ${parsed.namespacedImport} = /* @__PURE__ */ _used("import ${parsed.defaultImport} from '${parsed.specifier}';");`;
    expressions += expression + '\n';
  }
  if (parsed.namedImports) {
    for (const binding of Object.keys(parsed.namedImports)) {
      //import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime"'
      const named = parsed.namedImports[binding];
      // const Link = /* @__PURE__ */ _used("import { json } from "@remix-run/node";");
      const expression = `const ${named} = /* @__PURE__ */ _used("import { ${binding} as ${named} } from '${parsed.specifier}';");`;
      expressions += expression + '\n';
    }
  }
  return expressions;
}

function parseImport(source: string, importSpec: ImportSpecifier): ParsedStaticImport | null {
  const isDynamic = importSpec.d > -1;
  const isMeta = importSpec.d === -2;
  if (isDynamic || isMeta) {
    // this basically means the module will be impacted by any change in its dep
    return null;
  }

  const exp = source.slice(importSpec.ss, importSpec.se);
  const [match0] = findStaticImports(exp);
  if (!match0) {
    return null;
  }
  return parseStaticImport(match0);
}
