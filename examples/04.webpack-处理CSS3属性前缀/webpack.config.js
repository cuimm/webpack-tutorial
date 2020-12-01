const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[hash:8].js',
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: '../'
            }
          },
          {
            loader: 'css-loader',
          },
          {
            loader: 'postcss-loader',
            /*
            * 为了浏览器的兼容性，有时候我们必须加入-webkit,-ms,-o,-moz这些前缀
            * Chrome和Safari：前缀为-webkit
            * Firefox：前缀为-moz
            * Opera：前缀为-o
            * IE：前缀为-ms
            *
            * npm i postcss-loader autoprefixer -D
            *
            * 添加配置文件 postcss.config.js：
            *  module.exports = {
            *    plugins: [require('autoprefixer')]
            *  }
            *
            * PostCSS 的主要功能只有两个：
            *   第一个就是前面提到的把 CSS 解析成 JavaScript 可以操作的 抽象语法树结构(Abstract Syntax Tree，AST)
            *   第二个就是调用插件来处理 AST 并得到结果
            * */
          },
        ],
      },
      {
        test: /\.(png|jpe?g|img)$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 4 * 1024,
            fallback: {
              loader: 'file-loader',
              options: {
                name: 'images/[name].[contenthash:8].[ext]'
              }
            },
          },
        },
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: 'index.html',
      filename: 'index.html',
    }),
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash:8].css', // 打包入口文件css模块
      chunkFilename: 'css/[name].[contenthash:8].css', // 打包import('xxx')异步方式引入的css模块
    }),
  ],
};
