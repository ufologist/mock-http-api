var express = require('express');
var mockHttpApi = require('mock-http-api');

var app = express();
// 给 express 添加 mock 接口的功能
// 会自动去读取项目根目录下 `mock/http` 文件夹中的 mock 配置文件
mockHttpApi(app);

app.listen(3000, function() {
    console.log('Example app listening on port 3000!')
});