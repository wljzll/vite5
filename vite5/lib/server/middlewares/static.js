const static = require("serve-static");

/**
 * @description 创建静态服务中间件
 * @param {*} {root} 从config中解构出root
 * @returns
 */
function serveStaticMiddleware({ root }) {
  // 启动静态服务中间件 '/Users/ppd-0302000253/Desktop/project/use-vite5'
  return static(root);
}
module.exports = serveStaticMiddleware;
