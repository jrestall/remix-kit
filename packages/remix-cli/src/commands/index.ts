import type { Argv } from 'mri';

const _rDefault = (r: any) => r.default || r;

export const commands = {
  dev: () => import('./dev').then(_rDefault),
  build: () => import('./build').then(_rDefault),
  preview: () => import('./preview').then(_rDefault),
  typecheck: () => import('./typecheck').then(_rDefault),
  usage: () => import('./usage').then(_rDefault),
};

export type Command = keyof typeof commands;

export interface RemixCommandMeta {
  name: string;
  usage: string;
  description: string;
  [key: string]: any;
}

export type CLIInvokeResult = void | 'error' | 'wait';

export interface RemixCommand {
  invoke(args: Argv): Promise<CLIInvokeResult> | CLIInvokeResult;
  meta: RemixCommandMeta;
}

export function defineRemixCommand(command: RemixCommand): RemixCommand {
  return command;
}
