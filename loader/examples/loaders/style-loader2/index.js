const loaderUtils = require('loader-utils');

/**
 * style-loader 将less-loader转换后的css转义成style标签插入到header中
 * @param source
 */
function loader(source) {
  console.log('style-loader source', source); // .panel { background-color: #ddd; ... }
  const script = `
    const style = document.createElement('style');
    style.innerHTML = ${JSON.stringify(source)};
    document.head.appendChild(style);
  `;
  return script;
}

// 解决由于less-loader2的normal返回module.export=xxx
loader.pitch = function (remainingRequest, previousRequest, data) {
  console.log('remainingRequest', remainingRequest); // /Users/xxx/examples/loaders/less-loader2/index.js!/Users/xxx/examples/src/styles/panel.less

  // stringifyRequest 将绝对路径转为相对路径(why? 通过require引入的模块，模块id是相对路径，相对于根目录的相对路径)
  // inlineLoaders=!!../../loaders/less-loader2/index.js!./panel.less
  // 此处添加"!!"：只取行内loader。
  // 如果不添加"!!"，那么会调用webpack.config.js内部配置的loader。=> ./less-loader2/index.js!style-loader2!less-loader2./panel.less
  const inlineLoaders = loaderUtils.stringifyRequest(this, '!!' + remainingRequest);

  const script = `
    const style = document.createElement('style');
    style.innerHTML = require(${inlineLoaders});
    document.head.appendChild(style);
  `;

  // 此处style-loader2的pitch函数有返回值，不会再执行后面的loader，掉转枪头到前面loader的normal。
  // 由于style-loader2是最左侧的loader，那么返回的script将传递给webpack进行解析
  return script;
}


module.exports = loader;
