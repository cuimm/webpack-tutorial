function loader(source) {
  // 调用loaderContext.async方法可以将loader由同步改为异步
  const callback = this.async();

  // loader-runner内部采用深度递归处理loader链，将上一个loader处理之后的结果传递给下一个loader
  setTimeout(function () {
    // 异步loader执行结束后并不会立刻向下执行下一个loader，需要手动在代码调用callback方法
    // loader-runner内部会从第二个参数截取传递给下一个loader
    callback(null, source + '//===> async-loader1');
  }, 1000);
}

loader.pitch = function() {

};

module.exports = loader;
