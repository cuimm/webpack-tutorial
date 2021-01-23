const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js"
  },
  resolveLoader: {
    modules: [path.resolve(__dirname, './loaders'), 'node_modules'],
  },
  module: {
    rules: [
      /* {
        test: /\.(jpg|jpeg|png|gif|bmp)$/,
        use: [
          {
            loader: 'file-loader2',
            options: {
              filename: '[hash].[ext]',
              test: 'cuimm'
            }
          }
        ],
      }, */
      {
        test: /\.(jpg|jpeg|png|gif|bmp)$/,
        use: [
          {
            loader: 'url-loader2',
            options: {
              limit: 15 * 1024 // 如果加载的图片大小小于15K的话，就把它转成base64编码内嵌
            }
          }
        ],
      },
      {
        test: /\.less$/,
        use: [
            'style-loader2',
            'less-loader2'
        ]
      },
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html'
    }),
  ],
};
