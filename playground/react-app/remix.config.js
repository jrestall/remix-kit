/** @type {import('@remix-kit/schema').RemixOptions} */
module.exports = {
  ignoredRouteFiles: ['**/.*'],
  server: 'server.prod.ts',
  // appDirectory: "app",
  // assetsBuildDirectory: "public/build",
  serverBuildPath: "build/index.mjs",
  // publicPath: "/build/",

  // inline postcss configuration example
  // postcss: {
  //   plugins: {
  //     tailwindcss: {}, 
  //     autoprefixer: {}
  //   },
  // },
};
