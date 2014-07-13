'use strict';

var url = require('url'), PURRL;

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
    fn.read = (fn.read === undefined ? true : fn.read);
    fn.passThrough = (fn.passThrough === undefined ? false : fn.passThrough);
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
        this.protocol = {
            name : name,
            client : require(name)
        };
    }),
    host : confFn(function (name) {
        if (name === undefined) {
            return this.host;
        }
        if (Object.prototype.toString.call(name) !== '[object String]') {
            throw new Error('The value [ ' + name + ' ] is invalid for host. It must be a string.');
        }
        this.host = name;
    }),
    port : confFn(function (num) {
        if (num === undefined) {
            return this.port;
        }
        var setting = filterPort(num);
        if (isNaN(setting)) {
            throw new Error('The value [ ' + num + ' ] is not a valid port number.');
        }
        this.port = setting;
    }),
    query : confFn(function (key, value) {
        if (key === undefined) {
            return this.query;
        }
        switch (Object.prototype.toString.call(key)) {
            case '[object String]': {
                if (value === undefined) {
                    return this.query[key];
                }
                this.query[key] = value;
                break;
            }
            case '[object Object]': {
                this.query = key;
                break;
            }
            default: {
                throw new Error('The query setting must be [ key ] and [ value ] or a [ query ] object.');
            }
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
        read : false,
        passThrough : true
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
        return result;
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
            current = configurations[option].call(purrl[I]);
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
                result = configurations[option].apply(purrl[I], args);
                if (configurations[option].passThrough) {
                    return result;
                }
                if (result !== undefined || args.length === 0) {
                    if (result !== undefined) {
                        return JSON.parse(JSON.stringify(result));
                    }
                    return result;
                }
                return purrl;
            }

            throw new Error('The configuration option [ ' + option + ' ] is not supported.');
        }
        case '[object Object]': {
            Object.keys(option).forEach(function (name) {
                purrl.config(name, option[name]);
            });
            return purrl;
        }
        default: {
            throw new Error('The [ config() ] method must be provided an [ option ] name with the correct settings or a configuration object.');
        }
    }
}

function sendRequest (purrl, verb) {
    var request, options = {method : verb}, pathUrl = {};
    if (purrl[I].host) {
        options.hostname = purrl[I].host;
    }

    if (purrl[I].port) {
        options.port = purrl[I].port;
    }

    purrl[I].path.unshift('');
    pathUrl.pathname = purrl[I].path.map(function (segment) { return encodeURIComponent(segment); }).join('/');
    purrl[I].path = [];

    pathUrl.query = {};
    Object.keys(purrl[I].query).forEach(function (key) {
        pathUrl.query[key] = purrl[I].query[key];
    });

    options.path = url.format(pathUrl);

    if (options.hostname === undefined) {
        throw new Error('Cannot send the request. The host is not configured.');
    }

    PURRL.hook(purrl, 'beforeRequest');

    request = purrl[I].protocol.client.request(options);

    request.on('response', function (response) {
        var allData = [];
        response.setEncoding('utf8');
        response.on('data', function (data) {
            allData.push(data);
        });
        response.on('end', function () {
            PURRL.hook(purrl, 'onBody', {body : allData.join('')});
        });
    });

    request.on('error', function (error) {
        PURRL.hook(purrl, 'onRequestError', {error : error});
    });

    request.end();
}

PURRL = function () {
    function purrl () {
        var ctr, len, seg;
        for (ctr = 0, len = arguments.length; ctr < len; ctr++) {
            seg = arguments[ctr].toString();
            purrl[I].path.push(seg);
        }
        return purrl;
    }

    Object.defineProperty(purrl, I, {
        enumerable : false,
        configurable : false,
        writable : false,
        value : {
            query : {},
            hook : {
                beforeRequest : [],
                onRequestError : [],
                onData : [],
                onBody : []
            },
            hookGlobal : {},
            path : []
        }
    });

    purrl.config = function () {
        return internalApply(config, purrl, arguments);
    };

    purrl.get = function () {
        internalApply(sendRequest, purrl, 'GET', arguments);
    };

    return purrl
    .config({
        protocol : 'http',
        hook : {
            onRequestError : function (context) {
                console.log(context.error);
            },
            onBody : function (context) {
                console.log(context.body);
            }
        }
    });
};

PURRL.defaultReplConfig = {
    hook : {
        beforeRequest : function () {
            this.replCallback = global[' requestCallback']();
        },
        onRequestError : function (context) {
            this.replCallback(context.error);
        },
        onBody : function (context) {
            this.replCallback(null, context.body);
        }
    }
};

function HookContext (context) {
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

PURRL.hook = function (purrl, name, context) {
    var hookContext;
    checkHookName(purrl[I].hook, name);
    hookContext = new HookContext(context);
    purrl[I].hook[name].every(function (hook) {
        hook.call(purrl[I].hookGlobal, hookContext);
        hookContext.executed++;
        return !hookContext.cancelled;
    });
    return hookContext;
};

module.exports = PURRL;
