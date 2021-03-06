# P.U.R.R.L. #
#### Pretty Useful Resource Request Lackey ####

Many times when developing, testing, or learning an HTTP protocol based API, I have found myself using that wholly remarkable *nix tool, `curl`. Now, `curl` is
an immensely useful tool when it comes to seeing what is really going on at the HTTP level. I have found, nevertheless, that when I need to start making many
calls using HTTP `POST`, `PUT`, or `DELETE` like when working with a RESTful API (or an
[API that isn't RESTful](http://vvv.tobiassjosten.net/development/your-api-is-not-restful/) but still uses the HTTP verbs) that `curl` becomes too cumbersome.

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
    purrl
        .config('protocol', 'https') // default is 'http'
        .config('host', 'trello.com') // this setting is required
        .config('port', 443) // default is 80 for 'http' and 443 for 'https'
        .config('param', 'key', /* YOUR APPLICATION KEY */)
        .config('param', 'token', /* YOUR USER OAUTH TOKEN */)
        .config('pathElement', 'me', ['members', 'me'])
        .config('pathElement', 'board', ['boards', {}])
        .config('hook', 'onBody', function (context) { context.body = JSON.parse(context.body); })
        .config('hook', 'beforePath', function (context) { context.path.unshift(1); });

    // Issue a GET request
    purrl.me.get()
    .then(function (me) {
        return purrl.board(me.idBoards[0]).get();
    })
    .then(function (myFirstBoard) {
        console.log(myFirstBoard);
    })
    .catch(function (error) {
        console.log(error);
    });

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
    ..... },
    ... pathElement : {
    ..... me : ['members', 'me'],
    ..... board : ['boards', {}]
    ..... },
    ... hook : {
    ..... beforePath : function (context) {
    ....... context.path.unshift(1);
    ....... }
    ..... }
    ... });
    purrl> purrl.me.get();
    purrl> var meJson = JSON.parse(_);
    purrl> purrl.board(meJson.idBoards[0]).get();
    purrl> var myFirstBoardJson = JSON.parse(_);
    purrl> console.log(myFirstBoardJson);

