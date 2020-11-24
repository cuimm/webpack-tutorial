const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.s?css$/,
        use: [
          {
            // loader: 'style-loader',
            loader: MiniCssExtractPlugin.loader, // MiniCssExtractPlugin 不能和 style-loader 同时使用
            options: {
              publicPath: '../', // 此处设置css中引入图片的相对地址 background: url(../img/commend.176bd5b2.jpg)
              // publicPath: '../../', // 此处设置css中引入图片的相对地址 background: url(../../img/commend.176bd5b2.jpg)
            }
          },
          {
            loader: 'css-loader',
          },
          {
            loader: 'sass-loader',
          }
        ],
      },
      {
        test: /\.(png|jpe?g|gif|ttf|woff|woff2|eot|svg|ico)$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 25 * 1024,
            // outputPath: 'img',
            esModule: false,
            fallback: {
              loader: 'file-loader',
              options: {
                name: 'img/[name].[hash:8].[ext]' // 当引入的图片资源大于25K时，使用file-loader将资源拷贝到img文件下
              }
            }
          }
        }
      },
    ]
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: './index.html',
      filename: 'index.html',
    }),
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash:8].css',  // 打包入口文件，将css放置在css文件夹
      chunkFilename: 'css/[name].[contenthash:4].css', // 用来打包import('module')方法中引入的模块
    }),
  ]
};

/*
【关于MiniCssExtractPlugin插件publicPath的理解】

可以把publicPath理解为给所有参考图片增加一个路径前缀：
  由于通过MiniCssExtractPlugin插件修改了css资源的生成路径，也就是多增加了一层目录放置css文件，
  相对的，publicPath也必须往上一层去找资源。

  => 相对路径 【相对于入口文件的路径】

  本例中该插件时需要设置publicPath: '../'，打包后css中引入图片：background: url(../img/commend.176bd5b2.jpg)；
  否则生成：background: url(img/commend.176bd5b2.jpg)，访问不到图片

  如果css生成路径修改为：css/test/[name].[contenthash:8].css，那么该插件时需要设置publicPath: '../..'
  此时打包后css中图片引用：url(../../img/commend.176bd5b2.jpg) no-repeat;
* */
