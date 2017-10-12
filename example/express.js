var express = require('express');
var mockHttpApi = require('mock-http-api');

var app = express();
// 给 express 添加 mock 接口的功能
// 会自动去读取项目根目录下 `mock/http` 文件夹中的 mock 配置文件
mockHttpApi(app);

// 响应所有 options 请求, 用于跨域
app.use(function(request, response, next) {
    if (request.method == 'OPTIONS') {
        var origin = request.get('origin');
        var accessControlRequestHeaders = request.get('Access-Control-Request-Headers');

        var header = {
            'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
            'Access-Control-Allow-Credentials': 'true'
        };
        header['Access-Control-Allow-Origin'] = origin ? origin : '*';

        if (accessControlRequestHeaders) {
            header['Access-Control-Allow-Headers'] = accessControlRequestHeaders;
        }
        response.set(header).status(200).end();
    }
    next();
});

app.listen(3000, function() {
    console.log('Example app listening on port 3000!')
});