A few items to note: The purrl instance is automatically instantiated for you. Special hooks are pre-registered for you that block the REPL until the
response is complete and then return the body as if it were the return value of the call. (In reality, the body is not the actual return value so a statement
like `purrl> var results = purrl(1).me.get();` would not set the `results` variable to the returned body (as might be expected) but would set `results` to
a promise or `undefined` depending on the configuration. The `_` variable would still contain the returned body.

----------------------------------------------------------------------

### Configuration Files ###

Upon starting the REPL, if a valid configuration JSON file is provided, that file will set the configuration of multiple clients automatically. By default,
PURRL searches for the `purrl.json` file in the current working directory. If the optional minimist dependency is installed, the then configuration file can be
specified using the `-c` or `--conf` command line switches. Following is a configuration file that will prepare the same Trello client from above.

purrl.json

    {
        "trello" : {
            "protocol" : "https",
            "host" : "trello.com",
            "param" : {
                "key" : "{{{ YOUR APPLICATION KEY }}}",
                "token" : "{{{ YOUR USER OAUTH TOKEN }}}"
            },
            "pathElement" : {
                "me" : ["members", "me"],
                "board" : ["boards", {}]
            },
            "loadHooks" : "./trelloHooks.js"
        }
    }

trelloHooks.js

    exports.beforePath = function (context) {
        context.path.unshift(1);
    };

From the command line:

    $ purrl

    purrl> trello.me.get();
    purrl> var meJson = JSON.parse(_);
    purrl> trello.board(meJson.idBoards[0]).get();
    purrl> var myFirstBoardJson = JSON.parse(_);
    purrl> console.log(myFirstBoardJson);

If the JSON configuration file is named `trello.json` instead of `purrl.json` and the optional minimist dependency is installed, then the following would work

    $ purrl --conf=trello.json

    purrl> trello.me.get();
    purrl> var meJson = JSON.parse(_);
    purrl> trello.board(meJson.idBoards[0]).get();
    purrl> var myFirstBoardJson = JSON.parse(_);
    purrl> console.log(myFirstBoardJson);

If minimist is not available, then the the command line switches will have no effect, but the `purrl.json` file will still be used if present.

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

Adds a query parameter key / value pair for the next request. If you want a query parameter that is persistent, set it with the 'param' configuration option
(see below).

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

Sends an HTTP request using the HTTP method that is configured for the given verb. If a body is supplied, the body is sent as the request body. The path,
transient query parameters and transient headers are all cleared upon calling a verb method.

    // Assume purrl.config('host', 'example.com'); was called some time before

    purrl('api', 'accounts').get();
      // sends an HTTP GET to
      //     http://example.com/api/accounts
      // with no request body

    purrl('api', 'accounts').put('er there.');
      // sends an HTTP PUT to
      //     http://example.com/api/accounts
      // with 'er there.' as the request body

By default PURRL is configured with the following verb methods:
- purrl.get([body]) (HTTP GET)
- purrl.post([body]) (HTTP POST)
- purrl.put([body]) (HTTP PUT)
- purrl.delete([body]) (HTTP DELETE)

To configure new or reconfigure existing verb methods see the `verb` and `removeVerb` configuration options below.

#### purrl.toUrl() ####

Returns the URL that would have been used for a request if a verb method had been called. The path, transient query parameters and transient headers are all
cleared upon calling `purrl.toUrl()` as if a verb method had been called, but no request is sent.

    // Assume purrl.config('host', 'example.com'); was called some time
    // before and that the protocol is set to 'http'

    purrl('api').header('content-type', 'application/json').param('key', 'value').toUrl();
      // returns -> 'http://example.com/api?key=value'

    purrl.get();
      // Issues a GET request to http://example.com
      // without the header 'Content-Type'

    purrl.config('port', 8080)('api').toUrl();
      // returns -> 'http://example.com:8080/api'

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

When called with a single object the properties of the object will be used to set option settings as if the `purrl.config()` method were called individually
with each of the settings. Previously set options that are not included in the options property will not be altered.

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

#### PURRL.loadConfig(purrl, path) ####

Loads a set of configuration options from the JSON file specified by `path` and applies them to `purrl`. Not all configuration options listed below are able to
be used in a configuration loaded from JSON. See the individual options and the quick reference for which options are allowed.

config.json

    {
        "protocol" : "https",
        "noPromise" : true,
        "host" : "example.com",
        "port" : 8443,
        "param" : {
            "key" : "VALUE"
        },
        "header" : {
            "content-type" : "application/json"
        },
        "pathElement" :  {
            "acct" : ["accounts", {}],
            "allAcct" : "accounts"
        },
        "verb" : {
            "search" : "SEARCH"
        },
        "loadHooks" : "./hooks.js"
    }

hooks.js

    exports.onBody = function onBody() { return "onBody"; };

Somewhere in main.js

    PURRL.loadConfig(purrl, './config.json');
    purrl.allAcct.search(); // returns -> undefined
      // Issues SEARCH to https://example.com:8443/accounts?key=VALUE
      // with Content-Type: application/json as one of the headers
    purrl.acct(1001).get(); // returns -> undefined
      // Issues GET to https://example.com:8443/accounts/1001?key=VALUE
      // with Content-Type: application/json as one of the headers
    purrl.config('hook', 'onBody');
      // returns ['function onBody() { return "onBody"; }']

#### Configuration Options ####

##### protocol #####

Gets or sets the communication protocol used to make requests. Valid values are 'http' and 'https'. When setting the protocol, PURRL behind the scenes loads
the appropriate client for use. This option is set to 'http' by default. When the protocol is set, any previous configuration of the port is undone so that if
it is not set in the same request or a later request the protocol's default port will be used.

JSON Configuration: Allowed

    purrl.config('protocol', 'https');
    purrl.config('protocol'); // returns -> 'https'

    purrl.config({
        host : 'example.com',
        port : 8080
    }).config('protocol', 'http').toUrl();
      // returns -> http://example.com (default port 80 is not shown in the URL)
    purrl.config('port'); // returns -> undefined

    purrl.config({
        port : 8443,
        protocol : 'https'
    }).toUrl();
      // returns -> https://example.com:8443
    purrl.config('port'); // returns -> 8443

##### host #####

Gets or sets the host name to send requests to. Any string is accepted. This option must be set before calling any verb methods.

JSON Configuration: Allowed

    purrl.config('host', 'example.com');
    purrl.config('host'); // returns -> 'example.com'

##### port #####

Gets or sets the TCP port to send requests to. Integers between 1 and 65535 are accepted. If this option is not set, the default port for the configured
protocol will be used by default. Port 80 for 'http', or port 443 for 'https'.

JSON Configuration: Allowed

    purrl.config('port', -3); // error
    purrl.config('port', 8080);
    purrl.config('port'); // returns -> 8080

##### header #####

Gets or sets header key / value pairs. Strings are accepted for both header names and header values. Headers set using this option are persistent. They are
added to the request header for each request sent until they are removed (see the special `removeHeader` configuration option). To set a transient header (sent
only for the current request) use the `purrl.header()` method.

JSON Configuration: Allowed (Object form)

    purrl.config('header', {
        accept : 'application/json;text/xml;text/plain',
        'transfer-encoding' : 'utf8'
    });
    purrl.config('header', 'content-type', 'application/json');
    purrl.config('header');
      // returns -> {
      //     accept : 'application/json;text/xml;text/plain',
      //     'content-type' : 'application/json',
      //     'transfer-encoding' : 'utf8'
      // }
    purrl.config('header', 'transfer-encoding'); // returns -> 'utf8'

##### removeHeader #####

Removes a previously set header from the persistent header configuration. The header is identified by its name. It is *not* an error to attempt to remove a
persistent header that is not set.

JSON Configuration: Ignored

    // Set a header
    purrl.config('header', 'content-type', 'application/json');
    purrl.config('header', 'content-type'); // returns -> 'application/json'

    // Remove the header
    purrl.config('removeHeader', 'content-type');
    purrl.config('header', 'content-type'); // returns -> undefined

    // Remove the header (again)
    purrl.config('removeHeader', 'content-type'); // no error

##### param #####

Gets or sets query parameter key / value pairs. Strings are accepted for both keys and values. Query parameters set using this option are persistent. They are
added to the query string for each request sent until they are removed (see the special `removeParam` configuration option). To set a transient query parameter
(sent only for the current request) use the `purrl.param()` method.

JSON Configuration: Allowed (Object form)

    purrl.config('param', {
        key : 'WhoNeedsOne',
        user : 'Sherlock'
    });
    purrl.config('param', 'token', 'OfMyRespect');
    purrl.config('param');
      // returns -> {
      //     key : 'WhoNeedsOne',
      //     token : 'OfMyRespect',
      //     user : 'Sherlock'
      // }
    purrl.config('param', 'user'); // returns -> 'Sherlock'

##### removeParam #####

Removes a previously set query parameter from the persistent query parameter configuration. The query parameter is identified by its key. It is *not* an error
to attempt to remove a persistent query parameter that is not set.

JSON Configuration: Ignored

    // Set a query parameter
    purrl.config('param', 'user', 'Sherlock');
    purrl.config('param', 'user'); // returns -> 'Sherlock'

    // Remove the query parameter
    purrl.config('removeParam', 'user');
    purrl.config('param', 'user'); // returns -> undefined

    // Remove the query parameter (again)
    purrl.config('removeParam', 'user'); // no error

##### pathElement #####

Adds a custom path element property to the purrl object. Properties added using this configuration can be used to specify portions of the URL path for a
request.

JSON Configuration: Allowed (Object form, placeholders are fully supported)

    purrl.config('host', 'example.com');
    purrl.config('pathElement', 'api', 'api');
    purrl.config('pathElement', 'api'); // returns -> ['api']

    purrl.get(); // Issues a GET to http://example.com
    purrl.api.get(); // Issues a GET to http://example.com/api

The pathElement name must be a valid JavaScript property name as it will be used to create a property on the purrl object. It may be the same as an existing
pathElement property (which will result in the previous property being replaced). It cannot be the same as a property that already exists on the purrl object
but is *not* a pathElement property.

    purrl.config('host', 'example.com');
    purrl.config('pathElement', 'account', 'account');
    purrl.account.get(); // Issues a GET to http://example.com/account

    purrl.config('pathElement', 'account', ['api', 1, 'accounts']);
    purrl.account.get(); // Issues a GET to http://example.com/api/1/accounts

    // The purrl.post() verb method cannot be replaced with a pathElement property
    purrl.config('pathElement', 'post', ['api', 1, 'post']); // error

The pathElement value can be a single value, a placeholder object (see below), or an array. An array value can contain any combination of values and placeholder
objects.

    purrl.config('host', 'example.com');
    purrl.config('pathElement', 'apiV1_0', ['api', 1, 0]);

    purrl.apiV1_0.get();
      // Issues a GET to http://example.com/api/1/0

    purrl.config('pathElement', {
        apiV1_1 : ['api', 1, 1],
        people : 'people'
    });

    purrl.apiV1_1.people.get();
      // Issues a GET to http://example.com/api/1/1/people

    purrl.config('pathElement');
      // returns -> {
      //     apiV1_0 : ['api', 1, 0],
      //     apiV1_1 : ['api', 1, 1],
      //     people : ['people']

Placeholder objects are expressed as JavaScript objects in the configuration. They can be empty (`{}`) or they can have the `p` property set to a string value
(`{p : 'acct'}`). They are also allowed to have other properties, but these other properties will be ignored.

When a placeholder is empty (`{}`) it is a generic or nameless placeholder filled by the first value passed to purrl when called as a function.

    purrl.config('host', 'example.com');
    purrl.config('pathElement', 'account', ['accounts', {}]);

    purrl.account(1001).get();
      // Issues a GET to http://example.com/accounts/1001

When a placeholder has the `p` property it becomes a named placeholder. Named placeholders are filled by the property value of an object that has a property
matching the placeholder name.

    purrl.config('host', 'example.com');
    purrl.config('pathElement', {
        account : ['accounts', {p : 'acct'}],
        user : ['users', {p : 'usr'}]
    });

    purrl.account({acct : 1001}).get();
      // Issues a GET to http://example.com/accounts/1001

    purrl.account.user({
        acct : 1001,
        usr : 500
    }).get();
      // Issues a GET to http://example.com/accounts/1001/users/500

All placeholders must be filled with real values before a verb method is called otherwise an error will be thrown.

    purrl.config('host', 'example.com');
    purrl.config('pathElement', 'owner', 'owner');
    purrl.config('pathElement', 'account', 'accounts'); // Without a placeholder

    purrl.account.owner(1001).get();
      // Issues a GET to http://example.com/accounts/owner/1001
      // (the value is appended to the end of the path)

    purrl.account.get();
      // Issues a GET to http://example.com/accounts

    purrl.config('pathElement', 'account', ['accounts', {}]); // With a placeholder

    purrl.account.owner(1001).get();
      // Issues a GET to http://example.com/accounts/1001/owner
      // (the value replaces the placeholder)

    purrl.account.get();
      // error (there was no value supplied to fill the placeholder)

    // With a named placeholder
    purrl.config('pathElement', 'account', ['accounts', {p : 'acct'}]);

    purrl.account({acct : 1001}).get();
      // Issues a GET to http://example.com/accounts/1001
      // (the property value replaces the matching named placeholder)

    purrl.account(1001).get();
      // error (there was no named value supplied to fill the named placeholder)

##### removePathElement #####

Removes a custom path element from the purrl object. The custom path element is identified by its name. It is *not* an error to attempt to remove a custom path
element that is not set. If a valid property name that is not a custom path element property is supplied, the removal request is ignored.

JSON Configuration: Ignored

    // Set a custom path element
    purrl.config('host', 'example.com');
    purrl.config('pathElement', 'accounts', 'accounts');
    purrl.config('pathElement', 'accounts'); // returns -> ['accounts']

    purrl.accounts.get(); // Issues a GET to http://example.com/accounts

    // Remove the custom path element
    purrl.config('removePathElement', 'accounts');
    purrl.config('pathElement', 'accounts'); // returns -> undefined

    purrl.accounts.get();
      // error (accounts is undefined, cannot call get() method of undefined)

    // Remove the custom path element (again)
    purrl.config('removePathElement', 'accounts'); // no error

    // Incorrect name is supplied
    purrl.config('removePathElement', 'put');
      // ignored (the put() verb method is left unharmed)

##### verb #####

Adds (or replaces) a verb method on the purrl object configured with the supplied HTTP method string. Properties added using this configuration can be used to
issue HTTP requests using the configured HTTP method. This option can also be used to retrieve the currently configured HTTP method for a verb.

JSON Configuration: Allowed (Object form)

    purrl.config('host', 'example.com');
    purrl.config('verb', 'search', 'SEARCH');
    purrl.config('verb', 'search'); // returns -> 'SEARCH'

    purrl.search(); // Issues a SEARCH to http://example.com

The verb name must be a valid JavaScript method name as it will be used to create a method on the purrl object. It may be the same as an existing verb method
(which will result in the previous method being replaced). It cannot be the same as a property that already exists on the purrl object but is *not* a verb
method.

    purrl.config('host', 'example.com');
    purrl.config('verb', 'copy', 'COPY');
    purrl.copy(); // Issues a COPY to http://example.com

    purrl.get(); // Issues a GET to http://example.com
    purrl.config('verb', 'get', 'SEARCH');
    purrl.get(); // Issues a SEARCH to http://example.com

    // The purrl.header() verb method cannot be replaced with a verb method
    purrl.config('verb', 'header', 'HEAD'); // error

In order to be future compatible, PURRL allows any string to be used as the HTTP method for a verb method, no checking is performed. In order for the request to
be made correctly, however, the underlying version of node.js must support the HTTP method used. If a particular HTTP method you are trying to use is not
working as expected, the chances are that the version of node.js you are using does not support that HTTP method. As of node.js version 0.10.29, the supported
HTTP methods are as follows. PURRL makes no guarantees that any other HTTP method will actually be sent.
- CHECKOUT
- CONNECT
- COPY
- DELETE
- GET
- HEAD
- LOCK
- MERGE
- MKACTIVITY
- MKCOL
- MOVE
- MSEARCH
- NOTIFY
- OPTIONS
- PATCH
- POST
- PROPFIND
- PROPPATCH
- PURGE
- PUT
- REPORT
- SEARCH
- SUBSCRIBE
- TRACE
- UNLOCK
- UNSUBSCRIBE

##### removeVerb #####

Removes a verb method from the purrl object. The verb method is identified by its name. It is *not* an error to attempt to remove a verb method that is not set.
If a valid property name that is not a verb method is supplied, the removal request is ignored.

JSON Configuration: Ignored

    purrl.config('host', 'example.com');
    purrl.get(); // Issues a GET to http://example.com

    // Remove the verb method
    purrl.config('removeVerb', 'get');
    purrl.config('verb', 'get'); // returns -> undefined

    purrl.get();
      // error (verb method get() is undefined, cannot call an undefined method)

    // Remove the verb method
    purrl.config('removeVerb', 'get'); // no error

    // Incorrect name is supplied
    purrl.config('removeVerb', 'toUrl');
      // ignored (the toUrl() (non-verb) method is left unharmed)

##### hook #####

Hooks are stored function chains that are called at predetermined times during the execution of an HTTP request. For security reasons, they are not allowed to
be represented in JSON form. As a result of this, when setting a `hook` option, a function or array of functions must be provided, but when getting the value of
a `hook` option, the string representation of each function in the chain will be returned. The hook option sets the entire function chain of the named hook, any
previously set values are removed. See the special `addHook` and `removeHook` configuration options for the ability to append, insert, or remove specific
functions from a hook chain. See the Available Hooks section below for a list of the hooks that are supported.

JSON Configuration: Error

    purrl.config('hook', 'onBody', function onBody1() {});
      // Sets onBody1 as the sole function in the chain for the onBody hook

    purrl.config('hook', 'onBody');
      // returns -> ['function onBody1() {}'] (Note: this is a string value)

    purrl.config('hook', 'onBody', [function onBody2() {}, function onBody3() {}]);
      // Removes any previously set functions assigned to the onBody hook
      // and sets onBody2 and onBody3 in that order.

    purrl.config('hook', 'onBody');
      // returns -> [
      //     'function onBody2() {}',
      //     'function onBody3() {}'
      // ] (Note: this is an array of string values)

    purrl.config('hook', {
        onBody : function onBody4() {},
        onData : [
            function onData1() {},
            function onData2() {}
        ]
    });

    purrl.config('hook');
      // returns -> {
      //     onBody : ['function onBody4() {}'],
      //     onData : [
      //         'function onData1() {}',
      //         'function onData2() {}'
      //     ]
      // }

##### loadHooks #####

Uses the node require() function to load a module and then uses the object exported from the module to set the `hook` option.

JSON Configuration: Allowed

    /* hookModule.js */

    exports.onBody = function onBody4() {};

    exports.onData = [
        function onData1() {},
        function onData2() {},
    ];

    /* somewhere in a different module */

    purrl.config('loadHooks', './hookModule.js');
    purrl.config('hook');
      // returns -> {
      //     onBody : ['function onBody4() {}'],
      //     onData : [
      //         'function onData1() {}',
      //         'function onData2() {}'
      //     ]
      // }

##### addHook #####

Adds a hook function into the named hook chain. When an index argument is *not* provided the function is appended to the end of the chain, when an index
argument is provided the function is inserted at that position. See the Available Hooks section below for a list of the hooks that are supported.

JSON Configuration: Error

    purrl.config('hook', 'onBody', function initialOnBody() {});
    purrl.config('hook', 'onBody'); // returns -> ['function initialOnBody() {}']

    purrl.config('addHook', 'onBody', function appendedOnBody() {});
    purrl.config('hook', 'onBody');
      // returns -> [
      //     'function initialOnBody() {}',
      //     'function appendedOnBody() {}'
      // ]

    purrl.config('addHook', 'onBody', function insertedOnBody() {}, 1);
    purrl.config('hook', 'onBody');
      // returns -> [
      //     'function initialOnBody() {}',
      //     'function insertedOnBody() {}',
      //     'function appendedOnBody() {}'
      // ]

##### removeHook #####

Removes a hook function at a given index from a the named hook chain.

JSON Configuration: Error

    // Set functions in the onBody hook chain
    purrl.config('hook', 'onBody', [function onBody1() {}, function onBody2() {}]);
    purrl.config('hook', 'onBody');
      // returns -> [
      //     'function onBody1() {}',
      //     'function onBody2() {}'
      // ]

    // Remove the first function
    purrl.config('removeHook', 'onBody', 0); // -> returns [Function: onBody1] (not a string)
    purrl.config('hook', 'onBody'); // returns -> ['function onBody2() {}']

    // Remove the first function
    purrl.config('removeHook', 'onBody', -1); // -> returns [Function: onBody2] (not a string)
    purrl.config('hook', 'onBody'); // returns -> []

Unlike most of the other configuration options, `removeHook` returns the actual function that was removed, not a string representation. This is useful if you
desire to reorder the functions in a hook's list.

    // Set functions in the onBody hook chain
    purrl.config('hook', 'onBody', [function onBody1() {}, function onBody2() {}]);
    purrl.config('hook', 'onBody');
      // returns -> [
      //     'function onBody1() {}',
      //     'function onBody2() {}'
      // ]

    // Reorder the hook chain
    purrl.config('addHook', 'onBody', purrl.config('removeHook', 'onBody', -1), 0);
    purrl.config('hook', 'onBody');
      // returns -> [
      //     'function onBody2() {}',
      //     'function onBody1() {}'
      // ]

##### promise #####

Sets the promise library for returning promises from the verb methods. By default this setting is preset to the [Q library](http://documentup.com/kriskowal/q/)
which is an optional dependency so you don't need to do anything to get Q promises returned from the verb methods. If Q is not available, or if an invalid
library is used for the `promise` option, then the promise option will be unset and verb methods will return `undefined`.

JSON Configuration: Allowed (Only a library name may be used. Do not specify both `promise` and `noPromise` in the same JSON configuration.)

    purrl.config('host', 'example.com');
    purrl.config('promise', 'q'); // This isn't really needed as Q is set by default
    purrl.get().then(function (body) {
        console.log(body);
    }).catch(function (reason) {
        if (reason.code === 404) {
            console.log('Resource not found');
        }
    });

If the HTTP response code is a non error code (200 - 299), the promise is resolved with the body that is returned (and possibly modified by any `onBody` hooks.
If the response is any other code, the promise is rejected with the HTTP status code and a short description. If an error was thrown (the request or response
`error` handler was triggered) then the promise is rejected with the error passed to the handler.

    purrl.config('host', 'example.com');
    purrl.config('promise', 'q'); // This isn't really needed as Q is set by default
    purrl.get().fail(function (reason) {
        if (reason.code) {
            console.log('HTTP ' + reason.code + ': ' + reason.description);
        } else {
            console.log(reason);
        }
    });

You are allowed to provide any promise library of your choosing, or create a promise framework of your own. The required interface that must be followed by a
promise library used by PURRL is the following:

- The library is an object or a function
- The library provides the `defer()` method
- When the `defer()` method is called, a `deferred` object is returned
- All `deferred` objects must have the following characteristics
  - The object has a `promise` property
  - The object has a `resolve()` method
  - The object has a `reject()` method

If the library meets these criteria, then it can be used by PURRL as the promise library.

##### noPromise #####

Removes any set promise library from the configuration. When there is no promise library set, the verb methods return `undefined`. This option does not utilize
any arguments.

JSON Configuration: Allowed (For the JSON to be valid, you must set `noPromise` to some value. The actual value is ignored. Do not specify both `promise` and
`noPromise` in the same JSON configuration.)

    purrl.config('host', 'example.com');
    purrl.config('noPromise');
    purrl.get(); // returns -> undefined

#### Configuration Option Quick Reference ####

<table>
  <thead><td><b>Option</b></td><td><b>Type</b></td><td><b>Access</b></td><td><b>Valid Names</b></td><td><b>Valid Values</b></td>
         <td><b>Required</b></td><td><b>JSON configuration</b></td></thead>
  <tr><td><b>protocol</b></td><td>string</td><td>read/write</td><td></td><td>http, https</td><td>true, preset to 'http'</td><td>OK</td></tr>
  <tr><td><b>host</b></td><td>string</td><td>read/write</td><td></td><td></td><td>true</td><td>OK</td></tr>
  <tr><td><b>port</b></td><td>integer</td><td>read/write</td><td></td><td>1 - 65535</td><td></td><td>OK</td></tr>
  <tr><td><b>header</b></td><td>multi-value</td><td>read/write</td><td>any name</td><td>string values</td><td></td><td>OK</td></tr>
  <tr><td><b>removeHeader</b></td><td>special</td><td>write-only</td><td></td><td>header keys</td><td></td><td>Ignored</td></tr>
  <tr><td><b>param</b></td><td>multi-value</td><td>read/write</td><td>any name</td><td>string values</td><td></td><td>OK</td></tr>
  <tr><td><b>removeParam</b></td><td>special</td><td>write-only</td><td></td><td>query parameter keys</td><td></td><td>Ignored</td></tr>
  <tr><td><b>pathElement</b></td><td>multi-value</td><td>read/write</td><td>Any valid, non-conflicting property name</td>
      <td>value, placeholder or array of values and placeholders</td><td></td><td>OK</td></tr>
  <tr><td><b>removePathElement</b></td><td>special</td><td>write-only</td><td></td><td>path element property names</td><td></td><td>Ignored</td></tr>
  <tr><td><b>verb</b></td><td>multi-value</td><td>read/write</td><td>Any valid, non-conflicting method name</td><td>HTTP method string</td><td></td>
      <td>OK</td></tr>
  <tr><td><b>removeVerb</b></td><td>special</td><td>write-only</td><td></td><td>verb method names</td><td></td><td>Ignored</td></tr>
  <tr><td><b>hook</b></td><td>multi-value</td><td>read/write</td><td>See the Available Hooks section below</td><td>function or array of functions</td>
      <td></td><td>Error</td></tr>
  <tr><td><b>loadHooks</b></td><td>special</td><td>write-only</td><td></td><td>valid module path</td><td></td><td>OK</td></tr>
  <tr><td><b>addHook</b></td><td>special</td><td>write-only</td><td>See the Available Hooks section below</td><td>function, optional index</td><td></td>
      <td>Error</td></tr>
  <tr><td><b>removeHook</b></td><td>special</td><td>write-only</td><td>See the Available Hooks section below</td><td>index</td><td></td><td>Error</td></tr>
  <tr><td><b>promise</b></td><td>string or instantiated library</td><td>read/write</td><td></td><td>valid promise libraries</td><td></td><td>OK</td></tr>
  <tr><td><b>noPromise</b></td><td>special</td><td>write-only</td><td></td><td></td><td></td><td>OK</td></tr>
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

##### beforePath #####

Called once before the path segments are URL encoded and joined together.

Special Context Data:

`path` : The array of path segments that will be URL encoded and joined to form the request path.
Any changes to this property will be reflected in the URL path.

##### beforeRequest #####

Called once before the HTTP request is created.

Special Context Data: none

##### onRequest #####

Called once when the HTTP request is created.

Special Context Data:

`request` : The HTTP request object that will be used to send the request to the server.

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

##### onResponseError #####

Called when the response emits an `error` event or when the `promise` option is set and the the response has a non-success code.

Special Context Data:

`error` : The error from the `error` event or an object with the status code and description when fired on a non-success response code.

##### onData #####

Called each time the response emits a `data` event. If `hookContext.cancel()` is called, the data will not be included in the response body.

Special Context Data:

`data` : The data passed to the response's `data` event callback. Any alterations to this property will be reflected in the resulting response body.

    function (context) { context.data = context.data.toUpperCase(); }
      // If this function is part fo the onData hook chain, all
      // text in the response body will be force to upper case

##### onBody #####

Called once when the HTTP response object emits an `end` event.

Special Context Data:

`body` : The concatenated data from each `data` event. Any alterations to this property will be reflected in the value used to resolve the promise returned from
the verb method.

##### onRequestError #####

Called once when the request emits an `error` event. This typically only happens due to a network layer problem, such as when the server refuses the request's
connection.

Special Context Data:

`error` : The error passed to the request's `error` event callback.

#### Hooks Quick Reference ####

<table>
  <thead><td><b>Hook</b></td><td><b>Special Context Data</b></td><td><b>PURRL obeys <code>cancel()</code></b></td><td><b>Order</b></td></thead>
  <tr><td><b>beforePath</b></td><td><code>path</code></td><td></td><td>0</td></tr>
  <tr><td><b>beforeRequest</b></td><td></td><td></td><td>1</td></tr>
  <tr><td><b>onRequest</b></td><td><code>request</code></td><td></td><td>2</td></tr>
  <tr><td><b>beforeRequestBody</b></td><td><code>body</code></td><td>true</td><td>3</td></tr>
  <tr><td><b>onResponse</b></td><td><code>response</code></td><td></td><td>4</td></tr>
  <tr><td><b>onResponseError</b></td><td><code>error</code></td><td></td><td>N/A</td></tr>
  <tr><td><b>onData</b></td><td><code>data</code></td><td>true</td><td>5</td></tr>
  <tr><td><b>onBody</b></td><td><code>body</code></td><td></td><td>6</td></tr>
  <tr><td><b>onRequestError</b></td><td><code>error</code></td><td></td><td>N/A</td></tr>
</table>

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
