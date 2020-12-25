function loader(source) {
  console.log('inline-loader1')
  return source + '//inline-loader1';
}

module.exports = loader;
