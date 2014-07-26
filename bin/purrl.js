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
confFile = 'purrl.json',
specified = false,
minimist,
argv,
clients,
session;

try {
    minimist = require('minimist');
} catch (e) {
    // Optional dependency
}

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

if (minimist) {
    argv = minimist(process.argv.slice(2));
    if (Object.prototype.toString.call(argv.c) === '[object Array]') {
        argv.c = argv.c[0];
    }
    if (Object.prototype.toString.call(argv.conf) === '[object Array]') {
        argv.conf = argv.conf[0];
    }
    if (Object.prototype.toString.call(argv.c) === '[object String]') {
        confFile = argv.c;
        specified = true;
    }
    if (Object.prototype.toString.call(argv.conf) === '[object String]') {
        confFile = argv.conf;
        specified = true;
    }
}

clients = PURRL.createReplClients(confFile, specified);

session = repl.start({
    prompt : 'purrl> ',
    ignoreUndefined : true,
    eval : purrlEval
});

session.context.PURRL = function me (config) {
    var purrl = me.createClient().purrl;
    purrl.config(config);
    return purrl;
};
session.context.PURRL.createClient = PURRL.createReplClients.bind(null, '', false);
session.context.PURRL.loadConfig = PURRL.loadConfig;
Object.keys(clients).forEach(function (client) {
    session.context[client] = clients[client];
});
