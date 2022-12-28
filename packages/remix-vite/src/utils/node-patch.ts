// When using fetch Node.js prints the following warning
//
// - ExperimentalWarning: The Fetch API is an experimental feature. This feature could change at any time
//
// Since that doesn't provide any value to our users we suppress the warning.

export function removeExperimentalFetchWarnings() {
    const originalEmit = process.emit;
    // @ts-expect-error - TS complains about the return type of originalEmit.apply
    process.emit = function (name, data: any, ...args) {
      if (
        name === `warning` &&
        typeof data === `object` &&
        data.name === `ExperimentalWarning` &&
        data.message.includes(`The Fetch API is an experimental feature.`)
      )
        return false;
  
      return originalEmit.apply(process, arguments as unknown as Parameters<typeof process.emit>);
    };
  }