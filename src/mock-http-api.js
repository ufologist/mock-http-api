var path = require('path');

var glob = require('glob');
var merge = require('merge');
var chokidar = require('chokidar');
var mockRoute = require('mock-route');
var Router = require('express').Router;

var removeRoute = require('./remove-route.js');

var __hasProp = {}.hasOwnProperty;

var mockHttpBase = './mock/http';
var mockConfigFileGlob = mockHttpBase + '/**/*.{js,json}';

/**
 * 从一组文件中获取 Mock 配置
 * 
 * @param {Array<string>} filenames 
 * @return {object} {
 *     mockConfig,   // 合并了所有 Mock 配置文件中的接口配置
 *     mockConfigMap // Mock 文件与其 Mock 配置的映射
 * }
 */
function getMockInfo(filenames) {
    // Mock 文件与 Mock 配置的映射关系, 用于找出可能重复定义的接口
    var mockConfigMap = {};
    var allMockConfig = {};

    filenames.forEach(function(filename) {
        var mockConfig = mockRoute.getMockConfig(filename);
        mockConfigMap[filename] = mockConfig;
        allMockConfig = merge.recursive(true, allMockConfig, mockConfig);
    });

    return {
        mockConfigMap: mockConfigMap,
        mockConfig: allMockConfig
    };
}

/**
 * 尝试从 Mock 文件与其 Mock 配置的映射关系中找出是否有重复定义的 Mock 数据配置
 * 
 * @param {object} mockConfigMap 
 */
function tryFindDuplicateHttpApi(mockConfigMap) {
    var apis = {};
    for (var filename in mockConfigMap) {
        var api = mockConfigMap[filename].api;
        if (api) {
            for (var path in api) {
                var apiDefine = {};
                apiDefine[path] = api[path];

                if (apis[path]) {
                    console.warn('有重复定义的 HTTP 接口 Mock 数据配置');
                    console.log('---------------------------------------------------------');
                    console.warn(filename, JSON.stringify(apiDefine, null, 4));
                    console.warn(apis[path].filename, JSON.stringify(apis[path].apiDefine, null, 4));
                    console.log('---------------------------------------------------------');
                } else {
                    apis[path] = {
                        filename: filename,
                        apiDefine: apiDefine
                    };
                }
            }
        }
    }
}

/**
 * 查找出所有 Mock 配置文件
 * 
 * @return {Array<string>} Mock 配置文件的路径
 */
function getMockConfigFilenames() {
    var filenames = glob.sync(mockConfigFileGlob, {
        absolute: true,
        nodir: true
    });
    return filenames;
}

/**
 * 追加 `/_apidoc` 路由, 用于查看所有的 Mock 接口配置
 * 
 * 例如
 * - `http://localhost:8000/_apidoc`       // 查看所有 Mock 接口的配置
 * - `http://localhost:8000/_apidoc?map=1` // 查看所有 Mock 文件与其 Mock 接口配置的映射关系
 * 
 * @param {object} routeConfig
 * @param {object} mockInfo
 */
function appendApidocRoute(routeConfig, mockInfo) {
    routeConfig['GET /_apidoc'] = function(request, response, next) {
        mockRoute.enableCors(request, response);

        if (request.query.map) {
            response.jsonp(mockInfo.mockConfigMap);
        } else if (request.query.path) {
            response.jsonp(findDefinedMockFilePath(mockInfo.mockConfigMap, request.query.path));
        } else {
            response.jsonp(mockRoute.groupApiByModuleName(mockInfo.mockConfig));
        }
    };
}

/**
 * 从所有接口中找到匹配该路径的接口
 * 
 * @param {object} mockConfigMap 接口文件映射
 * @param {string} path 要查找的接口的 path
 * @return {object}
 */
function findDefinedMockFilePath(mockConfigMap, path) {
    var found = {};
    for (var mockFilePath in mockConfigMap) {
        var api = mockConfigMap[mockFilePath].api;
        if (api) {
            for (var apiPath in api) {
                if (apiPath.indexOf(path) !== -1) {
                    if (!found[mockFilePath]) {
                        found[mockFilePath] = {
                            api: {}
                        }
                    }

                    found[mockFilePath].api[apiPath] = api[apiPath];
                }
            }
        }
    }
    return found;
}

/**
 * 注册所有 HTTP Mock 接口的路由
 * 
 * @param {object} routeConfig
 */
function registerMockApiRoute(app, routeConfig) {
    // 通过 Router 创建模块化的路由定义
    var router = new Router();

    // 参考 puer 的 addon 机制
    for (var path in routeConfig) {
        if (!__hasProp.call(routeConfig, path)) continue;

        var callback = routeConfig[path];

        var method = 'GET';
        var tmp = path.split(/\s+/);
        if (tmp.length > 1) {
            method = tmp[0];
            path = tmp[1];
        }

        if (router[method.toLowerCase()]) {
            router[method.toLowerCase()](path, callback);
        } else {
            console.warn('非法的 HTTP 动词', method, '跳过该接口');
            console.log('---------------------------------------------------------');
            console.warn(tmp.join(' '));
            console.log('---------------------------------------------------------');
        }
    }

    // 使用 Router 模块化路由定义, 可以快速将路由切换到统一路径下面,
    // 例如: app.use('/api', router);
    app.use(router);
}

/**
 * 删除已经存在的 Mock 路由
 * 
 * @param {object} app 
 * @param {object} routeConfig 
 */
function removeMockRoute(app, routeConfig) {
    if (!routeConfig) {
        return;
    }

    // 参考 puer 的 addon 机制
    for (var path in routeConfig) {
        if (!__hasProp.call(routeConfig, path)) continue;

        var tmp = path.split(/\s+/);
        if (tmp.length > 1) {
            path = tmp[1];
        }

        removeRoute(app, path);
    }
}

// 保存路由配置, 用于 watch 文件改动后删除已经存在的 Mock 路由
var routeConfig;

function mockHttpApi(app) {
    // puer 为什么不需要删除已经存在的路由就可以做到监听文件后刷新 addon restRoute
    // 1. 基于 express 3.x
    // 2. 每次刷新时重建 addon.router
    // 3. 在 app.use 中使用 router.matchRequest(req) 来匹配路由规则
    // 由于是基于 express 3.x 的, 所以就不能在我这里用了
    removeMockRoute(app, routeConfig);

    var filenames = getMockConfigFilenames();
    var mockInfo = getMockInfo(filenames);
    routeConfig = mockRoute.generateRouteConfig(mockInfo.mockConfig);
    appendApidocRoute(routeConfig, mockInfo);

    tryFindDuplicateHttpApi(mockInfo.mockConfigMap);
    registerMockApiRoute(app, routeConfig);
}

/**
 * 当 Mock 文件修改后, 自动刷新 Mock 路由
 */
function watchMockConfigFile(app) {
    chokidar.watch(mockConfigFileGlob, {
        cwd: process.cwd()
    }).on('add', function(filePath) {
        console.log(new Date().toLocaleString(), 'mockHttpApi: [add]    ' + path.resolve(filePath));
        mockHttpApi(app);
    }).on('change', function(filePath) {
        console.log(new Date().toLocaleString(), 'mockHttpApi: [change] ' + path.resolve(filePath));
        mockHttpApi(app);
    }).on('unlink', function(filePath) {
        console.log(new Date().toLocaleString(), 'mockHttpApi: [remove] ' + path.resolve(filePath));
        mockHttpApi(app);
    });
}

module.exports = function(app) {
    // 先启动一次, 这样 _routes 路由才能及时得到已经注册的路由
    mockHttpApi(app);
    watchMockConfigFile(app);
};