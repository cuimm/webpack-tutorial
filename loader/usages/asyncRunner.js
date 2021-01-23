/**
 * loader有4种：pre-loader、normal-loader、inline-loader、post-loader
 *
 * 执行顺序：pre、normal、inline、post
 */
const fs = require('fs');
const path = require('path');
const {runLoaders} = require('loader-runner');

// loaders 所在资源目录
const loaderDir = path.resolve(__dirname, './loaders');

/**
 * 获取loader资源路径
 * @param loader loader的名字
 * @returns {string} loader的绝对路径
 */
const resolveLoader = loader => path.resolve(loaderDir, loader);

// 要加载的资源和loader之间 以及loader和loader之间用!分割
const request = '!!async-loader1!async-loader2!inline-loader1!inline-loader2!./src/index.js';
let inlineLoaders = request.replace(/^-?!+/g, '').replace(/!!+/g, '!').split('!');
const resource = inlineLoaders.pop();  // 要加载的资源 ./src/index.js
inlineLoaders = inlineLoaders.map(resolveLoader);

const rules = [
  {
    enforce: 'pre',
    test: /\.js$/,
    use: ['pre-loader1', 'pre-loader2'],
  },
  {
    test: /\.js$/,
    use: ['normal-loader1', 'normal-loader2'],
  },
  {
    enforce: 'post',
    test: /\.js$/,
    use: ['post-loader1', 'post-loader2'],
  },
];

let preLoaders = [];
let normalLoaders = [];
let postLoaders = [];
rules.forEach(rule => {
  if (rule.enforce === 'pre') {
    preLoaders.push(...rule.use);
  } else if (rule.enforce === 'post') {
    postLoaders.push(...rule.use);
  } else {
    normalLoaders.push(...rule.use);
  }
});
preLoaders = preLoaders.map(resolveLoader);
normalLoaders = normalLoaders.map(resolveLoader);
postLoaders = postLoaders.map(resolveLoader);

let loaders = [];
if (request.startsWith('!!')) {
  loaders = inlineLoaders
} else if (request.startsWith('-!')) {
  loaders = [...postLoaders, ...inlineLoaders]
} else if (request.startsWith('!')) {
  loaders = [...postLoaders, ...inlineLoaders, ...preLoaders]
} else {
  loaders = [...postLoaders, ...inlineLoaders, ...normalLoaders, ...preLoaders]
}

console.log(loaders);

runLoaders({
  resource: resource, // 加载的资源的绝对路径
  loaders: loaders, // loaders的数组，也是绝对路径
  readResource: fs.readFile.bind(fs), // 读文件的方法
}, (error, data) => {
  console.error(error);
  console.log(data);
});

/*
{ result:
   [ "console.log('index.js');\npre-loader2pre-loader1normal-loader2//normal-loader1//inline-loader2//inline-loader1post-loader2post-loader1" ],
  resourceBuffer:
   <Buffer 63 6f 6e 73 6f 6c 65 2e 6c 6f 67 28 27 69 6e 64 65 78 2e 6a 73 27 29 3b 0a>,
  cacheable: true,
  fileDependencies: [ './src/index.js' ],
  contextDependencies: [],
  missingDependencies: []
}
* */
