const path = require("path");
const fs = require("fs-extra");
const { normalizePath } = require("./utils");
const { resolvePlugins } = require("./plugins/index");

/**
 * @description 创建基础配置
 * @returns
 */
async function resolveConfig() {
  // 获取项目根目录
  const root = normalizePath(process.cwd());
  // 获取缓存的目录
  const cacheDir = normalizePath(path.resolve(`node_modules/.vite7`));

  let config = {
    root,
    cacheDir,
  };

  const jsconfigFile = path.resolve(root, "vite.config.js");

  const exists = await fs.pathExists(jsconfigFile);

  if (exists) {
    const userConfig = require(jsconfigFile);

    config = { ...config, ...userConfig };
  }

  const userPlugins = config.plugins || [];

  for (const plugin of userPlugins) {
    if (plugin.config) {
      const res = await plugin.config(config);
      if (res) {
        config = { ...config, ...res };
      }
    }
  }
  // 收集所有插件
  const plugins = await resolvePlugins(config, userPlugins);
  config.plugins = plugins;
  return config;
}
module.exports = resolveConfig;
