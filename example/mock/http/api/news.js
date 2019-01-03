module.exports = {
    "api": {
        "GET /api/news": {
            "response": {
                "status": 0,
                "data": {
                    "title": "@ctitle"
                }
            }
        },
        "GET /api/new/:id": function(request, response, next) {
            // 可以返回对象, 达到动态组装 mock 数据的目的
            return {
                id: request.params.id,
                name: '@cname'
            };
        },
        "GET /api/new/:id/view": function(request, response, next) {
            // 不返回结果时, 可以完全自己控制要输出的内容
            response.send('view ' + request.params.id);
        }
    }
};