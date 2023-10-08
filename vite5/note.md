## 第一步：安装依赖
``` shell
npm install connect es-module-lexer resolve check-is-array c fast-glob fs-extra serve-static magic-string chokidar ws --save

```
> es-module-lexer: ES解析模块
> resolve: 解析包地址的模块
> esbuild: go语言写的打包的包
> fast-glob: 匹配文件的包
> fs-extra: 写文件的包
> serve-static: 静态文件中间件
> magic-string: 改字符串

## 第二步：在package.json中增加脚本
```json
 "bin": {
    "vite5": "./bin/vite5.js"
  },
```

## 第三步：在根目录下创建bin目录,在bin目录下创建vite5.js文件
```shell
#!/usr/bin/env node
requuire('../lib/cli')
```

## 第四步：在根目录下创建lib目录, 在lib目录下创建cli.js文件

## 第五步：在根目录下执行npm link命令, 把当前这个包链接到全局上去