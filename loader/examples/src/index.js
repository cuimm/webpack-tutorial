require('./styles/panel.less');


const pig = require('./imgs/pig.jpg');
const app = document.getElementById('app');
const img = document.createElement('img');
img.src = pig.default;
app.appendChild(img);
