# RemixKit Contributing Guide

Hi! We're really excited that you're interested in contributing to RemixKit! Before submitting your contribution, please read through the following guide.

## Repo Setup

The RemixKit repo is a monorepo using pnpm workspaces. The package manager used to install and link dependencies must be [pnpm](https://pnpm.io/).

# Local Development

To contribute to RemixKit, you need to set up a local environment.

1. Fork the remix-kit repository to your own GitHub account and then clone it to your local device.

2. Run `pnpm install` to install the dependencies.
- If you are adding a dependency, please use pnpm add. The pnpm-lock.yaml file is the source of truth for all RemixKit dependencies.

4. Run pnpm build:stub to activate the passive development system. This uses [jiti](https://github.com/unjs/jiti) to execute your Typescript without the need for a build step.

5. Check out a branch where you can work and commit your changes:
`git checkout -b my-new-branch`

6. Use the existing or setup your own website in the playground folder and execute CLI commands such as `remix-kit dev` or `remix-kit build` from there.

*TIP:* Visiting the `/playground/react-app`'s url at `http://localhost:3000/__inspect/` is useful when testing plugin changes as it will show you the vite plugin inspector's output.

## Debugging

To use breakpoints and explore code execution, you can use the ["Run and Debug"](https://code.visualstudio.com/docs/editor/debugging) feature from VS Code.

1. Add a `debugger` statement where you want to stop the code execution.

2. Click the "Run and Debug" icon in the activity bar of the editor, which opens the [_Run and Debug view_](https://code.visualstudio.com/docs/editor/debugging#_run-and-debug-view).

3. Click the "JavaScript Debug Terminal" button in the _Run and Debug view_, which opens a terminal in VS Code.

4. From that terminal, go to `playground/xxx`, and run `pnpm run dev`.

5. The execution will stop at the `debugger` statement, and you can use the [Debug toolbar](https://code.visualstudio.com/docs/editor/debugging#_debug-actions) to continue, step over, and restart the process...
