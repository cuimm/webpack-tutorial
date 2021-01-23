function loader(source) {
  // 异步loader
  const callback = this.async();

  Promise.resolve().then(() => {
    callback(null, source + '//===> async-loader2');
  });
}

// pitch的参数: [remainingRequest, previousRequest, data={}]
// this为loader的上下文对象loaderContext
loader.pitch = function(...args) {
  const callback = this.async();
  setTimeout(function () {
    callback(null, 'async-loader2 pitch')
  }, 1000)
}


module.exports = loader;
