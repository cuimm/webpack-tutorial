/*
* 导入样式文件（css/less）
*
* 因为webpack引入文件的时候，会默认该模块为js模块，将CSS模块按照JS语法去解析，报错：Module parse failed
* 此时，需安装解析css文件的loader转换器：css-loader、style-loader
* 结论：不论是css模块还是less模块，都会最终以style的形式插入到head标签中
* */

/*
* 引入CSS模块
* */
import './body.css';

/**
 * 引入less模块
 * npm i less less-loader -D
 */
import './panel.less';
