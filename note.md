将package-lock=false写入.npmrc文件可以不生成package-lock.json文件   
> echo package-lock=false > .npmrc

### 处理CSS
1. style-loader 
> npm install style-loader -D

2. css-loader
> npm install css-loader -D

3. less-loader   
> npm install less less-loader -D


### 处理图片
1. url-loader   
> 内置了file-loader   
> npm install file-loader url-loader -D
