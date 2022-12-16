import { useRemix } from "../context";

export interface AddModuleTranspilesOptions {
  additionalModules?: string[];
}

export const addModuleTranspiles = (opts: AddModuleTranspilesOptions = {}) => {
  const remix = useRemix();

  const modules = [
    ...(opts.additionalModules || []),
    ...remix.options.modules,
    ...remix.options._modules,
  ]
    .map((m) => (typeof m === 'string' ? m : Array.isArray(m) ? m[0] : m.src))
    .filter((m) => typeof m === 'string')
    .map((m) => m.split('node_modules/').pop());

  // Try to sanitize modules to better match imports
  remix.options.build.transpile = remix.options.build.transpile
    .map((m) => (typeof m === 'string' ? m.split('node_modules/').pop() : m))
    .filter(<T>(x: T | undefined): x is T => !!x);

  function isTranspilePresent(mod: string) {
    return remix.options.build.transpile.some(
      (t) =>
        !(t instanceof Function) &&
        (t instanceof RegExp ? t.test(mod) : new RegExp(t).test(mod))
    );
  }

  // Automatically add used modules to the transpile
  for (const module of modules) {
    if (!isTranspilePresent(module)) {
      remix.options.build.transpile.push(module);
    }
  }
};
