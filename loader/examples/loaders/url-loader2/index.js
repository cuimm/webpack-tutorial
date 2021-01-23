const mime = require('mime');
const {getOptions} = require('loader-utils');

function loader(content) {
  let {limit, fallback = 'file-loader'} = getOptions(this);
  if (limit) {
    limit = parseInt(limit, 10);
  }

  // 获取文件的mime类型 .jpg => image/jpg
  const mimeType = mime.lookup(this.resourcePath);

  if (!limit || content.length < limit) {
    const base64String = `data:${mimeType};base64,${content.toString('base64')}`;
    return `export default ${JSON.stringify(base64String)}`
  } else {
    const fileLoader = require(fallback);
    return fileLoader.call(this, content);
  }
}

loader.raw = true;

module.exports = loader;
