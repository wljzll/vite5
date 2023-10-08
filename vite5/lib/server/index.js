const connect = require("connect");
// 导入静态服务中间件
const serveStaticMiddleware = require("./middlewares/static");
// 解析配置
const resolveConfig = require("../config");
const { createOptimizeDepsRun } = require("../optimizer");
const transformMiddleware = require('./middlewares/transform');

const { createPluginContainer } = require("./pluginContainer");

/**
 *
 * @returns server对象
 */
async function createServer() {

  // 生成服务配置
  const config = await resolveConfig();

  // 创建一个中间件的连接器
  const middlewares = connect();
  
  // 创建插件容器
  const pluginContainer = await createPluginContainer(config);

  // 声明一个对象 listen方法创建服务监听端口号
  const server = {
    // 将插件容器放到serve对象上方便获取
    pluginContainer,
    // listen方法
    async listen(port) {

      // 启动服务之前 打包模块 并对三方依赖进行缓存优化
      await runOptimize(config, server);

      // 加载http模块
      require("http")
        // 把中间件传入
        .createServer(middlewares)
        // 监听传入的端口号
        .listen(port, async () => {
          console.log(`dev server running at: http://localhost:${port}`);
        });
    },
  };

  // 遍历所有的插件 如果插件有configureServer方法则执行
  for (const plugin of config.plugins) {
    if (plugin.configureServer) {
      await plugin.configureServer(server);
    }
  }
  // 使用请求转换中间件
  middlewares.use(transformMiddleware(server));
  
  // 使用中间件
  middlewares.use(serveStaticMiddleware(config));

  return server;
}

async function runOptimize(config, server) {
  // 预编译依赖 包括自己的模块和三方模块
  const optimizeDeps = await createOptimizeDepsRun(config);
  server._optimizeDepsMetadata = optimizeDeps.metadata;
}

// 导出
exports.createServer = createServer;
