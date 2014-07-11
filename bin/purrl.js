#!/usr/bin/env node

var repl = require('repl'), session;

function purrlEval (code, context, file, callback) {
    var callbackRequested = false;
    context[' requestCallback'] = function () {
        callbackRequested = true;
        return callback;
    };
    purrlEval.eval(code, context, file, function (error, result) {
        if (!callbackRequested) {
            callback(error, result);
        }
    });
}

session = repl.start({
    prompt : 'purrl> ',
    ignoreUndefined : true
});

purrlEval.eval = session.eval;
session.eval = purrlEval;

//session.commands['.prompt'] = {
//    help : 'Change the prompt',
//    action : function (prompt) {
//        session.prompt = prompt;
//        this.displayPrompt();
//    }
//};
