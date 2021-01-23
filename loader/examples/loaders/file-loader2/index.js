const path = require('path');

/*
* file-loader
* 1. 生成一个文件名
* 2. 向输出列表里添加一个输出文件
* */
const {getOptions, interpolateName} = require('loader-utils');

function loader(content) {
  // 1. 获取loader配置的配置选项
  const options = getOptions(this); // { filename: '[hash].[ext]', test: 'cuimm' }

  // 2. 得到文件名
  let filename = interpolateName(this, options.filename || '[hash].[ext]', {
    content
  });

  // 3. 向输出列表里添加一个输出的文件
  this.emitFile(filename, content);

  // 因为通过require('xxx.png')引用的图片需要使用default引用=>使用export default导出
  return `export default ${JSON.stringify(filename)}`
}

// 加载的是二进制文件，所以需要让content是Buffer
loader.raw = true;



/*
* 以下是loader-utils内部方法部分实现
* */
function _getOptions(loaderContext) {
  const query = loaderContext.query; // { filename: '[hash].[ext]' }

  // inlineLoader 行内loader
  if (query !== '' && typeof query === 'string') {
    return _parseQuery(query);
  }
  if (!query || typeof query !== 'object') {
    return null;
  }
  return query;
}

/**
 * @param query => ?name=cuimm&age=10
 */
function _parseQuery(query) {
  query.split('&').reduce((memo, current) => {
    const [key, value] = current.split('=');
    memo[key] = value;
    return memo;
  }, {});
}

function _interpolateName(loaderContext, name, options) {
  let filename = name || '[hash].[ext]'; // 文件名格式
  const ext = path.extname(loaderContext.resourcePath).slice(1); // 扩展名
  const hash = require('crypto').createHash('md5').update(options.content).digest('hex');
  filename = filename.replace(/\[hash\]/ig, hash).replace(/\[ext\]/ig, ext);
  return filename;
}

module.exports = loader;
