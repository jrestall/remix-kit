import { cyan } from 'colorette';
import { showHelp } from '../utils/help';
import { commands, defineRemixCommand } from './index';

export default defineRemixCommand({
  meta: {
    name: 'help',
    usage: 'remix help',
    description: 'Show help',
  },
  invoke(_args) {
    const sections: string[] = [];

    sections.push(`Usage: ${cyan(`npx remix ${Object.keys(commands).join('|')} [args]`)}`);

    console.log(sections.join('\n\n') + '\n');

    // Reuse the same wording as in `-h` commands
    showHelp({});
  },
});
