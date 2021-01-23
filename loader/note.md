### Loader 工作原理   
Loader是代码转换器。
webpack本身只能处理JS格式文件，Loader 可以使你在 import 或 "load(加载)" 模块时预处理文件。
Loader的作用是让webpack拥有了加载和解析非JS文件的能力。

它由 webpack 的 `loader runner` 执行调用，接收原始资源数据作为参数
（当多个加载器联合使用时，上一个loader的结果会传入下一个loader），
最终输出 javascript 代码（和可选的 source map）给 webpack 做进一步编译。


### 使用Loader的方式
1. 配置方式（推荐）
    
    在 webpack.config.js 文件中指定 loader。
    
2. 内联方式
    
    在每个import语句中显式指定loader。
    ```js
    import Styles from 'style-loader!css-loader?modules!./styles.css';
    ```
3. CLI 方式
    
    在shell命令中指定它们。


### loader 特性 
1. loader 支持链式调用。链中的每个 loader 会将转换应用在已处理过的资源上。一组链式的 loader 将按照相反的顺序执行。链中的第一个 loader 将其结果（也就是应用过转换后的资源）传递给下一个 loader，依此类推。最后，链中的最后一个 loader，返回 webpack 所期望的 JavaScript。
2. loader 可以是同步的，也可以是异步的。
3. loader 运行在 Node.js 中，并且能够执行任何操作。
4. loader 可以通过 options 对象配置（仍然支持使用 query 参数来设置选项，但是这种方式已被废弃）。
5. 除了常见的通过 package.json 的 main 来将一个 npm 模块导出为 loader，还可以在 module.rules 中使用 loader 字段直接引用一个模块。
6. 插件(plugin)可以为 loader 带来更多特性。
7. loader 能够产生额外的任意文件。


### Loader 执行顺序
1. 分类
> pre： 前置loader   
> normal： 普通loader   
> inline： 内联loader   
> post： 后置loader   


2. 执行优先级

4类 loader 的执行优级为：`pre > normal > inline > post` 。
相同优先级的 loader 执行顺序为：`从右到左，从下到上`。


3. 前缀的作用

内联 loader 可以通过添加不同前缀，跳过其他类型 loader。

> `!` 跳过 normal loader。   
> `-!` 跳过 pre 和 normal loader。   
> `!!` 跳过 pre、 normal 和 post loader，只要inlineLoader。   


### 如何开发一个loader
1. 最简单的loader
接受资源源码，返回转换后的代码
```js
    // loaders/simple-loader.js
    module.exports = function loader (source) {
        console.log('simple-loader is working');
        return source;
    }
```

2. 带 pitch 的 loader
`pitch` 是 loader 上的一个方法，它的作用是阻断 loader 链。

```js
    // loaders/simple-loader-with-pitch.js
    module.exports = function (source) {  
        console.log('normal excution');   
        return source;
    }
    
    // loader上的pitch方法，非必须
    module.exports.pitch =  function() { 
        console.log('pitching graph');
        // todo
    }
```
pitch 方法不是必须的。如果有 pitch，loader 的执行则会分为两个阶段：`pitch` 阶段 和 `normal execution` 阶段。
webpack 会先从左到右执行 loader 链中的每个 loader 上的 pitch 方法（如果有），然后再从右到左执行 loader 链中的每个 loader 上的普通 loader 方法。

假如配置了如下 loader 链：

use: ['loader1', 'loader2', 'loader3']

真实的 loader 执行过程是：
    loader1.pitch
    loader2.pitch
    loader3.pitch
    读取源码
    loader3
    loader2
    loader1

注：pitch 方法有3个参数：
> remainingRequest：loader链中排在自己后面的 loader 以及资源文件的绝对路径以`!`作为连接符组成的字符串。   
> precedingRequest：loader链中排在自己前面的 loader 的绝对路径以`!`作为连接符组成的字符串。   
> data：每个 loader 中存放在上下文中的固定字段，可用于 pitch 给 loader 传递数据。   
