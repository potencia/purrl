'use strict';

var url = require('url'), placeholder, PURRL;

function PlaceHolder (config) {
    if (config.p) {
        this.p = config.p;
    }
}

PlaceHolder.createOrPassthrough = function (value) {
    var keyCount;
    if (Object.prototype.toString.call(value) === '[object Object]') {
        keyCount = Object.keys(value).length;
        if (keyCount === 0 || Object.prototype.toString.call(value.p) === '[object String]') {
            return new PlaceHolder(value);
        }
    }
    return value;
};

Object.defineProperty(PlaceHolder.prototype, 'named', {
    configurable : false,
    enumerable : false,
    get : function () {
        return this.p !== undefined;
    }
});

Object.defineProperty(PlaceHolder.prototype, 'name', {
    configurable : false,
    enumerable : false,
    get : function () {
        return this.p;
    }
});

function filterPort (value) { return (/^[0-9]+$/.test(value)) ? Number(value) : NaN; }

function filterIndex (value) { return (/^(-|\+)?[0-9]+$/.test(value)) ? Number(value) : NaN; }

function checkHookName (hookObject, hookName) {
    if (Object.keys(hookObject).indexOf(hookName) === -1) {
        throw new Error('Unrecognized hook name [ ' + hookName + ' ]');
    }
}

function confFn (options) {
    var fn = arguments[arguments.length - 1];
    if (arguments.length === 2) {
        Object.keys(options).forEach(function (key) {
            fn[key] = options[key];
        });
    }

    function defaultsTo (test, defaultValue) { return test === undefined ? defaultValue : test; }

    fn.read = defaultsTo(fn.read, true);
    fn.thisIsPurrl = defaultsTo(fn.thisIsPurrl, false);

    return fn;
}

