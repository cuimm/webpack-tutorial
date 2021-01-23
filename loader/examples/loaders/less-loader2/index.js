const less = require('less');

/*
// 正常less-loader2输出的是转义之后的css字符串
function loader(source) {
  const callback = this.async();

  // 调用less的render方法将less转为css
  less.render(source, {
    filename: this.resource
  }, (error, output) => {
    const css = output.css;
    callback(error, css);
  });
}
*/

// less-loader2返回 "module.exports = xxx" 格式传递给style-loader
function loader(source) {
  const callback = this.async();
  less.render(source, {
    filename: this.resource,
  }, (error, output) => {
    const css = output.css;

    // 此处如果让less-loader2输出module.exports => 那么style-loader2接收的就是：module.exports = xxx
    const code = `module.exports = ${JSON.stringify(css)}`;
    callback(error, code);
  })
}

module.exports = loader;
