const { isJSRequest } = require('../../utils');
const send = require('../send');
const transformRequest = require('../transformRequest');
const { parse } = require('url');


function transformMiddleware(server) {
    
  return async function (req, res, next) {
  
    // 不是GET请求直接放行
    if (req.method !== 'GET') {
      return next()
    }
    console.log('请求的路径', req.url);
    // 拿到请求的路径
    let url = req.url;
    // 请求的是JS资源
    if (isJSRequest(url)) {
      // 调用transformRequest 将import导入的路径修改掉
      const result = await transformRequest(url, server)
      // 将修改后的内容返回
      if (result) {
        const type = 'js'
        return send(req, res, result.code, type)
      }
    } else {
      return next();
    }
  }
}
module.exports = transformMiddleware