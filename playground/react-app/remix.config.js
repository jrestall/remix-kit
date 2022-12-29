/** @type {import('@remix-kit/schema').AppConfig} */
module.exports = {
  ignoredRouteFiles: ['**/.*'],
  server: 'server.ts',
  // appDirectory: "app",
  // assetsBuildDirectory: "public/build",
  serverBuildPath: 'build/index.js',
  // publicPath: "/build/",
  routes: (defineRoutes) => {
    return defineRoutes((route) => {
      // file is relative to the /app folder
      route('/blog', '../../feature-blog/app/routes/blog.tsx');
    });
  },
  // inline postcss configuration example
  // postcss: {
  //   plugins: {
  //     tailwindcss: {},
  //     autoprefixer: {}
  //   },
  // },
};
