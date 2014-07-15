#!/usr/bin/env node

global[' requestCallback'] = function me () {
    callback = me.onRequest();
    me.callbackRequested = true;
    return function (error, result) {
        me.callbackRequested = false;
        callback(error, result);
    };
};
global[' requestCallback'].callbackRequested = false;

var repl = require('repl'),
vm = require('vm'),
PURRL = require('../index'),
session;

function purrlEval (code, context, file, callback) {
    var err, result;

    function onRequest() {
        return callback;
    }
    global[' requestCallback'].onRequest = onRequest;

    try {
        result = vm.runInContext(code, context, file);
    } catch (e) {
        err = e;
    }
    if (err && process.domain) {
        process.domain.emit('error', err);
        process.domain.exit();
    }
    else {
        if (!global[' requestCallback'].callbackRequested) {
            callback(err, result);
        }
    }
}

session = repl.start({
    prompt : 'purrl> ',
    ignoreUndefined : true,
    eval : purrlEval
});

session.context.PURRL = function (config) { return new PURRL().config(PURRL.defaultReplConfig).config(config); };
session.context.purrl = new PURRL(PURRL.defaultReplConfig);

