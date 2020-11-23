const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: "bundle.js"
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
          }
        ],
      },
      {
        test: /\.(png|jpe?g|gif|bmp|svg)$/,
        use: [
          {
            loader: 'url-loader', // url-loader内置了file-loader
            options: {
              limit: 10 * 1024, // 如果加载的图片大小小于10K的话，就把它转成base64编码内嵌
              name: '[name].[hash:8].[ext].[query]', // 导出图片文件名 name:文件名 ext:扩展名 query:请求参数（如：引入cdn上的图片地址）
              outputPath: 'images', // 把图片拷贝到images目录下
              publicPath: 'images/', // 最终引用的文件路径前缀 =（output.publicPath + url-loader.publicPath + url-loader.name）( images/commend.176bd5b2.jpg)
              esModule: false, // 标记非esModule
            },
          }
        ],
      },
      {
        test: /.(ttf|woff|woff2|eot|svg)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 1000, // 1kb之内换成base64
              name: '[name].[hash:8].[ext]', // 文件名
              outputPath: 'fonts', // 将文件拷贝到输出目录下的fonts文件夹
              publicPath: 'fonts', // 最终引用的文件路径前缀
            },
          }
        ],
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: '[name].[hash:8].[ext]',
          outputPath: 'music',
          publicPath: 'music',
        }
      }
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: './index.html',
      filename: 'index.html',
    }),
  ]
};
