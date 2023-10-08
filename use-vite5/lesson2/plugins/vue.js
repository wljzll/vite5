const {
  parse,
  compileScript,
  rewriteDefault,
  compileTemplate,
  compileStyleAsync,
} = require("vue/compiler-sfc");
const fs = require("fs");
const path = require('path')

const hash = require("hash-sum");
/** App.vue的编译结果
 * 
   import { openBlock as _openBlock, createElementBlock as _createElementBlock } from "/node_modules/.vite7/deps/vue.js"

    export function render(_ctx, _cache) {
      return (_openBlock(), _createElementBlock("h1", null, "App"))
    }

    const _sfc_main = {
        name: 'App'
    }
  
    _sfc_main['render'] = render
    export default _sfc_main
 */
// 缓存编译结果
const descriptorCache = new Map();

function vue() {
  return {
    name: "vue",
    config(config) {
      root = config.root;
      console.log(root, "root");
    },
    async load(id) {
      console.log('每种文件都会到load里');
      const { filename, query } = parseVueRequest(id);
      if (query.has("vue")) {
        const descriptor = await getDescriptor(filename, root);
        if (query.get("type") === "style") {
          let block = descriptor.styles[Number(query.get("index"))];
          if (block) {
            return { code: block.content };
          }
        }
      }
    },
    /**
     *
     * @param {*} code .vue 文件的内容
     * @param {*} id 文件完整路径 '/Users/ppd-0302000253/Desktop/project/use-vite5/lesson2/src/App.vue'
     * @returns
     */
    async transform(code, id) {
      const { filename, query } = parseVueRequest(id);
      if (filename.endsWith(".vue")) {
        if (query.get("type") === "style") {
          const descriptor = await getDescriptor(filename, root);
          let result = await transformStyle(
            code,
            descriptor,
            query.get("index")
          );
          return result;
        } else {
          let result = await transformMain(code, filename);
          return result;
        }
      }
      return null;
    },
  };
}

async function transformStyle(code, descriptor, index) {
  const block = descriptor.styles[index];
  //如果是CSS，其实翻译之后和翻译之前内容是一样的
  const result = await compileStyleAsync({
    filename: descriptor.filename,
    source: code,
    id: `data-v-${descriptor.id}`, //必须传递，不然报错
    scoped: block.scoped,
  });
  let styleCode = result.code;
  const injectCode =
    `\nvar  style = document.createElement('style');` +
    `\nstyle.innerHTML = ${JSON.stringify(styleCode)};` +
    `\ndocument.head.appendChild(style);`;

  return {
    code: injectCode,
  };
}
/**
 * 解析但文件组件 返回但文件组件的描述符
 * @param {*} filename
 * @returns
 */
async function getDescriptor(filename) {
  let descriptor = descriptorCache.get(filename);
  if (descriptor) return descriptor;
  // 读取vue文件内容
  const content = await fs.promises.readFile(filename, "utf8");
  // 解析文件
  const result = parse(content, { filename });
  // result.descriptor vue文件的解析结果 包括template、script、styles、customBlocks等部分
  descriptor = result.descriptor;
  descriptor.id = hash(path.relative(root, filename));
  // 存入缓存
  descriptorCache.set(filename, descriptor);
  // 返回描述
  return descriptor;
}

/**
 *
 * @param {*} source .vue文件内容
 * @param {*} filename '/Users/ppd-0302000253/Desktop/project/use-vite5/lesson2/src/App.vue'
 * @returns
 */
async function transformMain(source, filename) {
  // descriptor指的是SFCDescriptor，这是用于描述.vue文件各个代码块的对象，包括template、script、styles、customBlocks等部分。
  const descriptor = await getDescriptor(filename);
  // const _sfc_main = {  name: 'App' }
  const scriptCode = genScriptCode(descriptor, filename);
  // 将template内容编译成createElement函数
  const templateCode = genTemplateCode(descriptor, filename);

  const stylesCode = genStyleCode(descriptor, filename);

  let resolvedCode = [
    stylesCode,
    templateCode,
    scriptCode,
    `_sfc_main['render'] = render`,
    `export default _sfc_main`,
  ].join("\n");
  return { code: resolvedCode };
}

function genStyleCode(descriptor, filename) {
  let styleCode = "";
  if (descriptor.styles.length) {
    descriptor.styles.forEach((style, index) => {
      const query = `?vue&type=style&index=${index}&lang=css`;
      const styleRequest = (filename + query).replace(/\\/g, "/");
      styleCode += `\nimport ${JSON.stringify(styleRequest)}`;
    });
    return styleCode;
  }
}

/**
 * @description 编译获取script标签内的内容
 * @param {*} descriptor
 * @param {*} id
 * @returns
 */
function genScriptCode(descriptor, id) {
  let scriptCode = "";
  let script = compileScript(descriptor, { id });
  if (!script.lang) {
    // const _sfc_main = {  name: 'App' }
    scriptCode = rewriteDefault(script.content, "_sfc_main");
  }
  return scriptCode;
}

/**
 * @description 编译获取模板内容
 * @param {*} descriptor
 * @param {*} id
 * @returns
 */
function genTemplateCode(descriptor, id) {
  let content = descriptor.template.content;
  // 将模板内容编译出create函数
  const result = compileTemplate({ source: content, id });
  return result.code;
}

/**
 *
 * @param {*} id .vue文件的内容
 * @returns
 */
function parseVueRequest(id) {
  // 分割出可能的查询字符串
  const [filename, querystring = ""] = id.split("?");
  // 创建查询字符串实例
  let query = new URLSearchParams(querystring);
  // 返回
  return {
    filename,
    query,
  };
}

module.exports = vue;