var I = ' internal', configurations = {
    protocol : confFn({
        supported : ['http', 'https']
    },
    function protocol (name) {
        if (name === undefined) {
            return this.protocol.name;
        }
        if (protocol.supported.indexOf(name) === -1) {
            throw new Error('The [ ' + name + ' ] protocol is not supported.');
        }
        delete this.port;
        this.protocol = {
            name : name,
            client : require(name)
        };
    }),
    host : confFn(function (name) {
        if (name === undefined) {
            return {
                passThrough : true,
                value : this.host
            };
        }
        if (Object.prototype.toString.call(name) !== '[object String]') {
            throw new Error('The value [ ' + name + ' ] is invalid for host. It must be a string.');
        }
        this.host = name;
    }),
    port : confFn(function (num) {
        if (num === undefined) {
            return {
                passThrough : true,
                value : this.port
            };
        }
        var setting = filterPort(num);
        if (isNaN(setting) || setting < 1 || setting > 65535) {
            throw new Error('The value [ ' + num + ' ] is not a valid port number.');
        }
        this.port = setting;
    }),
    param : confFn(function (key, value) {
        if (key === undefined) {
            return this.param;
        }
        switch (Object.prototype.toString.call(key)) {
            case '[object String]': {
                if (value === undefined) {
                    return {
                        passThrough : true,
                        value : this.param[key]
                    };
                }
                this.param[key] = value;
                break;
            }
            case '[object Object]': {
                Object.keys(key).forEach(function (paramKey) {
                    this.param[paramKey] = key[paramKey];
                }, this);
                break;
            }
            default: {
                throw new Error('The param setting must be [ key ] and [ value ] or a [ param ] object.');
            }
        }
    }),
    removeParam : confFn({
        read : false
    },
    function (key) {
        if (key === undefined) {
            throw new Error('The removeParam setting must be passed a param key [ string ]');
        }
        delete this.param[key];
    }),
    header : confFn(function (key, value) {
        if (key === undefined) {
            return this.header;
        }
        switch (Object.prototype.toString.call(key)) {
            case '[object String]': {
                if (value === undefined) {
                    return {
                        passThrough : true,
                        value : this.header[key]
                    };
                }
                this.header[key] = value;
                break;
            }
            case '[object Object]': {
                Object.keys(key).forEach(function (headerKey) {
                    this.header[headerKey] = key[headerKey];
                }, this);
                break;
            }
            default : {
                throw new Error('The header setting must be [ key ] and [ value ] or a [ header ] object.');
            }
        }
    }),
    removeHeader : confFn({
        read : false
    },
    function (key) {
        if (key === undefined) {
            throw new Error('The removeHeader setting must be passed a header key [ string ]');
        }
        delete this.header[key];
    }),
    pathElement : confFn({
        thisIsPurrl : true
    }, function pathElement (key, value) {
        var self = this, internal = self[I];
        switch (Object.prototype.toString.call(key)) {
            case '[object Undefined]': {
                return internal.pathElement;
            }
            case '[object String]': {
                switch (Object.prototype.toString.call(value)) {
                    case '[object Undefined]': {
                        return {
                            passThrough : true,
                            value : internal.pathElement[key]
                        };
                    }
                    case '[object Array]': {
                        if (Object.getOwnPropertyDescriptor(self, key) !== undefined && !internal.pathElement.hasOwnProperty(key)) {
                            throw new Error('The pathElement [ get ] conflicts with another property.');
                        }
                        internal.pathElement[key] = value.map(function (item) {
                            return PlaceHolder.createOrPassthrough(item);
                        });
                        Object.defineProperty(self, key, {
                            configurable : true,
                            enumerable : true,
                            get : function () {
                                Array.prototype.push.apply(internal.path, internal.pathElement[key]);
                                return self;
                            }
                        });
                        break;
                    }
                    default: {
                        return pathElement.call(self, key, [value]);
                    }
                }
                break;
            }
            case '[object Object]': {
                Object.keys(key).forEach(function (name) {
                    pathElement.call(self, name, key[name]);
                });
                break;
            }
            default: {
                throw new Error('The pathElement setting must be [ key ] and [ value ] or a [ pathElement ] object.');
            }
        }
    }),
    removePathElement : confFn({
        thisIsPurrl : true,
        read : false
    },
    function (key) {
        if (key === undefined) {
            throw new Error('The removePathElement setting must be passed a pathElement key [ string ]');
        }
        if (this[I].pathElement.hasOwnProperty(key)) {
            delete this[I].pathElement[key];
            delete this[key];
        }
    }),
    hook : confFn(function hook (key, value) {
        var self = this, result;
        switch (Object.prototype.toString.call(key)) {
            case '[object Undefined]': {
                result = {};
                Object.keys(self.hook).forEach(function (key) {
                    var list = hook.call(self, key);
                    if (list.length > 0) {
                        result[key] = list;
                    }
                });
                return result;
            }
            case '[object String]': {
                checkHookName(self.hook, key);
                switch (Object.prototype.toString.call(value)) {
                    case '[object Undefined]': {
                        return self.hook[key].map(function (fn) { return fn.toString(); });
                    }
                    case '[object Array]': {
                        if (!value.every(function (item) { return Object.prototype.toString.call(item) === '[object Function]'; })) {
                            throw new Error('Error setting hook named [ ' + key + ' ]. The value must be either a [ function ] or an [ array ] of functions.');
                        }
                        self.hook[key] = value;
                        break;
                    }
                    default: {
                        return hook.call(self, key, [value]);
                    }
                }
                break;
            }
            case '[object Object]': {
                Object.keys(key).forEach(function (name) {
                    hook.call(self, name, key[name]);
                });
                break;
            }
            default: {
                throw new Error('The hook setting must be a recognized [ key ] with either a [ function ] or an [ array ] of functions or a [ hook ] object.');
            }
        }
    }),
    addHook : confFn({
        read : false
    }, function (name, fn, idx) {
        if (Object.prototype.toString.call(name) !== '[object String]' || Object.prototype.toString.call(fn) !== '[object Function]') {
            throw new Error('The addHook setting must be passed a hookName [ string ], a value [ function ], and an optional index [ integer ]');
        }
        checkHookName(this.hook, name);
        if (idx !== undefined) {
            if (isNaN(filterIndex(idx.toString()))) {
                throw new Error('The addHook index value is invalid.');
            }
            this.hook[name].splice(idx, 0, fn);
        } else {
            this.hook[name].push(fn);
        }
    }),
    removeHook : confFn({
        read : false
    },
    function (name, idx) {
        var result;
        if (Object.prototype.toString.call(name) !== '[object String]') {
            throw new Error('The removeHook setting must be passed a hookName [ string ] and an index [ integer ]');
        }
        checkHookName(this.hook, name);
        if (isNaN(filterIndex(idx.toString()))) {
            throw new Error('The removeHook index value is invalid.');
        }
        result = this.hook[name].splice(idx, 1)[0];
        if (result === undefined) {
            throw new Error('The removeHook index does not match an item in the list.');
        }
        return {
            passThrough : true,
            unaltered : true,
            value : result
        };
    }),
    promise : confFn(function (name, quiet) {
        var lib, n, valid, deferred;
        switch (Object.prototype.toString.call(name)) {
            case '[object Undefined]': {
                return {
                    passThrough : true,
                    value : this.promise.name
                };
            }
            case '[object String]': {
                try {
                    n = name;
                    lib = require(name);
                } catch (e) {
                    if (!quiet) {
                        configurations.noPromise.call(this);
                        throw new Error('Could not load the [ p ] promise library.');
                    }
                }
                break;
            }
            default: {
                n = '<custom>';
                lib = name;
            }
        }
        valid = (Object.prototype.toString.call(lib) === '[object Function]' || Object.prototype.toString.call(lib) === '[object Object]');
        valid = (valid && Object.prototype.toString.call(lib.defer) === '[object Function]');
        if (valid) {
            deferred = lib.defer();
        }
        valid = (valid && Object.prototype.toString.call(deferred) === '[object Object]');
        valid = (valid && Object.prototype.toString.call(deferred.promise) !== '[object Undefined]');
        valid = (valid && Object.prototype.toString.call(deferred.resolve) === '[object Function]');
        valid = (valid && Object.prototype.toString.call(deferred.reject) === '[object Function]');
        if (valid) {
            this.promise.name = n;
            this.promise.library = lib;
        } else {
            configurations.noPromise.call(this);
            if (!quiet) {
                throw new Error('The supplied custom promise library does not meet the required interface.');
            }
        }
    }),
    noPromise : confFn({
        read : false
    }, function () {
        this.promise = {};
    })
};

