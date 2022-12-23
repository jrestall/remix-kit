/** @type {import('@remix-kit/schema').AppConfig} */
module.exports = {
  ignoredRouteFiles: ['**/.*'],
  server: 'server.prod.ts',
  // appDirectory: "app",
  // assetsBuildDirectory: "public/build",
  serverBuildPath: 'build/index.mjs',
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
