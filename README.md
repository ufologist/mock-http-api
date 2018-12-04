# mock-http-api

[![NPM version][npm-image]][npm-url] [![changelog][changelog-image]][changelog-url] [![license][license-image]][license-url]

[npm-image]: https://img.shields.io/npm/v/mock-http-api.svg?style=flat-square
[npm-url]: https://npmjs.org/package/mock-http-api
[license-image]: https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square
[license-url]: https://github.com/ufologist/mock-http-api/blob/master/LICENSE
[changelog-image]: https://img.shields.io/badge/CHANGE-LOG-blue.svg?style=flat-square
[changelog-url]: https://github.com/ufologist/mock-http-api/blob/master/CHANGELOG.md

给 [express](https://github.com/expressjs/express) 添加 mock 接口的功能

## 功能

* 读取 `mock/http` 文件夹下面的 mock 配置文件, 注册 mock 接口的路由并输出 mock 数据
  * 支持任意数量的 mock 配置文件, 便于分模块管理 mock 配置文件, 具体配置规则遵循 [_mockserver.json](https://github.com/ufologist/puer-mock#config)
  * 支持 `.json` 或者 `.js` 类型的 mock 配置文件
  * 注意: mock 接口配置文件放置的路径与 mock 接口的 URL 并没有直接关系, 只与 mock 接口配置文件中定义的 URL 有关, 不过推荐配置文件放置的路径与 HTTP 接口的 URL 保持一致, 这样便于分模块维护
  * PS: **mock 配置文件的名字可以是中文的, 这样更利于接口的维护**
* 监听了 mock 配置文件, 如果文件有改动, 则自动刷新路由
* 注册了 `/_apidoc` 路由, 用于查看所有的 Mock 接口配置, 例如:
  * `http://localhost:3000/_apidoc`       [查看所有 Mock 接口的配置]
  * `http://localhost:3000/_apidoc?map=1` [查看所有 Mock 文件与其 Mock 接口配置的映射关系]
  * `http://localhost:3000/_apidoc?path=user` [从所有接口中找到匹配该路径的接口]

## 使用方法

具体请参考 [example](https://github.com/ufologist/mock-http-api/tree/master/example) 文件夹

```javascript
var express = require('express');
var mockHttpApi = require('mock-http-api');

var app = express();
// 给 express 添加 mock 接口的功能
// 会自动去读取项目根目录下 `mock/http` 文件夹中的 mock 配置文件
mockHttpApi(app);

app.listen(3000, function() {
    console.log('Example app listening on port 3000!')
});
```

然后访问

* `http://localhost:3000/_apidoc` 查看所有的 Mock 接口的配置
* `http://localhost:3000/api/news` 查看具体的 Mock 接口

  `mock/http/api/news.js` 定义了该 Mock 接口
* `http://localhost:3000/api/user` 查看具体的 Mock 接口

  `mock/http/api/user.json` 定义了该 Mock 接口
* `http://localhost:3000/users/ufologist` 查看代理的 Mock 接口

  `mock/http/api/user.json` 定义了该 Mock 接口
* `http://localhost:3000/github` 查看通过代理实现 Mock 路由

  `mock/http/api/user.json` 定义了该 Mock 接口

## 谁在使用

* [backend-tpl-server](https://github.com/ufologist/backend-tpl-server)
* [wieldy-webpack](https://github.com/ufologist/wieldy-webpack)