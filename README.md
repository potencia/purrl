# P.U.R.R.L. #
#### Pretty Useful Resource Request Lackey ####

Many times when developing, testing, or learning an HTTP protocol based API, I have found myself using that famous *nix tool, `curl`. Now, `curl` is an
immensely useful tool when it comes to seeing what is really going on at the HTTP level. I have found, nevertheless, that when I need to start making many
calls using HTTP `POST`, `PUT`, or `PATCH` like when working with a RESTful API (or an API that isn't RESTful but still uses the HTTP verbs) that curl becomes
too cumbersome.

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
        .config('query', 'key', /* YOUR APPLICATION KEY */)
        .config('query', 'token', /* YOUR USER OAUTH TOKEN */)
        .config('hook', 'onBody', function (context) { result = JSON.parse(context.body); });

    // Issue a GET request
    purrl(1, 'members', 'me').get();

    // ...
    // Once the HTTP request's end event is emitted
    // the onBody hook is triggered and the full body is stored in
    // the result variable.
    // ...

    console.log(result.boards); // prints your Trello board data

----------------------------------------------------------------------

### Basic usage from the command line ###

Here is the same example but using the custom PURRL [REPL](http://nodejs.org/api/repl.html) and the all in once configuration technique:

    $ purrl

    purrl> purrl.config({
    ... protocol : 'https',
    ... host : 'trello.com',
    ... port : 443,
    ... query : {,
    ..... key : /* YOUR APPLICATION KEY */,
    ..... token : /* YOUR USER OAUTH TOKEN */
    ..... }
    ... });
    purrl> purrl(1, 'members', 'me').get();
    purrl> var results = JSON.parse(_);
    purrl> console.log(results.boards); // prints your Trello board data

A few items to note: The purrl instance is automatically instantiated for you. The onBody hook is not needed as the default behavior of the REPL PURRL client
is to block the REPL until the response is complete and then return the body as if it were the return value of the call. (In reality, it is not the actual
return value so a statement like `purrl> var results = purrl('1', 'members', 'me').get();` would not set the `results` variable to the returned body (as might
be expected) but would set `results` to `undefined`. The `_` variable would still contain the returned body.

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
