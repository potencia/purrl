# P.U.R.R.L. #
#### Pretty Useful Resource Request Lackey ####

Many times when developing, testing, or learning an HTTP protocol based API, I have found myself using that wholly remarkable *nix tool, `curl`. Now, `curl` is
an immensely useful tool when it comes to seeing what is really going on at the HTTP level. I have found, nevertheless, that when I need to start making many
calls using HTTP `POST`, `PUT`, `PATCH`, or `DELETE` like when working
with a RESTful API (or an [API that isn't RESTful](http://vvv.tobiassjosten.net/development/your-api-is-not-restful/) but still uses the HTTP verbs) that `curl`
becomes too cumbersome.

Having to remember to escape the ampersand (&) on the command line, and all that typing of hand-made JSON for request bodies makes me want to stop testing:

- When testing is hard, you don't test.
- When you don't test, errors creep into your code.
- When errors creep into your code, you get fed up.
- When you get fed up, you throw your laptop through the window.
- When you throw your laptop through the window, you might hit a mobster in the head.
- When you hit a mobster in the head, you end up with your knees broken.

##### Don't end up with your knees broken. Switch to using P.U.R.R.L. today. #####

----------------------------------------------------------------------

### Installation ###

##### For use as a library #####
    npm install --save purrl

##### For use as a command-line tool #####
    npm install -g purrl

----------------------------------------------------------------------

### Basic usage as a library ###

The following is an example of basic usage. As of the time of this writing the following should create a working client for the Trello organization service.
See the [Trello API documentation](https://trello.com/docs/) for details about the API and for how to obtain a valid application key and user OAuth token.

    'use strict';

    // Create an instance of the PURRL client
    var PURRL = require('purrl');
    var purrl = new PURRL();

    // Configure the client instance:
    var result;
    purrl
        .config('protocol', 'https')      // default is 'http'
        .config('host', 'trello.com')
        .config('port', 443)              // default is 80 for 'http' and 443 for 'https'
        .config('param', 'key', /* YOUR APPLICATION KEY */)
        .config('param', 'token', /* YOUR USER OAUTH TOKEN */)
        .config('hook', 'onBody', function (context) { result = JSON.parse(context.body); });

    // Issue a GET request
    purrl(1, 'members', 'me').get();

    // ...
    // Once the HTTP request's end event is emitted
    // the onBody hook is triggered and the full body is stored in
    // the result variable.
    // ...

    console.log(result.idBoards); // prints your Trello board ids

----------------------------------------------------------------------

### Basic usage from the command line ###

Here is the same example but using the custom PURRL [REPL](http://nodejs.org/api/repl.html) and the all in once configuration technique:

    $ purrl

    purrl> purrl.config({
    ... protocol : 'https',
    ... host : 'trello.com',
    ... port : 443,
    ... param : {
    ..... key : /* YOUR APPLICATION KEY */,
    ..... token : /* YOUR USER OAUTH TOKEN */
    ..... }
    ... });
    purrl> purrl(1, 'members', 'me').get();
    purrl> var result = JSON.parse(_);
    purrl> console.log(result.idBoards); // prints your Trello board ids

A few items to note: The purrl instance is automatically instantiated for you. Special hooks are pre-registered for you that block the REPL until the
response is complete and then return the body as if it were the return value of the call. (In reality, the body is not the actual return value so a statement
like `purrl> var results = purrl('1', 'members', 'me').get();` would not set the `results` variable to the returned body (as might be expected) but would set
`results` to `undefined`. The `_` variable would still contain the returned body.

----------------------------------------------------------------------

### Detailed Documentation ###

#### Constructor ####

When called with no arguments, creates a new PURRL instance with a default configuration;

When called with a configuration object as the first argument (see the syntax of `purrl.config(options)` below), creates a new PURRL instance with the provided
configuration laid over the default configuration.

#### purrl(pathElement1[, pathElement2, pathElement3, ..., pathElementN]) -> purrl ####

The purrl object is itself a function. Parameters passed to the functional execution of the purrl instance are added to the URL path that will be used when
making requests.

    // Assume purrl.config('host', 'example.com'); was called some time before

    purrl('follow', 'the', 'yellow', 'brick', 'road').get();
    // This request is sent to
    //     http://example.com/follow/the/yellow/brick/road

After each request is sent, the path is rest to nothing.

#### purrl.header(key, value) -> purrl ####

Adds a header key / value pair for the next request. If you want a header that is persistent, set it with the `header` configuration option (see below).

    purrl.header('accept', 'application/json').get();
    // This request will have
    //     Accept: application/json
    // as one of its headers

#### purrl.noHeader(key) -> purrl ####

Suppresses a header from being sent with the next request. If you want to permanently remove a persistent header use the 'removeHeader' configuration option
(see below). This will also suppress a header previously set with `purrl.header()` for the same request.

    purrl.config('header', 'accept', 'application/json');
    purrl.get(); // Has Accept: application/json as a header
    purrl.get(); // Has Accept: application/json as a header
    purrl.noHeader('accept').get(); // Does not have the Accept header
    purrl.get(); // Has Accept: application/json as a header

#### purrl.param(key, value) -> purrl ####

Adds a query parameter key / value pair for the next request. If you want a query parameter that is persistent, set it with the 'param' configuration option (see
below).

    purrl('api').param('key', 'KEY').get();
    // This request will have use the following path
    //     /api?key=KEY

#### purrl.noParam(key) -> purrl ####

Suppresses a query parameter from being sent with the next request. If you want to permanently remove a persistent query parameter use the 'removeParam'
configuration option (see below). This will also suppress a query parameter previously set with `purrl.param()` for the same request.

    purrl.config('param', {
        key : 'KEY',
        token : 'TOKEN'
    });
    purrl('api').get(); // Path is: /api?key=KEY&token=TOKEN
    purrl('api').get(); // Path is: /api?key=KEY&token=TOKEN
    purrl('api').noParam('key').get(); // Path is: /api?token=TOKEN
    purrl('api').get(); // Path is: /api?key=KEY&token=TOKEN

#### purrl.{verb}() ####

Sends an HTTP request using the verb that matches the method name. If a body is supplied, the body is sent as the request body.

    // Assume purrl.config('host', 'example.com'); was called some time before

    purrl('api', 'accounts').get();
    // sends an HTTP GET to
    //     http://example.com/api/accounts
    // with no request body

    purrl('api', 'accounts').put('er there.');
    // sends an HTTP PUT to
    //     http://example.com/api/accounts
    // with 'er there.' as the request body

The available verb methods are:
- purrl.get([body])
- purrl.post([body])
- purrl.put([body])
- purrl.patch([body])
- purrl.delete([body])

#### purrl.config(varArgs) ####

This method is used to get or set configuration options for the PURRL instance. All configuration options set with this method are persistent and will not
change until the setting is altered by another call to the `purrl.config()`. The various argument combinations control the way options are set, updated or
retrieved.

When option settings are returned, unless otherwise specified, the value will be a copy of the real setting. This means that if you alter the returned value,
the changes will not be reflected in the real settings. In a few cases, such as the `hook` option which stores functions, the returned value will be a string
representation of the real set value.

Except for special cases, as in the `removeHook` option, when `purrl.config()` is called to set a value the return value from the call will be the `purrl`
instance allowing for function chaining.

##### purrl.config() -> options #####

Gets all options

When called with no arguments, all set configuration options are returned. Any options that are set will be included in the returned object. Any options that
are not set (whether or not they have a default) will not be included in the object.

    purrl.config();
    // depending on what is set might return something like this -> {
    //     protocol : 'https',
    //     host : 'example.com',
    //     port : 8083,
    //     header : {
    //         x-powered-by : 'Potencia, Inc.'
    //     },
    //     hook : {
    //         onBody : [
    //             'function parseBodyToJson(context) { context.body = JSON.parse(context.body); }',
    //             'function outputBody(context) { console.log(context.body); }'
    //         ]
    //     }
    // }

##### purrl.config(options) -> purrl #####

Sets multiple options

When called with a single object the properties of the object will be used to set option settings as if the `purrl.config()` method were called individually with
each of the settings. Previously set options that are not included in the options property will not be altered.

    purrl.config({
        host : 'example.com',
        port : 8083,
        header : {
            accept : 'application/json'
        }
    });

    // is functionally equivalent to

    purrl.config('host', 'example.com');
    purrl.config('port', 8083)
    purrl.config('header', {
        accept : 'application/json'
    });

    // is functionally equivalent to

    purrl.config('host', 'example.com');
    purrl.config('port', 8083)
    purrl.config('header', 'accept', 'application/json');

    // is functionally equivalent to

    purrl
        .config('host', 'example.com')
        .config('port', 8083)
        .config('header', 'accept', 'application/json');

##### purrl.config(singleValueOption) -> value #####

Gets the option value

When the option passed to this method is a single value option the return value is the value of the option.

    purrl.config('host'); // single-value option
    // depending on what is set might return -> 'example.com'

##### purrl.config(multiValueOption) -> object #####

Gets all named values from a multi-value option

When the option passed to this method is a multi-value option the return value is an object of key/value pairs for all named options that are set.

    purrl.config('header'); // multi-value option
    // depending on what is set might return something like this -> {
    //     accept : 'application/json',
    //     x-powered-by : 'Potencia, Inc.'
    // }

##### purrl.config(option, mainValue[, additionalValue1, additionalValue2, ...]) -> purrl #####

Sets the option value

For a single-value option, the value is set. If additional parameters are accepted by this option, the values passed are also used.

    purrl.config('host', 'example.com');

##### purrl.config(option, multiValueObject) -> purrl #####

Sets multiple named values of a multi-value option

For a multi-value option, the key/value pairs of the object are used to set the individual named values. Any named value that is already set, but is not
referenced in the object is left unchanged.

    purrl.config('header', {
        accept : 'application/json',
        'x-powered-by' : 'Potencia, Inc.'
    });

    // is functionally equivalent to

    purrl.config('header', 'accept', 'application/json');
    purrl.config('header', 'x-powered-by', 'Potencia, Inc.');

##### purrl.config(option, name) -> value #####

Gets the named value from a multi-value option

For a multi-value option, the named value is returned.

    purrl.config('header', 'accept');
    // depending on what is set might return -> 'application/json'

##### purrl.config(option, name, mainValue[, additionalValue1, additionalValue2, ...]) -> purrl #####

Sets the named value of a multi-value option

For a multi-value option, the named value is set.

    purrl.config('header', 'accept', 'application/json');

##### Configuration Options #####

<table>
    <thead>
        <td><b>Option</b></td>
        <td><b>Type</b></td>
        <td><b>Access</b></td>
        <td><b>Required</b></td>
        <td><b>Valid Names</b></td>
        <td><b>Valid Values</b></td>
    </thead>
    <tr>
        <td><b>protocol</b></td>
        <td>string</td>
        <td>read/write</td>
        <td>true, preset to 'http'</td>
        <td></td>
        <td>http, https</td>
    </tr>
    <tr>
        <td><b>host</b></td>
        <td>string</td>
        <td>read/write</td>
        <td>true</td>
        <td></td>
        <td></td>
    </tr>
    <tr>
        <td><b>port</b></td>
        <td>integer</td>
        <td>read/write</td>
        <td></td>
        <td></td>
        <td>1 - 65535</td>
    </tr>
    <tr>
        <td><b>header</b></td>
        <td>multi-value</td>
        <td>read/write</td>
        <td></td>
        <td>any name</td>
        <td>string values</td>
    </tr>
    <tr>
        <td></td>
        <td colspan="5">
            Values set in the header option are persistent, they are added to the request header for each request sent until they are removed (see the special
            <code>removeHeader</code> configuration option). To set a header value once for the current request use the <code>purrl.header()</code> method.
        </td>
    </tr>
    <tr>
        <td><b>removeHeader</b></td>
        <td>special</td>
        <td>write-only</td>
        <td></td>
        <td></td>
        <td>header keys</td>
    </tr>
    <tr>
        <td></td>
        <td colspan="5">
            Removes the header matching the provided key from the object containing the persistent headers.
        </td>
    </tr>
    <tr>
        <td><b>param</b></td>
        <td>multi-value</td>
        <td>read/write</td>
        <td></td>
        <td>any name</td>
        <td>string values</td>
    </tr>
    <tr>
        <td></td>
        <td colspan="5">
            Values set in the param option are persistent, they are added to the query string for each request sent until they are removed (see the special
            <code>removeParam</code> configuration option). To set a query parameter once for the current request use the <code>purrl.param()</code> method.
        </td>
    </tr>
    <tr>
        <td><b>removeParam</b></td>
        <td>special</td>
        <td>write-only</td>
        <td></td>
        <td></td>
        <td>query parameter keys</td>
    </tr>
    <tr>
        <td></td>
        <td colspan="5">
            Removes the parameter matching the provided key from the object containing the persistent query parameters.
        </td>
    </tr>
    <tr>
        <td><b>hook</b></td>
        <td>multi-value</td>
        <td>read/write</td>
        <td></td>
        <td>See the Available Hooks section below</td>
        <td>function or array of functions</td>
    </tr>
    <tr>
        <td></td>
        <td colspan="5">
            <p>
                Hooks are stored function chains that are called at predetermined times during the execution of an HTTP request. For security reasons, they are
                not allowed to be represented in JSON form. As a result of this, when setting a `hook` option, a function or array of functions must be
                provided, but when getting the value of a `hook` option, the string representation of each function in the chain will be returned.
            </p>
            <p>
                The hook option is to be used to set the entire function chain of the named hook.
                <code>purrl.config('hook', 'onBody', function onBody1() {})</code> sets <code>onBody1</code> as the sole function in the chain for the
                <code>onBody</code> hook. This replaces any previously set hooks. Likewise,
                <code>purrl.config('hook', 'onBody', [function onBody2() {}, function onBody3() {}])</code> removes any previously set functions assigned to the
                <code>onBody</code> hook and sets <code>onBody2</code> and <code>onBody3</code> in that order. See the special <code>addHook</code> and
                <code>removeHook</code> configuration options for the ability to append, insert, or remove specific functions from a hook chain.
            </p>
        </td>
    </tr>
    <tr>
        <td><b>addHook</b></td>
        <td>special</td>
        <td>write-only</td>
        <td></td>
        <td>See the Available Hooks section below</td>
        <td>function</td>
    </tr>
    <tr>
        <td></td>
        <td colspan="5">
            <p>
                This option is used to append a function to (when no index is provided) or insert a function into (when an index is provided) the array of
                functions for a named hook.
            </p>
            <pre>purrl.config('addHook', 'onBody', function appendedOnBody () {});</pre>
            <p>Appends the <code>appendedOnBody</code> function to the end of the array for the <code>onBody</code> hook</p>
            <pre>purrl.config('addHook', 'onBody', function insertedOnBody () {}, 2);</pre>
            <p>Inserts the <code>insertedOnBody</code> function at index 2 of of the array for the <code>onBody</code> hook</p>
        </td>
    </tr>
    <tr>
        <td><b>removeHook</b></td>
        <td>special</td>
        <td>write-only</td>
        <td></td>
        <td>See the Available Hooks section below</td>
        <td>index</td>
    </tr>
    <tr>
        <td></td>
        <td colspan="5">
            <p>This option is used to remove a function from the array of functions for a named hook.</p>
            <pre>purrl.config('removeHook', 'onBody', 1);</pre>
            <p>Removes the function at index 1 of the array for the <code>onBody</code> hook. This also returns the actual function (not a string
            representation) that was removed. This is useful if you desire to reorder the functions in a hook's list.</p>
        </td>
    </tr>
</table>

### Hooks ###

Hooks are stored function chains that are called at predetermined times during the execution of an HTTP request.

PURRL includes a set of hooks that provide the ability to control its execution. Each hook is passed a single context object that has several common methods as
well as properties containing data specific to that hook.

#### hookContext.cancel() ####

Stops further execution of the hook function chain.

When the `cancel()` method is called from inside a hook function, no later functions in the hook chain will be called during this hook execution. In some cases
(specified below) calling the `cancel()` method will also cause the PURRL instance to not take its normal action after the function chain is completed.

#### hookContext.getRequestContext() -> object ####

Returns an object that is empty at the start of all hook executions. This object lives through the sending of the request and receipt of the response. All data
in this object is discarded before the execution of the next request. It is a place to put data from one hook that is needed in a later hook within the
time frame of a single request/response. No data from this object is used by the base PURRL logic.

#### hookContext.getSessionContext() -> object ####

Returns an object that lives for the entire life of the client. This object is created when the client is instantiated and the data in it is never discarded. It
is a place to put data that persists from one request to the next. No data from this object is used by the base PURRL logic.

#### Available Hooks ####

##### beforeRequest #####

Called once before the HTTP request is created.

Special Context Data: none

##### onRequest #####

Called once when the HTTP request is created.

Special Context Data:

`request` : The HTTP request object that will be used to send the request to the server.

##### onRequestError #####

Called once when the request emits an `error` event. This typically only happens due to a network layer problem, such as when the server refuses the request's
connection.

Special Context Data:

`error` : The error passed to the request's `error` event callback.

##### beforeRequestBody #####

Called once before the body of the request is sent. This allows the data that is passed to the client to be altered or prepared to be sent to the server. If
`hookContext.cancel()` is called, the data will not be sent to the server.

Special Context Data:

`body` : The full set of data that will be sent as the request body. Any changes made to this `body` property will be sent to the server after this hook has
finished execution.

##### onResponse #####

Called once when the request emits the `response` event.

Special Context Data:

`response` : The response object passed to the request's `response` event callback.

##### onData #####

Called each time the response emits a `data` event. If `hookContext.cancel()` is called, the data will not be included in the response body.

Special Context Data:

`data` : The data passed to the response's `data` event callback. Any alterations to this property will be reflected in the resulting response body.

    function (context) {
        context.data = context.data.toUpperCase();
    }
    // If this function is part fo the onData hook chain, all
    // text in the response body will be force to upper case

##### onBody #####

Called once when the HTTP response object emits an `end` event.

Special Context Data:

`body` : The concatenated data from each `data` event.

----------------------------------------------------------------------

### License ###

P.U.R.R.L. is provided under the MIT License.

Copyright &copy; 2014 John P. Johnson II

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR
A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