function internalApply (fn) {
    var ctr, len, args = [], argsObject;
    for (ctr = 1, len = arguments.length - 1; ctr < len; ctr++) {
        args.push(arguments[ctr]);
    }
    argsObject = arguments[ctr];
    for (ctr = 0, len = argsObject.length; ctr < len; ctr++) {
        args.push(argsObject[ctr]);
    }
    return fn.apply(null, args);
}

function config (purrl, option) {
    var result, current, len, args;
    if (option === undefined) {
        result = {};
        Object.keys(configurations)
        .filter(function (option) { return configurations[option].read; })
        .forEach(function (option) {
            if (configurations[option].thisIsPurrl) {
                current = configurations[option].call(purrl);
            } else {
                current = configurations[option].call(purrl[I]);
            }
            if (current.passThrough) {
                current = current.value;
            }
            if (current !== undefined) {
                current = JSON.stringify(current);
                if (current !== '{}') {
                    result[option] = JSON.parse(current);
                }
            }
        });
        return result;
    }

    switch (Object.prototype.toString.call(option)) {
        case '[object String]': {
            if (configurations.hasOwnProperty(option)) {
                for (current = 2, len = arguments.length, args = []; current < len; current++) {
                    args.push(arguments[current]);
                }
                if (configurations[option].thisIsPurrl) {
                    result = configurations[option].apply(purrl, args);
                } else {
                    result = configurations[option].apply(purrl[I], args);
                }
                if (result !== undefined) {
                    if (result.passThrough) {
                        if (result.value === undefined || result.unaltered) {
                            return result.value;
                        }
                        result = result.value;
                    }
                    return JSON.parse(JSON.stringify(result));
                }
                return purrl;
            }

            throw new Error('The configuration option [ ' + option + ' ] is not supported.');
        }
        case '[object Object]': {
            if (option.protocol) {
                purrl.config('protocol', option.protocol);
            }
            Object.keys(option).forEach(function (name) {
                if (name !== 'protocol') {
                    purrl.config(name, option[name]);
                }
            });
            return purrl;
        }
        default: {
            throw new Error('The [ config() ] method must be provided an [ option ] name with the correct settings or a configuration object.');
        }
    }
}

