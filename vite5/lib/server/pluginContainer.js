const { normalizePath } = require("../utils");
const path = require("path");

/**
 * @description 插件容器是一个用来执行插件的容器
 * @param {*} plugins: 配置文件中配置的plugins root: 项目的根目录
 * @returns
 */
async function createPluginContainer({ plugins, root }) {

  // 定义插件上下文 定义一个原型方法 resolve
  class PluginContext {
    /**
     *
     * @param {*} id 模块路径
     * @param {*} importer 模块中引入的模块 默认是index.html
     * @returns
     */
    async resolve(id, importer = path.join(root, "index.html")) {
      // 调用container的resolveIdf方法
      return await container.resolveId(id, importer);
    }
  }

  // 声明container对象 添加resolveId属性 属性值时名为resolveId的函数
  const container = {
    // resolveId是一个方法，是一个根据标记符计算路径的方法
    // vue => vue在硬盘上对应路径 
    // 调度执行resolve插件
    async resolveId(id, importer) {

      // 创建上下文
      let ctx = new PluginContext();

      // 拿到路径 '/src/main.js'
      let resolveId = id;

      // 遍历所有的插件 执行有resolveId方法的插件 去解析模块路径
      for (const plugin of plugins) {
        // 插件没有resolveId方法 跳出本次循环
        if (!plugin.resolveId) continue;
        // 交给插件处理
        const result = await plugin.resolveId.call(ctx, id, importer);
        // 如果有结果
        if (result) {
          // 返回
          resolveId = result.id || result;
          break;
        }
      }
      return { id: normalizePath(resolveId) };
    },
    // 调度执行load插件
    async load(id) {
      const ctx = new PluginContext();

      for (const plugin of plugins) {
        if (!plugin.load) continue;
        const result = await plugin.load.call(ctx, id);
        if (result !== null) {
          return result;
        }
      }
      return null;
    },
    // 调度执行 transform 插件
    async transform(code, id) {
      for (const plugin of plugins) {
        if (!plugin.transform) continue;
        const ctx = new PluginContext();
        const result = await plugin.transform.call(ctx, code, id);
        if (!result) continue;
        code = result.code || result;
      }
      return { code };
    },
  };

  return container;
}

exports.createPluginContainer = createPluginContainer;
