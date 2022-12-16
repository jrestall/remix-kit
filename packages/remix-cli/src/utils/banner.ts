import clear from 'clear';
import { bold, gray, green } from 'colorette';
import { version } from '../../package.json';
import { tryRequireModule } from '@remix-kit/kit';

export function showBanner(_clear?: boolean) {
  if (_clear) {
    clear();
  }
  console.log(gray(`RemixKit ${bold(version)}`));
}

export function showVersions(cwd: string) {
  const getPkgVersion = (pkg: string) => {
    return tryRequireModule(`${pkg}/package.json`, cwd)?.version || '';
  };
  const remixVersion = getPkgVersion('@remix-run/server-runtime') || getPkgVersion('remix');
  console.log(
    gray(
      green(`Remix ${bold(remixVersion)}`)
    )
  );
}
