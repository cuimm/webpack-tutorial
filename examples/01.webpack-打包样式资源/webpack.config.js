const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');

module.exports = {
  mode: 'development',  // mode 模式：development | production
  devtool: 'eval',  // source-map eval-source-map 等（sourcemap是为了解决开发代码与实际运行代码不一致时帮助我们debug到原始开发代码的技术）
  entry: './src/index.js', // 入口
  output: {
    path: path.resolve(__dirname, 'dist'), // 打包输出路径
    filename: 'bundle.[hash:8].js', // 打包输出文件名
  },
  module: {
    rules: [
      {
        // 处理CSS模块
        test: /\.css$/,
        use: [
          {
            loader: 'style-loader', // 创建style标签，将js中的样式资源插入到style标签并添加到head标签
          },
          {
            loader: 'css-loader', // 处理css模块，将css模块转化成webpack能识别的js模块
          }
        ],
      },
      {
        // 处理less模块【loader执行顺序：从后向前依次执行（也可说从右往左，从下往上）】
        test: /.less/,
        use: [
          'style-loader', // 创建style标签，将js中的样式资源插入到style标签并添加到head标签
          'css-loader', // 将css资源编译成commonjs模块加载到js中，但仍然保持样式字符串的形式
          'less-loader' // 将less资源编译成css资源
        ],
      }
    ]
  },
  plugins: [
    // 此插件作用：用于删除/清理构建文件夹
    new CleanWebpackPlugin(),
    // 此插件作用：在编译的时候读取编译模版，产出html
    new HtmlWebpackPlugin({
      template: './index.html', // 指定模版文件。复制指定template对应的index.html并自动引入所有打包后的资源(js/css)
      filename: 'index.html', // 指定打包后文件名
    }),
  ],
};
