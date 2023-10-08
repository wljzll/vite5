const fs = require("fs");
const path = require("path");
const resolve = require("resolve");
const url = require('url')
function resolvePlugin(config) {

  return {
    name: "vite:resolve",
    /**
     *
     * @param {*} id 解析的模块的路径 '/src/main.js'
     * @param {*} importer 谁导入的这个正在解析的模块  '/Users/ppd-0302000253/Desktop/project/use-vite5/index.html'
     * @returns
     */
    resolveId(id, importer) {
      // 如果 / 开头表示是
      // 在window里表示的是相对路径
      // 在mac里可能是相对路径也可能是绝对路径 在mac里 path.isAbsolute无法正确判断相对还是绝对
      // '/Users/ppd-0302000253/Desktop/project/use-vite5/lesson2/src/App.vue?vue&type=style&index=0&lang=css'
      if (id.startsWith("/")) {
        try {
          // 看文件是否存在 
          // 先判读路径里是否有查询字符串 这里的判断其实很low 凑合着看吧
          const exist = fs.existsSync(url.parse(id).pathname);
          // 如果存在就是mac的绝对路径
          if (exist) {
            return { id: id };
          } else {
            // 不存在就用root去拼接
            return { id: path.resolve(config.root, id.slice(1)) };
          }
          
        } catch (error) {
          console.log(error);
        }
      }

      //如果是绝对路径
      if (path.isAbsolute(id)) {
        return { id };
      }

      //如果是相对路径
      if (id.startsWith(".")) {
        // 在哪个文件里导入的 这里就是获取哪个文件的目录 '/Users/ppd-0302000253/Desktop/project/use-vite5/src/main.js'
        const basedir = path.dirname(importer);
        // 获取被导入模块的绝对路径 '/Users/ppd-0302000253/Desktop/project/use-vite5/src/title.js'
        const fsPath = path.resolve(basedir, id);
        return { id: fsPath };
      }

      //如果是第三方包
      let res = tryNodeResolve(id, importer, config);
      if (res) {
        return res;
      }
    },
  };
}

function tryNodeResolve(id, importer, config) {
  // 获取三方包的package.json路径
  const pkgPath = resolve.sync(`${id}/package.json`, { basedir: config.root });
  // 获取三方包的目录名
  const pkgDir = path.dirname(pkgPath);
  // 读取package.json内容
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  // 获取package.json中的module字段
  const entryPoint = pkg.module;
  // 获取到入口文件
  const entryPointPath = path.join(pkgDir, entryPoint);
  // 返回入口
  return { id: entryPointPath };
}

module.exports = resolvePlugin;
