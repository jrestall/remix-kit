import type { Plugin } from 'vite';
import { transform } from 'esbuild';
import { visualizer } from 'rollup-plugin-visualizer';
import type { ViteBuildContext } from '../../vite';

export function analyzePlugin(ctx: ViteBuildContext): Plugin[] {
  return [
    {
      name: 'remix:analyze-minify',
      async generateBundle(_opts, outputBundle) {
        for (const [, bundle] of Object.entries(outputBundle)) {
          if (bundle.type !== 'chunk') {
            continue;
          }
          const originalEntries = Object.entries(bundle.modules);
          const minifiedEntries = await Promise.all(
            originalEntries.map(async ([moduleId, module]) => {
              const { code } = await transform(module.code || '', {
                minify: true,
              });
              return [moduleId, { ...module, code }];
            })
          );
          bundle.modules = Object.fromEntries(minifiedEntries);
        }
      },
    },
    // @ts-ignore
    visualizer({
      ...(ctx.remix.options.build.analyze as any),
      // @ts-ignore
      filename: ctx.remix.options.build.analyze.filename.replace(
        '{name}',
        'client'
      ),
      title: 'Client bundle stats',
      gzipSize: true,
    }),
  ];
}
