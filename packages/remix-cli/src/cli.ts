import mri from 'mri';
import { red } from 'colorette';
import type { ConsolaReporter } from 'consola';
import consola from 'consola';
import { checkEngines } from './utils/engines';
import type { Command, RemixCommand } from './commands';
import { commands } from './commands';
import { showHelp } from './utils/help';
import { showBanner } from './utils/banner';

async function _main() {
  const _argv = process.argv.slice(2);
  const args = mri(_argv, {
    boolean: ['no-clear'],
  });
  const command = args._.shift() || 'usage';

  showBanner(command === 'dev' && args.clear !== false && !args.help);

  if (!(command in commands)) {
    console.log('\n' + red('Invalid command ' + command));

    await commands.usage().then((r) => r.invoke());
    process.exit(1);
  }

  // Check Node.js version in background
  setTimeout(() => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    checkEngines().catch(() => {});
  }, 1000);

  const cmd = (await commands[command as Command]()) as RemixCommand;
  if (args.h || args.help) {
    showHelp(cmd.meta);
  } else {
    const result = await cmd.invoke(args);
    return result;
  }
}

// Wrap all console logs with consola for better DX
consola.wrapAll();

// Filter out unwanted logs
// TODO: Use better API from consola for intercepting logs
const wrapReporter = (reporter: ConsolaReporter) =>
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  <ConsolaReporter>{
    log(logObj, ctx) {
      if (!logObj.args || !logObj.args.length) {
        return;
      }
      const msg = logObj.args[0];
      if (typeof msg === 'string' && !process.env.DEBUG) {
        // Hide sourcemap warnings related to node_modules
        if (msg.startsWith('Sourcemap') && msg.includes('node_modules')) {
          return;
        }
      }
      return reporter.log(logObj, ctx);
    },
  };
// @ts-expect-error
consola._reporters = consola._reporters.map(wrapReporter);

process.on('unhandledRejection', (err) => consola.error('[unhandledRejection]', err));
process.on('uncaughtException', (err) => consola.error('[uncaughtException]', err));

export function main() {
  _main()
    .then((result) => {
      if (result === 'error') {
        process.exit(1);
      } else if (result !== 'wait') {
        process.exit(0);
      }
    })
    .catch((error) => {
      consola.error(error);
      process.exit(1);
    });
}