function header (purrl, key, value) {
    if (Object.prototype.toString.call(key) !== '[object String]' || value === undefined) {
        throw new Error('purrl.header() requires a [ key ] string and a [ value ]');
    }
    purrl[I].requestHeader[key] = value;
}

function noHeader (purrl, key) {
    if (Object.prototype.toString.call(key) !== '[object String]') {
        throw new Error('purrl.noHeader() requires a [ key ] string');
    }
    purrl[I].requestHeader[key] = undefined;
}

function param (purrl, key, value) {
    if (Object.prototype.toString.call(key) !== '[object String]' || value === undefined) {
        throw new Error('purrl.param() requires a [ key ] string and a [ value ]');
    }
    purrl[I].requestParam[key] = value;
}

function noParam (purrl, key) {
    if (Object.prototype.toString.call(key) !== '[object String]') {
        throw new Error('purrl.noParam() requires a [ key ] string');
    }
    purrl[I].requestParam[key] = undefined;
}

function buildBasicRequestOptions (purrl, verb) {
    var options = {method : verb};
    if (purrl[I].host) {
        options.hostname = purrl[I].host;
    }
    if (purrl[I].port) {
        options.port = purrl[I].port;
    }
    return options;
}

function buildRequestPath (purrl) {
    var path = [], pathUrl = {};

    try {
        path = purrl[I].path.map(function (segment) {
            if (segment instanceof PlaceHolder) {
                throw new Error('Cannot generate the URL path. Placeholders remain.');
            }
            return segment;
        });
    } finally {
        purrl[I].path = [];
    }

    pathUrl.pathname = PURRL.hook(purrl, 'beforePath', {path : path}).path.map(function (segment) {
        var toEncode = segment.toString();
        if (toEncode === '[object Object]') {
            toEncode = JSON.stringify(segment);
        }
        return encodeURIComponent(toEncode);
    }).join('/');

    pathUrl.query = {};
    Object.keys(purrl[I].param).forEach(function (key) {
        pathUrl.query[key] = purrl[I].param[key];
    });
    Object.keys(purrl[I].requestParam).forEach(function (key) {
        var value = purrl[I].requestParam[key];
        if (value === undefined) {
            delete pathUrl.query[key];
        } else {
            pathUrl.query[key] = value;
        }
    });

    purrl[I].requestParam = {};

    return url.format(pathUrl);
}

function buildRequestHeaders (purrl, withBody) {
    var header = {};
    if (withBody) {
        header['transfer-encoding'] = 'chunked';
    }
    Object.keys(purrl[I].header).forEach(function (key) {
        header[key] = purrl[I].header[key].toString();
    });
    Object.keys(purrl[I].requestHeader).forEach(function (key) {
        var value = purrl[I].requestHeader[key];
        if (value === undefined) {
            delete header[key];
        } else {
            header[key] = purrl[I].requestHeader[key].toString();
        }
    });
    purrl[I].requestHeader = {};
    return header;
}

