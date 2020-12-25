module.exports = {
  plugins: [
    [
      './source/babel-plugin-example', // 自定义babel插件，将变量a转换为aa、b转换为bb
      {
        a: 'aa',
        b: 'bb',
      }
    ]
  ]
}
