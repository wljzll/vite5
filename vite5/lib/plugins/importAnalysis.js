// ES Module 语法的词法分析 工具
const { init, parse } = require("es-module-lexer");
const MagicString = require("magic-string");

/**
 * @description 重写源码中的import语句 修改成自己的路径
 * @param {*} config 
 * @returns 
 */
function importAnalysisPlugin(config) {
  const { root } = config;
  return {
    name: "vite:import-analysis",
    
    async transform(source, importer) {
      // es-module-lexer 使用规范 init必须在parse之前
      await init;
      // parse方法能够返回模块中import语法的信息 每个import会组成一个数组
      let imports = parse(source)[0];
      // 没有import语法的话就直接返回了
      if (!imports.length) {
        return source;
      }

      // 将源码转换成字符串
      let ms = new MagicString(source);

      const normalizeUrl = async (url) => {
        // 交给resolve插件处理路径 相对路径处理成绝对路径
        const resolved = await this.resolve(url, importer);
        // 如果路径里包含根路径 把根路径删除
        if (resolved.id.startsWith(root + "/")) {
          url = resolved.id.slice(root.length);
        }
        // 最后得到的路径: vue => '/node_modules/.vite7/deps/vue.js'  title.js => '/src/title.js'
        return url;
      };
      
      // 遍历所有的imports导入
      for (let index = 0; index < imports.length; index++) {
        // s: import语法的开始位置 e: import语法的结束位置 n: import导入的模块名称
        const { s: start, e: end, n: specifier } = imports[index];
        // 如果模块名称存在
        if (specifier) {
          // 解析模块路径
          const normalizedUrl = await normalizeUrl(specifier);
          if (normalizedUrl !== specifier) {
            ms.overwrite(start, end, normalizedUrl);
          }
        }
      }
      return ms.toString();
    },
  };
}
module.exports = importAnalysisPlugin;