function buildUrl (purrl) {
    var url = [], port,
    path = buildRequestPath(purrl),
    host = purrl.config('host');

    purrl[I].requestHeader = {};

    if (!host) {
        throw new Error('Cannot generate a URL. The host is not configured.');
    }

    port = purrl.config('port');

    url.push(purrl.config('protocol'));
    url.push('://');
    url.push(host);
    if (port !== undefined) {
        url.push(':', port);
    }
    if (path.length > 0) {
        url.push('/', path);
    }
    return url.join('');
}

function sendRequest (purrl, verb, body) {
    var request, options, beforeRequestBodyContext, deferred;

    if (purrl[I].promise.library) {
        deferred = purrl[I].promise.library.defer();
    }

    purrl[I].context.request = {};

    options = buildBasicRequestOptions(purrl, verb);
    options.path = '/' + buildRequestPath(purrl);
    options.headers = buildRequestHeaders(purrl, body !== undefined);

    if (options.hostname === undefined) {
        throw new Error('Cannot send the request. The host is not configured.');
    }

    PURRL.hook(purrl, 'beforeRequest');
    request = purrl[I].protocol.client.request(options);
    PURRL.hook(purrl, 'onRequest', {request : request});

    request.on('response', function (response) {
        var allData;
        PURRL.hook(purrl, 'onResponse', {response : response});
        if (deferred && response.statusCode < 200 || response.statusCode > 299) {
            deferred.reject({
                code : response.statusCode,
                description : require('http').STATUS_CODES[response.statusCode]
            });
        } else {
            allData = [];
        }
        response.on('data', function (data) {
            if (allData) {
                var onDataHook = PURRL.hook(purrl, 'onData', {data : data});
                if (!onDataHook.cancelled) {
                    allData.push(onDataHook.data);
                }
            }
        });
        response.on('end', function () {
            if (allData) {
                var body = PURRL.hook(purrl, 'onBody', {body : allData.join('')}).body;
                if (deferred) {
                    deferred.resolve(body);
                }
            }
        });
        response.on('error', function (error) {
            if (allData && deferred) {
                deferred.reject(error);
            }
        });
    });

    request.on('error', function (error) {
        var err = PURRL.hook(purrl, 'onRequestError', {error : error}).error;
        if (deferred) {
            deferred.reject(err);
        }
    });

    if (body !== undefined) {
        beforeRequestBodyContext = PURRL.hook(purrl, 'beforeRequestBody', {body : body});
        if (!beforeRequestBodyContext.cancelled) {
            request.write(beforeRequestBodyContext.body.toString());
        }
    }

    request.end();

    if (deferred) {
        return deferred.promise;
    }
}

placeholder = {
    nonNamed : function (segment, index, list) {
        if (segment instanceof PlaceHolder && !segment.named) {
            list[index] = this.value;
            return false;
        }
        return true;
    },
    named : function (key) {
        return this.purrl[I].path.every(function (segment, index, list) {
            if (segment instanceof PlaceHolder && segment.named && segment.name === key) {
                list[index] = this.value;
                return false;
            }
            return true;
        }, {value : this.element[key]});
    }
};

function createPurrl () {
    function purrl () {
        var ctr, len, element;
        for (ctr = 0, len = arguments.length; ctr < len; ctr++) {
            element = arguments[ctr];
            if (Object.prototype.toString.call(element) === '[object Object]') {
                if (!Object.keys(element).some(placeholder.named, {purrl : purrl, element : element})) {
                    element = undefined;
                }
            }
            if (element !== undefined) {
                if (purrl[I].path.every(placeholder.nonNamed, {value : element})) {
                    purrl[I].path.push(element);
                }
            }
        }
        return purrl;
    }

    Object.defineProperty(purrl, I, {
        enumerable : false,
        configurable : false,
        writable : false,
        value : {
            path : [],
            pathElement : {},
            header : {},
            requestHeader : {},
            param : {},
            requestParam : {},
            context : {
                session  : {},
                request : {}
            },
            hook : {
                beforePath : [],
                beforeRequest : [],
                onRequest : [],
                onRequestError : [],
                beforeRequestBody : [],
                onResponse : [],
                onData : [],
                onBody : []
            },
            promise : {}
        }
    });

    return purrl;
}

