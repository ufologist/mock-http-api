# CHANGELOG

* v1.1.3 2018-11-17

  * 修复 bug: 如果配置接口时使用了非法的 HTTP 动词(例如: `submit /a/b/c`), 则给出警告并跳过该接口

* v1.1.2 2017-10-12

  升级 [mock-route](https://github.com/ufologist/mock-route) 模块到 `1.4.0` 版本, 现在支持 `proxy` 配置代理接口了

* v1.1.1 2017-9-8

  将获取 mock 配置的逻辑移到 `mock-route` 模块

* v1.1.0 2017-9-8

  给 `/_apidoc` 路由添加跨域请求设置

* v1.0.0 2017-9-8

  初始版本