export default async function executor(execute, mode) {
  let build;
  try {
    build = await import('@remix-run/dev/server-build');
  } catch (err) {
    execute({ build, mode, err: err.toString() });
  }
  return execute({ build, mode });
}
