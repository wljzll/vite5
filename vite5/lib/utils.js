/**
 * @description 将路径中的 \ 全部替换成 linux 中的 /
 * @param {*} id 路径: \Users\ppd-0302000253\Desktop\project\vite5\lib\utils.js
 * @returns
 */
function normalizePath(id) {
  return id.replace(/\\/g, "/");
}
exports.normalizePath = normalizePath;

const knownJsSrcRE = /\.(js|vue)/;

const isJSRequest = (url) => {
  if (knownJsSrcRE.test(url)) {
    return true;
  }
  return false;
};
exports.isJSRequest = isJSRequest;
