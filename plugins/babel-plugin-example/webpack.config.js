const path = require('path');
console.log('sss');
module.exports = {
  resolve: {
    modules: [path.resolve(__dirname, './source'), path.resolve(__dirname, './node_modules')]
  }
}
