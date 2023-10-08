const fs = require('fs-extra');

/**
 * 
 * @param {*} url '/src/main.js'
 * @param {*} server 
 * @returns 
 */
async function transformRequest(url, server) {
  const { pluginContainer } = server
  // 把文件路径转换成绝对路径 已经是绝对路径的不会转换 id: '/Users/ppd-0302000253/Desktop/project/use-vite5/src/main.js'
  const { id } = await pluginContainer.resolveId(url);

  const loadResult = await pluginContainer.load(id)

   let code;

  if (loadResult) {
    code = loadResult.code;;
  } else {
    // 按照绝对路径 读取文件内容
    code = await fs.readFile(id, 'utf-8')
  }
  
  // 将文件中的import语法的导入路径修改掉
  const transformResult = await pluginContainer.transform(code, id)
  return transformResult;
}
module.exports = transformRequest;