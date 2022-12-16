import { defineUntypedSchema } from 'untyped';

export default defineUntypedSchema({
  /** @private */
  _start: false,
  /** @private */
  _build: false,
  /** @private */
  _cli: false,
  /** @private */
  _requiredModules: {},
  /** @private */
  _remixConfigFile: undefined,
  /** @private */
  _remixConfigFiles: [],
  /** @private */
  appDir: '',
  /** @private */
  _installedModules: [],
  /** @private */
  _modules: [],
});
