"use strict";
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define("eos",factory);
    } else {
        // Browser globals
        window.eos = factory();
    }
}(function () {
    //创建兼容低版本 promise
    var Promise = window.Promise;
    if(!Promise){
        var PENDING = undefined, FULFILLED = 1, REJECTED = 2;

        var isFunction = function(obj){
            return 'function' === typeof obj;
        };
        var isArray = function(obj) {
            return Object.prototype.toString.call(obj) === "[object Array]";
        };
        var isThenable = function(obj){
            return obj && typeof obj['then'] == 'function';
        };

        var transition = function(status,value){
            var promise = this;
            if(promise._status !== PENDING) return;
            // 所以的执行都是异步调用，保证then是先执行的
            setTimeout(function(){
                promise._status = status;
                publish.call(promise,value);
            });
        };
        var publish = function(val){
            var promise = this,
                fn,
                st = promise._status === FULFILLED,
                queue = promise[st ? '_resolves' : '_rejects'];

            while(fn = queue.shift()) {
                val = fn.call(promise, val) || val;
            }
            promise[st ? '_value' : '_reason'] = val;
            promise['_resolves'] = promise['_rejects'] = undefined;
        };

        Promise = function(resolver){
            if (!isFunction(resolver))
                throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
            if(!(this instanceof Promise)) return new Promise(resolver);

            var promise = this;
            promise._value;
            promise._reason;
            promise._status = PENDING;
            promise._resolves = [];
            promise._rejects = [];

            var resolve = function(value){
                transition.apply(promise,[FULFILLED].concat([value]));
            };
            var reject = function(reason){
                transition.apply(promise,[REJECTED].concat([reason]));
            };

            resolver(resolve,reject);
        }

        Promise.prototype.then = function(onFulfilled,onRejected){
            var promise = this;
            // 每次返回一个promise，保证是可thenable的
            return Promise(function(resolve,reject){
                function callback(value){
                    var ret = isFunction(onFulfilled) && onFulfilled(value) || value;
                    if(isThenable(ret)){
                        ret.then(function(value){
                            resolve(value);
                        },function(reason){
                            reject(reason);
                        });
                    }else{
                        resolve(ret);
                    }
                }
                function errback(reason){
                    reason = isFunction(onRejected) && onRejected(reason) || reason;
                    reject(reason);
                }
                if(promise._status === PENDING){
                    promise._resolves.push(callback);
                    promise._rejects.push(errback);
                }else if(promise._status === FULFILLED){ // 状态改变后的then操作，立刻执行
                    callback(promise._value);
                }else if(promise._status === REJECTED){
                    errback(promise._reason);
                }
            });
        }

        Promise.prototype["catch"] = function(onRejected){
            return this.then(undefined, onRejected);
        }

        Promise.prototype.delay = function(ms){
            return this.then(function(val){
                return Promise.delay(ms,val);
            })
        }

        Promise.delay = function(ms,val){
            return Promise(function(resolve,reject){
                setTimeout(function(){
                    resolve(val);
                },ms);
            })
        }

        Promise.resolve = function(arg){
            return Promise(function(resolve,reject){
                resolve(arg);
            })
        }

        Promise.reject = function(arg){
            return Promise(function(resolve,reject){
                reject(arg);
            })
        }

        Promise.all = function(promises){
            if (!isArray(promises)) {
                throw new TypeError('You must pass an array to all.');
            }
            return Promise(function(resolve,reject){
                var i = 0,
                    result = [],
                    len = promises.length;

                function resolver(index) {
                    return function(value) {
                        resolveAll(index, value);
                    };
                }

                function rejecter(reason){
                    reject(reason);
                }

                function resolveAll(index,value){
                    result[index] = value;
                    if(index == len - 1){
                        resolve(result);
                    }
                }

                for (; i < len; i++) {
                    promises[i].then(resolver(i),rejecter);
                }
            });
        }

        Promise.race = function(promises){
            if (!isArray(promises)) {
                throw new TypeError('You must pass an array to race.');
            }
            return Promise(function(resolve,reject){
                var i = 0,
                    len = promises.length;

                function resolver(value) {
                    resolve(value);
                }

                function rejecter(reason){
                    reject(reason);
                }

                for (; i < len; i++) {
                    promises[i].then(resolver,rejecter);
                }
            });
        }
    }

    function log(){
        if(console && console.log){
            switch (arguments.length){
                case 1:console.log(arguments[0]);break;
                case 2:console.log(arguments[0],arguments[1]); break;
                case 3:console.log(arguments[0],arguments[1],arguments[2]);break;
                case 4:console.log(arguments[0],arguments[1],arguments[2],arguments[3]);break;
                case 5:console.log(arguments[0],arguments[1],arguments[2],arguments[3],arguments[4]); break;
            }
        }
    }
    function noop(){}
    function ajax(opt,context) {
        return new Promise(function(resolve, reject){
            var url = opt.url || "";
            var async = opt.async !== false,
                method = opt.type || 'GET',
                data = opt.data || null,
                dataType = opt.dataType,
                beforeSend = opt.beforeSend || noop,
                complete = opt.complete || noop,
                success = function (data,xhr) {
                    if (data.status) {
                        resolve(data.result,xhr);
                    } else {
                        //内部处理出错
                        reject(data.result,xhr);
                    }
                },
                error = function (xhr, textStatus, errorThrown) {
                    if (console) {
                        console.info("XMLHttpRequest:", xhr);
                    }
                    if (textStatus == "parsererror") {
                        //解析异常，尝试eval转换
                        try {
                            eval("var eval_data=" + XMLHttpRequest.responseText);
                            if (eval_data.status) {
                                resolve(eval_data.result,xhr);
                            } else {
                                //内部处理出错
                                reject(eval_data.result,xhr);
                            }
                        } catch (e) {
                            reject("解析返回数据异常！",xhr);
                        }
                    } else {
                        reject("请求数据异常，stuats="+textStatus,xhr);
                    }
                };
            if(data){
                var args = '';
                if(typeof data == 'string'){
                    args = data;
                }else if(typeof data == 'object'){
                    var argcount = 0;
                    for (var key in data) {
                        if (data.hasOwnProperty(key)) {
                            if(data[key] == null){
                                continue;
                            }
                            if (argcount++) {
                                args += '&';
                            }
                            args += encodeURIComponent(key) + '=' + encodeURIComponent(data[key]);
                        }
                    }
                }
                method = method.toUpperCase();
                if (method == 'GET') {
                    url += (url.indexOf('?') == -1 ? '?' : '&') + args;
                    data = null;
                }else{
                    data = args;
                }
            }
            var xhr = window.XMLHttpRequest ? new XMLHttpRequest()
                : new ActiveXObject('Microsoft.XMLHTTP');
            var crossDomain = false;
            if(url.indexOf("http://") == 0 || url.indexOf("https://") == 0 ){
                var urlAnchor = document.createElement('a');
                //如果没有设置请求地址，则取当前页面地址
                urlAnchor.href = url;
                // cleans up URL for .href (IE only), see https://github.com/madrobby/zepto/pull/1049
                urlAnchor.href = urlAnchor.href;
                //通过ip  协议 端口来判断跨域  location.host = host:port
                crossDomain = (location.protocol + '//' + location.host) !== (urlAnchor.protocol + '//' + urlAnchor.host);
            }
            //执行before
            beforeSend(xhr,context);
            xhr.onreadystatechange = function() {
                if (xhr.readyState == 4) {
                    var s = xhr.status;
                    if (s >= 200 && s < 300) {
                        var txt = xhr.responseText;
                        if(dataType == 'json' && txt){
                            var tmp;
                            try{
                                tmp = JSON.parse(txt);
                            }catch (e){
                                try{
                                    tmp = (new Function("return " + txt))();
                                }catch(e2){
                                    error(xhr,999,"解析数据异常！");
                                    return;
                                }
//                                txt = txt.replace(/(\\|\\"|\n|\r|\t)/g, "\\$1");//fastjson返回的json没有转译特殊字符
                            }
                            success(tmp,xhr);
                        }else{
                            success(txt,xhr);
                        }
                    } else {
                        error(xhr,s);
                    }
                    complete(s,xhr);
                } else {
                }
            };
            xhr.open(method, url, async);
            if (method == 'POST') {
                xhr.setRequestHeader('Content-type',
                    'application/x-www-form-urlencoded;');
            }
            if(crossDomain){
                xhr.withCredentials = true;
            }else{
                xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            }            xhr.send(data);
            return xhr;
        });
    }
    function extend(obj) {
        var length = arguments.length;
        if (length < 2 || obj == null) return obj;
        for (var index = 1; index < length; index++) {
            var source = arguments[index];
            for (var key in source){
                if(source[key] != null && source[key] !== ''){
                    obj[key] = source[key];
                }
            }
        }
        return obj;
    }
    function getContextPath(baseUrl){
        //遍历获取
        var scripts = document.getElementsByTagName("script");
        if(scripts && scripts.length > 0){
            for(var i=0;i<scripts.length;i++){
                var nodeScript = scripts[i];
                var jsPath = nodeScript.hasAttribute ? // non-IE6/7
                    nodeScript.src :
                    // see http://msdn.microsoft.com/en-us/library/ms536429(VS.85).aspx
                    nodeScript.getAttribute("src", 4);
                if(jsPath.indexOf(baseUrl)!==-1) {
                    return jsPath.substring(0,jsPath.indexOf(baseUrl));
                }
            }
            var href = location.href;
            var i = href.indexOf("/",href.indexOf("/",8) + 1);
            var result = "";
            if(i != -1){
                result = href.substring(0,i);
            }else{
                result = href.substring(0,href.indexOf("/",8));
            }
            log("【eos温馨提示】截取上下文URL有误，baseUrl不正确，采用默认取值策略，值："+ result +"\n你也可以重新设置eos remote url，如：eos.rewriteUrl('remote');");
            return result;
        }else{
            return "";
        }
    }
    function guessMock(success,error,mock){
        if(!instance.useMock){
            return "";
        }
        if(mock){
            return mock;
        }else if(success && typeof success == 'string'){
            return success;
        }else if(error && typeof error == 'string'){
            return error;
        }else return "";
    }
    function guessSuccess(success,error,mock){
        if(success && typeof success == 'function'){
            return success;
        }else return null;
    }
    function guessError(success,error,mock){
        if(error && typeof error == 'function'){
            return error;
        }else return null;
    }
    function isArray(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    }
    function eosPromise(opts){
        var option = extend({},instance.defaultSettings, opts);
        if(!option.url){
            instance.rewriteUrl(getContextPath("/static") + "/remote");
            option.url = instance.defaultSettings.url;
        }
        var vars = "eos_appid="+option.appId
            + "&eos_service_id=" + option.serviceId
            + "&eos_method_name=" + option.method
            + "&eos_version=" + option.version
            + "&eos_mock=" + (option.mock == null ? "" : option.mock);
        if (option.url.indexOf("?") != -1) {
            option.url = option.url + "&" + vars;
        } else {
            option.url = option.url + "?" + vars;
        }
        //处理data,将value为object的转换为json串
        var params = option.data;
        if (params != null && typeof params == "object") {
            for (var key in params) {
                if (params[key] != null && typeof params[key] == "object") {
                    params[key] = JSON.stringify(params[key]);
                }
            }
        }
        var promise = ajax({
            type: "post",
            url: option.url + "&r=" + Math.random(),
            dataType: option.dataType,
            data: params,
            async: option.async,
            beforeSend: option.beforeSend,
            complete: option.complete
        },option);
        if(option.success){
            promise.then(option.success,option.error);
        }else{
            return promise;
        }
    }


    /**、
     * 服务
     * @param appId
     * @param serviceId
     * @constructor
     */
    function Service(appId,serviceId){
        this.appId = appId;
        this.serviceId = serviceId;
    }
    Service.prototype.registerMethod = function(method,v,paramNames){
        if(isArray(paramNames)){
            var service = this;
            if(service[method]){
                throw new Error("【eos】服务方法已经注册，请不要重复注册：" + service.appId + "-" + service.serviceId + "-" + method);
            }
            service[method] = function(){
                var data = {};
                for(var i=0;i<paramNames.length;i++){
                    data[paramNames[i]] = arguments[i];
                }
                var success = arguments[paramNames.length];
                var error = arguments[paramNames.length + 1];
                var mock = arguments[paramNames.length + 2];
                return eosPromise({
                    appId:service.appId,
                    serviceId: service.serviceId,
                    method: method,
                    version: v,
                    mock: guessMock(success,error,mock),
                    data: data,
                    success: guessSuccess(success,error,mock),
                    error: guessError(success,error,mock)
                });
            }
            return service;
        }else{
            throw new Error("【eos】注册方法错误，入参不正确！paramNames 必须为数组方式：" + paramNames);
        }
    }

    function Eos(){

    }
    /**
     * eos版本
     */
    Eos.prototype.version = "3.0.0";
    /* 是否使用mock，研发阶段可以置为 true 取模拟数据 */
    Eos.prototype.useMock = false;
    /**
     * 全局的服务基本参数
     */
    Eos.prototype.defaultSettings = {
        "dataType": "json",
        "url": "",
        "appId": "",
        "serviceId": "",
        "method": "",
        "version": "",
        "mock": "",
        "data": null,
        "async": true,
        "beforeSend": null,
        "complete": null,
        "success": null,
        "error":function(msg,xhr){ console && console.error("调用服务异常:"+ msg,xhr); }
    };
    /**
     * 重写eos接口调用的地址
     * @param url
     */
    Eos.prototype.rewriteUrl = function(url){
        this.defaultSettings.url = url
    }
    Eos.prototype.registerService = function(appId,serviceId){
        if(this[appId]){
            if(!this.hasOwnProperty(appId)){
                var arr = [];
                for(var key in this){
                    if(!this.hasOwnProperty(appId)){
                        arr.push(key);
                    }
                }
                throw new Error("【eos】不允许使用关键字["+ arr.join(",") +"]作为应用id["+ appId +"]，请更换!");
            }
        }
        var app = this[appId] = this[appId] || {};
        if(app[serviceId]){
            throw new Error("【eos】不允许重复注册服务["+ appId + "-" + serviceId +"]，请统一一处注册");
        }
        return app[serviceId] = new Service(appId,serviceId);
    }

    Eos.prototype.utils = {
        getContextPath:getContextPath,
        extend:extend,
        isArray:isArray,
        guessMock:guessMock,
        guessSuccess:guessSuccess,
        guessError:guessError
    };
    Eos.prototype.Promise = Promise;

    // Browser globals
    var instance = window.eos = new Eos();
    return instance;
}));

