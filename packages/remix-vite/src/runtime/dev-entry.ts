import type { ExecuteFunction } from './dev-runner';

export default async function executor(execute: ExecuteFunction<any>, mode: string) {
  let build;
  try {
    build = await import('@remix-run/dev/server-build');
  } catch (err) {
    execute({build, mode, err: err.toString()});
  }
  return execute({build, mode});
}