function attachMethods (purrl) {
    purrl.config = function () {
        return internalApply(config, purrl, arguments);
    };

    purrl.header = function () {
        internalApply(header, purrl, arguments);
        return purrl;
    };

    purrl.noHeader = function () {
        internalApply(noHeader, purrl, arguments);
        return purrl;
    };

    purrl.param = function () {
        internalApply(param, purrl, arguments);
        return purrl;
    };

    purrl.noParam = function () {
        internalApply(noParam, purrl, arguments);
        return purrl;
    };

    purrl.toUrl = function () {
        return internalApply(buildUrl, purrl, arguments);
    };

    purrl.get = function () {
        return internalApply(sendRequest, purrl, 'GET', arguments);
    };

    purrl.post = function () {
        return internalApply(sendRequest, purrl, 'POST', arguments);
    };

    purrl.put = function () {
        return internalApply(sendRequest, purrl, 'PUT', arguments);
    };

    purrl.patch = function () {
        return internalApply(sendRequest, purrl, 'PATCH', arguments);
    };

    purrl.delete = function () {
        return internalApply(sendRequest, purrl, 'DELETE', arguments);
    };
}

function configure (purrl, config) {
    purrl
    .config({
        protocol : 'http',
        hook : {
            onRequest : function (context) {
                context.getRequestContext().request = context.request;
            },
            onRequestError : function (context) {
                console.log(context.error);
            },
            beforeRequestBody : function (context) {
                var type = Object.prototype.toString.call(context.body);
                if (type === '[object Object]' || type === '[object Array]') {
                    context.body = JSON.stringify(context.body);
                    context.getRequestContext().request.setHeader('Content-Type', 'application/json');
                    context.getRequestContext().request.setHeader('Content-Length', context.body.length);
                }
            },
            onResponse : function (context) {
                context.response.setEncoding('utf8');
            },
            onBody : function (context) {
                console.log(context.body);
            }
        },
        promise : 'q'
    });
    if (config !== undefined) {
        purrl.config(config);
    }
}

PURRL = function (config) {
    var purrl = createPurrl();
    attachMethods(purrl);
    configure(purrl, config);
    return purrl;
};

PURRL.defaultReplConfig = {
    hook : {
        beforeRequest : function (context) {
            context.getRequestContext().replCallback = global[' requestCallback']();
        },
        onRequestError : function (context) {
            context.getRequestContext().replCallback(context.error);
        },
        onBody : function (context) {
            context.getRequestContext().replCallback(null, context.body);
        }
    }
};

function HookContext (purrl, context) {
    Object.defineProperties(this, {
        cancelled : {
            enumerable : false,
            configurable : false,
            writable : true,
            value : false
        },
        executed : {
            enumerable : false,
            configurable : false,
            writable : true,
            value : 0
        },
        context : {
            enumerable : false,
            configurable : false,
            writable : true,
            value : purrl[I].context
        }
    });

    if (Object.prototype.toString.call(context) === '[object Object]') {
        Object.keys(context).forEach(function (key) {
            this[key] = context[key];
        }, this);
    }
}

HookContext.prototype.cancel = function () {
    this.cancelled = true;
};

HookContext.prototype.getSessionContext = function () {
    return this.context.session;
};

HookContext.prototype.getRequestContext = function () {
    return this.context.request;
};

PURRL.hook = function (purrl, name, context) {
    var hookContext;
    checkHookName(purrl[I].hook, name);
    hookContext = new HookContext(purrl, context);
    purrl[I].hook[name].every(function (hook) {
        hook.call(null, hookContext);
        hookContext.executed++;
        return !hookContext.cancelled;
    });
    return hookContext;
};

module.exports = PURRL;
