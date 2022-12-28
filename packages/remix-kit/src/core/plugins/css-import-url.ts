import type { Remix } from '@remix-kit/schema';
import { createUnplugin } from 'unplugin';
import MagicString from 'magic-string';
import type { ImportSpecifier } from 'es-module-lexer';
import { init, parse as parseImports } from 'es-module-lexer';
import { logger } from '../..';

// Changes Vite's default CSS import behaviour to explicitly load CSS as URL rather than content.

export const CssImportUrl = createUnplugin(function (remix: Remix) {
  return {
    name: 'remix:css-import-url',
    async transform(code, _id) {
      if (remix.options.build.importCssAsUrl !== true) return;

      // Get module's imports
      const imports = await getImports(code);
      if (!imports?.length) return;

      // Get any CSS file imports
      const cssImports = imports.filter((i) => i.n?.endsWith('.css'));
      if (!cssImports?.length) return;

      // Add ?url suffix to CSS import to explicitly load the CSS as URL
      const magicString = new MagicString(code);
      for (const cssImport of cssImports) {
        magicString.appendRight(cssImport.e, '?url');
      }

      return { code: magicString.toString(), map: magicString.generateMap() };
    },
  };
});

export async function getImports(source: string): Promise<readonly ImportSpecifier[]> {
  await init;
  let imports!: readonly ImportSpecifier[];
  try {
    [imports] = parseImports(source);
  } catch (e: any) {
    logger.error(
      `Failed to parse source for default css url imports because the content contains invalid JS syntax.`,
      e.idx
    );
  }

  return imports;
}
