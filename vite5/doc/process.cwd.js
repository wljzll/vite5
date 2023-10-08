const path = require("path");
const fs = require("fs");

/******* windows和linux的process.cwd的区别 *******/
// console.log(process.cwd());
// D:/project/webpack5.0/第3节 webpack工作流/lesson3  Windows
// /Users/ppd-0302000253/Desktop/project/vite5/doc   Mac

// Mac系统下无法通过isAbsolute判断是完整绝对路径还是相对路径
// console.log(path.isAbsolute('/Users/ppd-0302000253/Desktop/project/vite5/doc'));

// console.log(fs.statSync('/project/vite5/doc'));
// console.log(fs.statSync('/Users/ppd-0302000253/Desktop/project/vite5/doc'));

// console.log(
//   tryStatSync(
//     path.join("/Users/ppd-0302000253/Desktop/project/vite5/doc.process.cwd.js")
//   )
// );

// function tryStatSync(file) {
//   try {
//     // The "throwIfNoEntry" is a performance optimization for cases where the file does not exist
//     console.log("是目录", fs.statSync(file));
//     return fs.statSync(file, { throwIfNoEntry: false });
//   } catch (error) {
//     console.log("不是目录");
//     // Ignore errors
//   }
// }

console.log(fs.existsSync('/ppd-0302000253/Desktop/project/vite5/doc/process.cwd.js'));
