const fs = require("fs-extra");
const path = require("path");
const { createPluginContainer } = require("../server/pluginContainer");
const resolvePlugin = require("../plugins/resolve");
const { normalizePath } = require("../utils");
// 匹配.html文件的正则
const htmlTypesRE = /\.html$/;
// 从html字符串中匹配出 <script src="/src/main.js" type="module"></script> 标签
const scriptModuleRE = /<script src\="(.+?)" type="module"><\/script>/;
// .js文件的正则
const JS_TYPES_RE = /\.js$/;

/**
 * @description 生成esbuild 扫描插件
 * @param {*} config vite配置
 * @param {*} depImports 项目中引入的三方依赖组成的对象
 * @returns 插件
 */
async function esbuildScanPlugin(config, depImports) {
  // 把所有插件都放到plugins里
  config.plugins = [resolvePlugin(config)];

  // 生成插件容器 插件容器就是插件的执行调度器
  const container = await createPluginContainer(config);

  // 声明resolve 方法 调用插件容器的resolveId方法
  const resolve = async (id, importer) => {
    // 调用PluginContainer的resolveId方法
    return await container.resolveId(id, importer);
  };

  // 返回插件 esbuild打包的时候 每个模块都会触发对应的钩子
  return {
    // 插件名
    name: "vite:dep-scan",
    setup(build) {
      // 解析vue文件的钩子
      build.onResolve(
        {
          filter: /\.vue$/,
        },
        async ({ path: id, importer }) => {
          const resolved = await resolve(id, importer);
          if (resolved) {
            return {
              path: resolved.id,
              external: true,
            };
          }
        }
      );
      // https://esbuild.bootcss.com/plugins/#on-resolve
      // 解析路径时会调用的方法: 解析.html时会匹配到这里 会调用传入的回调函数处理.html文件
      build.onResolve({ filter: htmlTypesRE }, async ({ path, importer }) => {
        // 解析.html的路径 相对路径做成绝对路径
        const resolved = await resolve(path, importer);
        // 然后返回
        if (resolved) {
          return {
            path: resolved.id || resolved,
            namespace: "html",
          };
        }
      });

      // 解析路径 上一个Resolve之外的文件都会走这里
      build.onResolve({ filter: /.*/ }, async ({ path, importer }) => {

        const resolved = await resolve(path, importer);

        if (resolved) {
          // 绝对路径
          const id = resolved.id || resolved;
          // 路径是否包含node_modules
          const included = id.includes("node_modules");
          // 包括就是三方依赖
          if (included) {
            // 处理路径中的 \ 并收集起来
            depImports[path] = normalizePath(id);
            // 如果是三方模块 加个extrenal属性 esbuild就不会打包了
            return {
              path: id,
              external: true,
            };
          }
          // 普通模块
          return {
            path: id,
          };
        }
        return { path };
      });

      // 加载文件html
      build.onLoad(
        { filter: htmlTypesRE, namespace: "html" },
        async ({ path }) => {
          let html = fs.readFileSync(path, "utf-8");
          // 捕获html中的script /src/main.js
          let [, scriptSrc] = html.match(scriptModuleRE);

          // 把js处理成import 因为html无法打包 把html的内容转换成导入 JS模块 下面就变成了导入 import /src/main.js 就是对js的处理了
          let js = `import ${JSON.stringify(scriptSrc)};\n`;
          // 返回
          return {
            loader: "js",
            contents: js,
          };
        }
      );

      // 加载js文件
      build.onLoad({ filter: JS_TYPES_RE }, ({ path: id }) => {
        // 拿到扩展名
        let ext = path.extname(id).slice(1);
        // 读文件
        let contents = fs.readFileSync(id, "utf-8");
        return {
          loader: ext,
          contents,
        };
      });
    },
  };
}
module.exports = esbuildScanPlugin;
