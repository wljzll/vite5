// 导入createServe方法
let { createServer } = require("./server");

(async () => {
  // 创建一个服务
  const server = await createServer();
  // 启动9999端口监听服务
  server.listen('9999');
})();
