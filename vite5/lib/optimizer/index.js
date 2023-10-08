const scanImports = require("./scan");
const fs = require("fs-extra");
const path = require("path");
const { build } = require("esbuild");
const { normalizePath } = require("../utils");



async function createOptimizeDepsRun(config) {

  // 扫描文件 递归 处理所有依赖
  const deps = await scanImports(config);

  // 获取缓存目录
  const { cacheDir } = config;

  // '/Users/ppd-0302000253/Desktop/project/use-vite5/node_modules/.vite7/deps'
  const depsCacheDir = path.resolve(cacheDir, "deps");

  // _metadata.json文件的路径 '/Users/ppd-0302000253/Desktop/project/use-vite5/node_modules/.vite7/deps/_metadata.json'
  const metadataPath = path.join(depsCacheDir, "_metadata.json");

  // 要写入到_metadata.json中的文件内容
  const metadata = {
    optimized: {},
  };
  
  // 遍历所有三方依赖
  for (const id in deps) {
    const entry = deps[id];
    metadata.optimized[id] = {
      file: normalizePath(path.resolve(depsCacheDir, id + ".js")), // 三方缓存的位置
      src: entry, // 三方依赖原位置
    };
    // 把三方依赖文件写入到缓存目录
    await build({
      absWorkingDir: process.cwd(),
      entryPoints: [deps[id]],
      outfile: path.resolve(depsCacheDir, id + ".js"),
      bundle: true,
      write: true,
      format: "esm",
    });
  }
  
  // 它用于检查一个目录是否存在，如果不存在，则创建该目录
  await fs.ensureDir(depsCacheDir);

  // 把_metadata.json文件写入
  await fs.writeFile(
    metadataPath,
    JSON.stringify(
      metadata,
      (key, value) => {
        if (key === "file" || key === "src") {
          return normalizePath(path.relative(depsCacheDir, value));
        }
        return value;
      },
      2
    )
  );
  return { metadata };
}
exports.createOptimizeDepsRun = createOptimizeDepsRun;
