const { build } = require('esbuild');
const esbuildScanPlugin = require('./esbuildScanPlugin');
const path = require('path');

/**
 * 使用插件扫描导入的模块
 * @param {*} config 服务配置
 * @returns 
 */
async function scanImports(config) {

  // 存放收集的三方依赖
  const depImports = {};

  // esbuild的扫描插件 执行esbuildScanPlugin方法 返回插件 esbuild打包时会调用返回的插件方法
  const esPlugin = await esbuildScanPlugin(config, depImports);

  // 交给esbuild打包
  await build({
    absWorkingDir: config.root,
    entryPoints: [path.resolve('./index.html')],
    bundle: true,
    format: 'esm',
    outfile: 'dist/index.js',
    write: true,
    plugins: [esPlugin] // 将插件传递给esbuild
  })

  // 返回收集的三方依赖
  return depImports;
}
module.exports = scanImports;