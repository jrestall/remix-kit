import { defu } from 'defu';
import { applyDefaults } from 'untyped';
import type {
  Remix,
  RemixModule,
  ModuleOptions,
  ModuleDefinition,
  RemixOptions,
} from '@remix-kit/schema';
import { useRemix, tryUseRemix } from '../context';

/**
 * Define a Remix module, automatically merging defaults with user provided options, installing
 * any hooks that are provided, and calling an optional setup function for full control.
 */
export function defineRemixModule<OptionsT extends ModuleOptions>(
  definition: ModuleDefinition<OptionsT>
): RemixModule<OptionsT> {
  // Normalize definition and meta
  if (!definition.meta) {
    definition.meta = {};
  }
  if (definition.meta.configKey === undefined) {
    definition.meta.configKey = definition.meta.name;
  }

  // Resolves module options from inline options, [configKey] in remix.config, defaults and schema
  async function getOptions(inlineOptions?: OptionsT, remix: Remix = useRemix()) {
    const configKey = definition.meta!.configKey || definition.meta!.name!;
    const _defaults =
      definition.defaults instanceof Function ? definition.defaults(remix) : definition.defaults;
    let _options = defu(
      inlineOptions,
      remix.options[configKey as keyof RemixOptions],
      _defaults
    ) as OptionsT;
    if (definition.schema) {
      _options = (await applyDefaults(definition.schema, _options)) as OptionsT;
    }
    return Promise.resolve(_options);
  }

  // Module format is always a simple function
  async function normalizedModule(this: any, inlineOptions: OptionsT, remix: Remix) {
    if (!remix) {
      remix = tryUseRemix() || this.remix;
    }

    // Avoid duplicate installs
    const uniqueKey = definition.meta!.name || definition.meta!.configKey;
    if (uniqueKey) {
      remix.options._requiredModules = remix.options._requiredModules || {};
      if (remix.options._requiredModules[uniqueKey]) {
        // TODO: Notify user if inline options is provided since will be ignored!
        return;
      }
      remix.options._requiredModules[uniqueKey] = true;
    }

    // Resolve module and options
    const _options = await getOptions(inlineOptions, remix);

    // Register hooks
    if (definition.hooks) {
      remix.hooks.addHooks(definition.hooks);
    }

    // Call setup
    await definition.setup?.call(null as any, _options, remix);
  }

  // Define getters for options and meta
  normalizedModule.getMeta = () => Promise.resolve(definition.meta);
  normalizedModule.getOptions = getOptions;

  return normalizedModule as RemixModule<OptionsT>;
}
