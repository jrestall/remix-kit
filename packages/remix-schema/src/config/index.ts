import app from './app';
import build from './build';
import common from './common';
import dev from './dev';
import experimental from './experimental';
import internal from './internal';
import postcss from './postcss';
import typescript from './typescript';
import vite from './vite';

export default {
  ...app,
  ...build,
  ...common,
  ...dev,
  ...experimental,
  ...internal,
  ...postcss,
  ...typescript,
  ...vite,
};
