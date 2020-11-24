
//=> 引入的reset和body会打包到main.css
import './styles/reset.css';
import './styles/body.css';

//=> panel.scss会打包到panel.css中，同时生成代码块panel.js
import(/*webpackChunkName: "panel"*/'./styles/panel.scss')

//=> js引入图片资源
const animalImg = require('./assets/images/animal.jpg');
const img = new Image();
img.src = animalImg;
img.width = 200;
img.height = 200;
document.body.appendChild(img);
