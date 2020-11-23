/*
* JS中引入图片
* */
const commendImg = require('./assets/images/commend.jpg');
const img = new Image();
img.src = commendImg;
document.body.appendChild(img);


/*
* CSS中引入图片
* */
require('./css/logo.css');

/**
 * 引入字体文件css
 */
require('./css/font.css');
