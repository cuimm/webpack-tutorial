将package-lock=false写入.npmrc文件可以不生成package-lock.json文件   
> echo package-lock=false > .npmrc

### 处理CSS
1. style-loader 
> npm install style-loader -D   
> 创建style标签，将js中的样式资源插入到style标签并添加到head标签创建style标签，将js中的样式资源插入到style标签并添加到head标签   

2. css-loader
> npm install css-loader -D   
> 处理css模块，将CSS模块转化成webpack能识别的JS模块   

3. less-loader   
> npm install less less-loader -D   
> 处理less模块


### 处理图片
1. file-loader && url-loader 
> npm install file-loader url-loader -D
> url-loader内置了file-loader   
> file-loader 解决CSS等文件中的引入图片路径问题   
> url-loader 当图片小于limit的时候会把图片BASE64编码，大于limit参数的时候还是使用file-loader 进行拷贝   


