'use strict';

var expect = require('chai').expect,
sinon = require('sinon'),
PURRL = require('./index');

describe('PURRL', function () {
    var purrl;
    beforeEach(function () {
        purrl = new PURRL();
    });

    describe('when called as a function', function () {
        it('should return the purrl object', function () {
            expect(purrl('path', 'part')).to.equal(purrl);
        });

        it('should append each value as a string to the internal [ path ] array', function () {
            purrl(1, 'part', 'of', 'the', {toString : function () { return 'path'; }});
            expect(purrl[' internal'].path).to.deep.equal(['1', 'part', 'of', 'the', 'path']);
        });
    });

    describe('.config()', function () {
        beforeEach(function () {
            purrl.config('hook', 'onRequestError', []);
            purrl.config('hook', 'onRequest', []);
            purrl.config('hook', 'beforeRequestBody', []);
            purrl.config('hook', 'onResponse', []);
            purrl.config('hook', 'onBody', []);
        });

        describe('when called with no arguments', function () {
            it('should return an object with a copy of the current configuration', function () {
                expect(purrl.config()).to.deep.equal({
                    protocol : 'http'
                });
                purrl
                .config('protocol', 'https')
                .config('host', 'example.com')
                .config('param', {
                    key : 'KEY',
                    token : 'TOKEN'
                });
                expect(purrl.config()).to.deep.equal({
                    protocol : 'https',
                    host : 'example.com',
                    param : {
                        key : 'KEY',
                        token : 'TOKEN'
                    }
                });
                expect(purrl.config().param).to.not.equal(purrl[' internal'].param);
            });
        });

        describe('when called with a configuration object', function () {
            it('should return the purrl object', function () {
                expect(purrl.config({})).to.equal(purrl);
            });

            it('should set all options in the object', function () {
                expect(purrl.config({
                    protocol : 'https',
                    host : 'example.com'
                }).config()).to.deep.equal({
                    protocol : 'https',
                    host : 'example.com'
                });
            });

            describe('when some of the items in the object are invalid', function () {
                it('should throw an error on the first unsupported configuration', function () {
                    try {
                        purrl.config({
                            protocol : 'http',
                            wazIsConfigThingy : 'someSetting'
                        });
                        expect(true, 'An error should have been thrown').to.be.false;
                    } catch (error) {
                        expect(error).to.be.an.instanceOf(Error);
                        expect(error.message).to.equal('The configuration option [ wazIsConfigThingy ] is not supported.');
                    }
                });

                it('should throw an error on the first invalid value', function () {
                    try {
                        purrl.config({
                            protocol : 'http',
                            port : 52.89
                        });
                        expect(true, 'An error should have been thrown').to.be.false;
                    } catch (error) {
                        expect(error).to.be.an.instanceOf(Error);
                        expect(error.message).to.equal('The value [ 52.89 ] is not a valid port number.');
                    }
                });
            });
        });

        describe('when called with neither an option name or a configuration object', function () {
            it('should throw an error', function () {
                try {
                    purrl.config([]);
                    expect(true, 'An error should have been thrown').to.be.false;
                } catch (error) {
                    expect(error).to.be.an.instanceOf(Error);
                    expect(error.message).to
                    .equal('The [ config() ] method must be provided an [ option ] name with the correct settings or a configuration object.');
                }
            });
        });

        describe('when called with an unsupported configuration option', function () {
            it('should throw an error', function () {
                try {
                    purrl.config('wazIsConfigThingy');
                    expect(true, 'An error should have been thrown').to.be.false;
                } catch (error) {
                    expect(error).to.be.an.instanceOf(Error);
                    expect(error.message).to.equal('The configuration option [ wazIsConfigThingy ] is not supported.');
                }
            });
        });

        describe('option [ protocol ]', function () {
            describe('when passed no setting', function () {
                it('should return the current setting', function () {
                    expect(purrl.config('protocol')).to.equal('http');
                });
            });

            describe('when passed an invalid setting', function () {
                it('should throw an error', function () {
                    try {
                        purrl.config('protocol', 'SPEEDY');
                        expect(true, 'An error should have been thrown').to.be.false;
                    } catch (error) {
                        expect(error).to.be.an.instanceOf(Error);
                        expect(error.message).to.equal('The [ SPEEDY ] protocol is not supported.');
                    }
                });
            });

            describe('when passed a valid setting', function () {
                it('should return the purrl object', function () {
                    expect(purrl.config('protocol', 'https')).to.equal(purrl);
                });

                it('should update the configuration', function () {
                    expect(purrl.config('protocol', 'https').config('protocol')).to.equal('https');
                });
            });
        });

        describe('option [ host ]', function () {
            describe('when passed no setting', function () {
                it('should return the current setting', function () {
                    expect(purrl.config('host')).to.be.undefined;
                    purrl.config('host', 'example.com');
                    expect(purrl.config('host')).to.equal('example.com');
                });
            });

            describe('when passed a non-string setting', function () {
                it('should throw an error', function () {
                    try {
                        purrl.config('host', 5);
                        expect(true, 'An error should have been thrown').to.be.false;
                    } catch (error) {
                        expect(error).to.be.an.instanceOf(Error);
                        expect(error.message).to.equal('The value [ 5 ] is invalid for host. It must be a string.');
                    }
                });
            });

            describe('when passed a valid setting', function () {
                it('should return the purrl object', function () {
                    expect(purrl.config('host', 'example.com')).to.equal(purrl);
                });

                it('should update the configuration', function () {
                    expect(purrl.config('host', 'example.com').config('host')).to.equal('example.com');
                });
            });
        });

        describe('option [ port ]', function () {
            describe('when passed no setting', function () {
                it('should return the current setting', function () {
                    expect(purrl.config('port')).to.be.undefined;
                    purrl.config('port', 42);
                    expect(purrl.config('port')).to.equal(42);
                });
            });

            describe('when passed an invalid setting', function () {
                it('should throw an error for too small a port', function () {
                    try {
                        purrl.config('port', 0);
                        console.dir(purrl.config('port'));
                        expect(true, 'An error should have been thrown').to.be.false;
                    } catch (error) {
                        expect(error).to.be.an.instanceOf(Error);
                        expect(error.message).to.equal('The value [ 0 ] is not a valid port number.');
                    }
                });

                it('should throw an error for too large a port', function () {
                    try {
                        purrl.config('port', 65536);
                        console.dir(purrl.config('port'));
                        expect(true, 'An error should have been thrown').to.be.false;
                    } catch (error) {
                        expect(error).to.be.an.instanceOf(Error);
                        expect(error.message).to.equal('The value [ 65536 ] is not a valid port number.');
                    }
                });

                it('should throw an error for non-integer', function () {
                    try {
                        purrl.config('port', '56.4');
                        console.dir(purrl.config('port'));
                        expect(true, 'An error should have been thrown').to.be.false;
                    } catch (error) {
                        expect(error).to.be.an.instanceOf(Error);
                        expect(error.message).to.equal('The value [ 56.4 ] is not a valid port number.');
                    }
                });
            });

            describe('when passed a valid setting', function () {
                it('should accept [ 1 ]', function () {
                    expect(purrl.config('port', 1)).to.equal(purrl);
                });

                it('should accept [ 65535 ]', function () {
                    expect(purrl.config('port', 65535)).to.equal(purrl);
                });

                it('should return the purrl object', function () {
                    expect(purrl.config('port', 42)).to.equal(purrl);
                });

                it('should update the configuration', function () {
                    expect(purrl.config('port', 42).config('port')).to.equal(42);
                });

                it('should convert string input to number', function () {
                    expect(purrl.config('port', '42').config('port')).to.equal(42);
                });
            });
        });

        describe('option [ param ]', function () {
            describe('when passed no setting', function () {
                it('should return a copy of the currently set permanent query parameters', function () {
                    expect(purrl.config('param')).to.deep.equal({});
                    expect(purrl.config('param')).to.not.equal(purrl[' internal'].param);
                });
            });

            describe('when passed neither a key name or a param object', function () {
                it('should throw an error', function () {
                    try {
                        purrl.config('param', []);
                        expect(true, 'An error should have been thrown').to.be.false;
                    } catch (error) {
                        expect(error).to.be.an.instanceOf(Error);
                        expect(error.message).to.equal('The param setting must be [ key ] and [ value ] or a [ param ] object.');
                    }
                });
            });

            describe('when passed a key name without a value', function () {
                it('should return the value of the key', function () {
                    expect(purrl.config('param', 'key')).to.be.undefined;
                    expect(purrl.config('param', 'key', 'KEY').config('param', 'key')).to.equal('KEY');
                });
            });

            describe('when passed a valid key / value pair', function () {
                it('should return the purrl object', function () {
                    expect(purrl.config('param', 'key', 'KEY')).to.deep.equal(purrl);
                });

                it('should add the key / value pair to the the configuration', function () {
                    expect(purrl.config('param', 'key', 'KEY').config('param')).to.deep.equal({
                        key : 'KEY'
                    });
                    expect(purrl.config('param', 'token', 'TOKEN').config('param')).to.deep.equal({
                        key : 'KEY',
                        token : 'TOKEN'
                    });
                });
            });

            describe('when passed a valid object setting', function () {
                it('should return the purrl object', function () {
                    expect(purrl.config('param', {
                        key : 'KEY',
                        token : 'TOKEN'
                    })).to.equal(purrl);
                });

                it('should add the key / value pairs to the param configuration', function () {
                    purrl.config('param', 'other', 'OTHER');
                    expect(purrl.config('param', {
                        key : 'KEY',
                        token : 'TOKEN'
                    }).config('param')).to.deep.equal({
                        key : 'KEY',
                        token : 'TOKEN',
                        other : 'OTHER'
                    });
                });
            });
        });

        describe('option [ removeParam ]', function () {
            describe('when passed no param key', function () {
                it('should throw an error', function () {
                    try {
                        purrl.config('removeParam');
                        expect(true, 'An error should have been thrown').to.be.false;
                    } catch (error) {
                        expect(error).to.be.an.instanceOf(Error);
                        expect(error.message).to.equal('The removeParam setting must be passed a param key [ string ]');
                    }
                });
            });

            describe('when passed a param key', function () {
                it('should return the purrl object', function () {
                    expect(purrl.config('removeParam', 'token')).to.equal(purrl);
                });

                it('should remove query parameter from the object of persistent query parameters', function () {
                    purrl.config('param', {
                        key : 'KEY',
                        token : 'TOKEN'
                    });
                    purrl.config('removeParam', 'token');
                    expect(purrl.config('param')).to.deep.equal({key : 'KEY'});
                    purrl.config('removeParam', 'token');
                    expect(purrl.config('param')).to.deep.equal({key : 'KEY'});
                    purrl.config('removeParam', 'key');
                    expect(purrl.config('param')).to.deep.equal({});
                    purrl.config('removeParam', 'key');
                    expect(purrl.config('param')).to.deep.equal({});
                });
            });
        });

        describe('option [ header ]', function () {
            describe('when passed no setting', function () {
                it('should return a copy of the currently set permanent query parameters', function () {
                    expect(purrl.config('header')).to.deep.equal({});
                    expect(purrl.config('header')).to.not.equal(purrl[' internal'].header);
                });
            });

            describe('when passed neither a key name or a header object', function () {
                it('should throw an error', function () {
                    try {
                        purrl.config('header', []);
                        expect(true, 'An error should have been thrown').to.be.false;
                    } catch (error) {
                        expect(error).to.be.an.instanceOf(Error);
                        expect(error.message).to.equal('The header setting must be [ key ] and [ value ] or a [ header ] object.');
                    }
                });
            });

            describe('when passed a key name without a value', function () {
                it('should return the value of the key', function () {
                    expect(purrl.config('header', 'accept')).to.be.undefined;
                    expect(purrl.config('header', 'accept', 'application/json').config('header', 'accept')).to.equal('application/json');
                });
            });

            describe('when passed a valid key / value pair', function () {
                it('should return the purrl object', function () {
                    expect(purrl.config('header', 'accept', 'application/json')).to.deep.equal(purrl);
                });

                it('should add the key / value pair to the the configuration', function () {
                    expect(purrl.config('header', 'accept', 'application/json').config('header')).to.deep.equal({
                        accept : 'application/json'
                    });
                    expect(purrl.config('header', 'content-type', 'application/json').config('header')).to.deep.equal({
                        accept : 'application/json',
                        'content-type' : 'application/json'
                    });
                });
            });

            describe('when passed a valid object setting', function () {
                it('should return the purrl object', function () {
                    expect(purrl.config('header', {
                        accept : 'application/json',
                        'content-type' : 'application/json'
                    })).to.equal(purrl);
                });

                it('should add the key / value pairs to the header configuration', function () {
                    purrl.config('header', 'content-length', 1024);
                    expect(purrl.config('header', {
                        accept : 'application/json',
                        'content-type' : 'application/json'
                    }).config('header')).to.deep.equal({
                        accept : 'application/json',
                        'content-type' : 'application/json',
                        'content-length' : 1024
                    });
                });
            });
        });

        describe('option [ removeHeader ]', function () {
            describe('when passed no header key', function () {
                it('should throw an error', function () {
                    try {
                        purrl.config('removeHeader');
                        expect(true, 'An error should have been thrown').to.be.false;
                    } catch (error) {
                        expect(error).to.be.an.instanceOf(Error);
                        expect(error.message).to.equal('The removeHeader setting must be passed a header key [ string ]');
                    }
                });
            });

            describe('when passed a header key', function () {
                it('should return the purrl object', function () {
                    expect(purrl.config('removeHeader', 'accept')).to.equal(purrl);
                });

                it('should remove header from the object of persistent headers', function () {
                    purrl.config('header', {
                        accepts : 'application/json',
                        'content-type' : 'application/json'
                    });
                    purrl.config('removeHeader', 'accepts');
                    expect(purrl.config('header')).to.deep.equal({'content-type' : 'application/json'});
                    purrl.config('removeHeader', 'accepts');
                    expect(purrl.config('header')).to.deep.equal({'content-type' : 'application/json'});
                    purrl.config('removeHeader', 'content-type');
                    expect(purrl.config('header')).to.deep.equal({});
                    purrl.config('removeHeader', 'content-type');
                    expect(purrl.config('header')).to.deep.equal({});
                });
            });
        });

        function onBody () { return 'body'; }
        function onData1 () { return 1 + 1; }
        function onData2 () { return 2 + 2; }
        function onData3 () { return 3 + 3; }
        function onData4 () { return 4 + 4; }
        function onData5 () { return 5 + 5; }
        function onData6 () { return 6 + 6; }
        function onData7 () { return 7 + 7; }
        function onData8 () { return 8 + 8; }

        describe('option [ hook ]', function () {
            describe('when passed no setting', function () {
                it('should return the current setting', function () {
                    expect(purrl.config('hook')).to.deep.equal({});
                    purrl.config('hook', {
                        onBody : [onBody],
                        onData : onData1
                    });
                    expect(purrl.config('hook')).to.deep.equal({
                        onBody : [
                            'function onBody() { return \'body\'; }'
                        ],
                        onData : [
                            'function onData1() { return 1 + 1; }'
                        ]
                    });
                });
            });

            describe('when passed an invalid key', function () {
                it('should throw an error', function () {
                    try {
                        purrl.config('hook', []);
                        expect(true, 'An error should have been thrown').to.be.false;
                    } catch (error) {
                        expect(error).to.be.an.instanceOf(Error);
                        expect(error.message).to.equal(
                        'The hook setting must be a recognized [ key ] with either a [ function ] or an [ array ] of functions or a [ hook ] object.');
                    }
                });
            });

            describe('when passed an invalid hook name', function () {
                it('should throw an error', function () {
                    try {
                        purrl.config('hook', 'notAHook');
                        expect(true, 'An error should have been thrown').to.be.false;
                    } catch (error) {
                        expect(error).to.be.an.instanceOf(Error);
                        expect(error.message).to.equal('Unrecognized hook name [ notAHook ]');
                    }
                });
            });

            describe('when passed a key name without a value', function () {
                it('should return the list of functions for that hook', function () {
                    expect(purrl.config('hook', 'onData')).to.deep.equal([]);
                    expect(purrl.config('hook', 'onData', onData1).config('hook', 'onData')).to.deep.equal(['function onData1() { return 1 + 1; }']);
                });
            });

            describe('when passed a valid key and a function value', function () {
                it('should return the purrl object', function () {
                    expect(purrl.config('hook', 'onData', onData1)).to.equal(purrl);
                });

                it('should update the configuration', function () {
                    expect(purrl.config('hook', 'onData', onData1).config('hook', 'onData')).to.deep.equal(['function onData1() { return 1 + 1; }']);
                });
            });

            describe('when passed a valid key and an [ array ] of all [ function ] values', function () {
                it('should return the purrl object', function () {
                    expect(purrl.config('hook', 'onData', onData1)).to.equal(purrl);
                });

                it('should update the configuration', function () {
                    expect(purrl.config('hook', 'onData', [onData1, onData2])
                    .config('hook', 'onData')).to.deep.equal(['function onData1() { return 1 + 1; }', 'function onData2() { return 2 + 2; }']);
                });
            });

            describe('when passed a valid key and an [ array ] of mixed values', function () {
                it('should throw an error', function () {
                    try {
                        purrl.config('hook', 'onData', [onData1, true]);
                        expect(true, 'An error should have been thrown').to.be.false;
                    } catch (error) {
                        expect(error).to.be.an.instanceOf(Error);
                        expect(error.message).to.equal(
                        'Error setting hook named [ onData ]. The value must be either a [ function ] or an [ array ] of functions.');
                    }
                });
            });

            describe('when passed a valid key and an invalid value', function () {
                it('should throw an error', function () {
                    try {
                        purrl.config('hook', 'onData', true);
                        expect(true, 'An error should have been thrown').to.be.false;
                    } catch (error) {
                        expect(error).to.be.an.instanceOf(Error);
                        expect(error.message).to.equal(
                        'Error setting hook named [ onData ]. The value must be either a [ function ] or an [ array ] of functions.');
                    }
                });
            });

            describe('when passed a valid object setting', function () {
                it('should return the purrl object', function () {
                    expect(purrl.config('hook', {})).to.equal(purrl);
                    expect(purrl.config('hook', {
                        onData : onData1,
                        onBody : onBody
                    })).to.equal(purrl);
                });

                it('should update the configuration', function () {
                    purrl.config('hook', 'onData', onData4);
                    expect(purrl.config('hook', {
                        onBody : onBody
                    }).config('hook')).to.deep.equal({
                        onBody : ['function onBody() { return \'body\'; }'],
                        onData : ['function onData4() { return 4 + 4; }']
                    });
                    expect(purrl.config('hook', {
                        onData : [onData2, onData3]
                    }).config('hook', 'onData')).to.deep.equal(['function onData2() { return 2 + 2; }', 'function onData3() { return 3 + 3; }']);
                });
            });
        });

        describe('option [ addHook ]', function () {
            describe('when passed no hookName', function () {
                it('should throw an error', function () {
                    try {
                        purrl.config('addHook');
                        expect(true, 'An error should have been thrown').to.be.false;
                    } catch (error) {
                        expect(error).to.be.an.instanceOf(Error);
                        expect(error.message).to.equal(
                        'The addHook setting must be passed a hookName [ string ], a value [ function ], and an optional index [ integer ]');
                    }
                });
            });

            describe('when passed no value', function () {
                it('should throw an error', function () {
                    try {
                        purrl.config('addHook', 'onData');
                        expect(true, 'An error should have been thrown').to.be.false;
                    } catch (error) {
                        expect(error).to.be.an.instanceOf(Error);
                        expect(error.message).to.equal(
                        'The addHook setting must be passed a hookName [ string ], a value [ function ], and an optional index [ integer ]');
                    }
                });
            });

            describe('when passed an invalid hookName', function () {
                it('should throw an error', function () {
                    try {
                        purrl.config('addHook', 'notAHook', function () {});
                        expect(true, 'An error should have been thrown').to.be.false;
                    } catch (error) {
                        expect(error).to.be.an.instanceOf(Error);
                        expect(error.message).to.equal('Unrecognized hook name [ notAHook ]');
                    }
                });
            });

            describe('when passed a valid hookName and function', function () {
                it('should return the purrl object', function () {
                    expect(purrl.config('addHook', 'onData', onData1)).to.equal(purrl);
                });

                it('should append the function to the hookName\'s list', function () {
                    purrl.config('addHook', 'onData', onData1);
                    expect(purrl.config('hook', 'onData')).to.deep.equal(['function onData1() { return 1 + 1; }']);
                    purrl.config('addHook', 'onData', onData2);
                    expect(purrl.config('hook', 'onData')).to.deep.equal(['function onData1() { return 1 + 1; }', 'function onData2() { return 2 + 2; }']);
                });
            });

            describe('when passed a valid hookName and function and an invalid index', function () {
                it('should throw an error', function () {
                    try {
                        purrl.config('addHook', 'onData', onData1, 56.23);
                        expect(true, 'An error should have been thrown').to.be.false;
                    } catch (error) {
                        expect(error).to.be.an.instanceOf(Error);
                        expect(error.message).to.equal('The addHook index value is invalid.');
                    }
                });
            });

            describe('when passed a valid hookName, function, and index', function () {
                it('should return the purrl object', function () {
                    expect(purrl.config('addHook', 'onData', onData1, 0)).to.equal(purrl);
                });

                it('should insert the function in the hookName\'s list', function () {
                    purrl.config('hook', 'onData', [onData1, onData2, onData3]);
                    purrl.config('addHook', 'onData', onData4, 0);
                    expect(purrl.config('hook', 'onData')).to.deep.equal([
                        'function onData4() { return 4 + 4; }',
                        'function onData1() { return 1 + 1; }',
                        'function onData2() { return 2 + 2; }',
                        'function onData3() { return 3 + 3; }'
                    ]);
                    purrl.config('addHook', 'onData', onData5, 2);
                    expect(purrl.config('hook', 'onData')).to.deep.equal([
                        'function onData4() { return 4 + 4; }',
                        'function onData1() { return 1 + 1; }',
                        'function onData5() { return 5 + 5; }',
                        'function onData2() { return 2 + 2; }',
                        'function onData3() { return 3 + 3; }'
                    ]);
                    purrl.config('addHook', 'onData', onData6, 5);
                    expect(purrl.config('hook', 'onData')).to.deep.equal([
                        'function onData4() { return 4 + 4; }',
                        'function onData1() { return 1 + 1; }',
                        'function onData5() { return 5 + 5; }',
                        'function onData2() { return 2 + 2; }',
                        'function onData3() { return 3 + 3; }',
                        'function onData6() { return 6 + 6; }'
                    ]);
                    purrl.config('addHook', 'onData', onData7, 100);
                    expect(purrl.config('hook', 'onData')).to.deep.equal([
                        'function onData4() { return 4 + 4; }',
                        'function onData1() { return 1 + 1; }',
                        'function onData5() { return 5 + 5; }',
                        'function onData2() { return 2 + 2; }',
                        'function onData3() { return 3 + 3; }',
                        'function onData6() { return 6 + 6; }',
                        'function onData7() { return 7 + 7; }'
                    ]);
                    purrl.config('addHook', 'onData', onData8, -2);
                    expect(purrl.config('hook', 'onData')).to.deep.equal([
                        'function onData4() { return 4 + 4; }',
                        'function onData1() { return 1 + 1; }',
                        'function onData5() { return 5 + 5; }',
                        'function onData2() { return 2 + 2; }',
                        'function onData3() { return 3 + 3; }',
                        'function onData8() { return 8 + 8; }',
                        'function onData6() { return 6 + 6; }',
                        'function onData7() { return 7 + 7; }'
                    ]);
                });
            });
        });

        describe('option [ removeHook ]', function () {
            describe('when passed no hookName', function () {
                it('should throw an error', function () {
                    try {
                        purrl.config('removeHook');
                        expect(true, 'An error should have been thrown').to.be.false;
                    } catch (error) {
                        expect(error).to.be.an.instanceOf(Error);
                        expect(error.message).to.equal('The removeHook setting must be passed a hookName [ string ] and an index [ integer ]');
                    }
                });
            });

            describe('when passed an invalid hookName', function () {
                it('should throw an error', function () {
                    try {
                        purrl.config('removeHook', 'notAHook', function () {});
                        expect(true, 'An error should have been thrown').to.be.false;
                    } catch (error) {
                        expect(error).to.be.an.instanceOf(Error);
                        expect(error.message).to.equal('Unrecognized hook name [ notAHook ]');
                    }
                });
            });

            describe('when passed a valid hookName and index', function () {
                it('should return the function that was removed', function () {
                    purrl.config('addHook', 'onData', onData1);
                    expect(purrl.config('removeHook', 'onData', 0)).to.equal(onData1);
                });

                it('should remove the function at the index of the hookName\'s list', function () {
                    purrl.config('hook', 'onData', [onData1, onData2, onData3]);
                    purrl.config('removeHook', 'onData', -2);
                    expect(purrl.config('hook', 'onData')).to.deep.equal([
                        'function onData1() { return 1 + 1; }',
                        'function onData3() { return 3 + 3; }'
                    ]);
                    purrl.config('removeHook', 'onData', 1);
                    expect(purrl.config('hook', 'onData')).to.deep.equal([
                        'function onData1() { return 1 + 1; }'
                    ]);
                    purrl.config('removeHook', 'onData', 0);
                    expect(purrl.config('hook', 'onData')).to.deep.equal([]);
                });
            });

            describe('when passed a valid hookName and an invalid index', function () {
                it('should throw an error', function () {
                    try {
                        purrl.config('removeHook', 'onData', 56.23);
                        expect(true, 'An error should have been thrown').to.be.false;
                    } catch (error) {
                        expect(error).to.be.an.instanceOf(Error);
                        expect(error.message).to.equal('The removeHook index value is invalid.');
                    }
                });
            });

            describe('when passed a valid hookName and valid index but the index does not match a item in the list', function () {
                it('should throw an error', function () {
                    purrl.config('hook', 'onData', [onData1, onData2]);
                    try {
                        purrl.config('removeHook', 'onData', 100);
                        expect(true, 'An error should have been thrown').to.be.false;
                    } catch (error) {
                        expect(error).to.be.an.instanceOf(Error);
                        expect(error.message).to.equal('The removeHook index does not match an item in the list.');
                    }
                });
            });
        });
    });

    describe('static .hook()', function () {
        var order, fakeHook1, fakeHook2;
        beforeEach(function () {
            order = [];
            fakeHook1 = function () { order.push(1); };
            fakeHook2 = function () { order.push(2); };
            fakeHook1 = sinon.spy(fakeHook1);
            fakeHook2 = sinon.spy(fakeHook2);
            purrl.config('hook', 'onData', [fakeHook1, fakeHook2]);
        });

        describe('when called with an invalid hook name', function () {
            it('should throw an error', function () {
                try {
                    PURRL.hook(purrl, 'notAHook');
                    expect(true, 'An error should have been thrown').to.be.false;
                } catch (error) {
                    expect(error).to.be.an.instanceOf(Error);
                    expect(error.message).to.equal('Unrecognized hook name [ notAHook ]');
                }
            });
        });

        it('call each function in the hook\'s list in order', function () {
            PURRL.hook(purrl, 'onData');
            expect(fakeHook1.callCount).to.equal(1);
            expect(fakeHook2.callCount).to.equal(1);
            expect(order).to.deep.equal([1, 2]);
        });

        it('should return the hookContext', function () {
            var returned = PURRL.hook(purrl, 'onData');
            expect(returned).to.equal(fakeHook1.firstCall.args[0]);
        });

        it('should count the number of hook functions called', function () {
            expect(PURRL.hook(purrl, 'onData').executed).to.equal(2);
        });

        it('should succeed when there are no hooks for the called name', function () {
            purrl.config('hook', 'onData', []);
            expect(PURRL.hook(purrl, 'onData').executed).to.equal(0);
        });

        describe('when a context object is NOT provided', function () {
            it('should pass an empty context object to each hook', function () {
                PURRL.hook(purrl, 'onData');
                expect(Object.keys(fakeHook1.firstCall.args[0])).to.have.length(0);
                expect(Object.keys(fakeHook2.firstCall.args[0])).to.have.length(0);
            });
        });

        describe('when a context object is provided', function () {
            it('should attach each property of the passed context object to the context object passed to each hook', function () {
                var context = {
                    one : {
                        val : 'one'
                    },
                    two : {
                        val : 'two'
                    }
                };
                PURRL.hook(purrl, 'onData', context);
                expect(fakeHook1.firstCall.args[0]).to.not.equal(context);
                expect(fakeHook1.firstCall.args[0]).to.have.keys(Object.keys(context));
                expect(fakeHook1.firstCall.args[0].one).to.equal(context.one);
                expect(fakeHook1.firstCall.args[0].two).to.equal(context.two);
                expect(fakeHook2.firstCall.args[0]).to.not.equal(context);
                expect(fakeHook2.firstCall.args[0]).to.have.keys(Object.keys(context));
                expect(fakeHook2.firstCall.args[0].one).to.equal(context.one);
                expect(fakeHook2.firstCall.args[0].two).to.equal(context.two);
            });
        });

        describe('hook context object', function () {
            describe('.cancel()', function () {
                it('should cancel execution of later hooks in the chain', function () {
                    purrl.config('addHook', 'onData', function (context) { context.cancel(); }, 1);
                    PURRL.hook(purrl, 'onData');
                    expect(fakeHook1.callCount).to.equal(1);
                    expect(fakeHook2.callCount).to.equal(0);
                });
            });

            describe('.getSessionContext()', function () {
                it('should return the internal session context', function () {
                    var sessionContext = null;
                    purrl.config('addHook', 'onData', function (context) { sessionContext = context.getSessionContext(); });
                    purrl[' internal'].context.session.test = 'data';
                    PURRL.hook(purrl, 'onData');
                    expect(sessionContext).to.deep.equal({
                        test : 'data'
                    });
                });
            });

            describe('.getRequestContext()', function () {
                it('should return the internal request context', function () {
                    var requestContext = null;
                    purrl.config('addHook', 'onData', function (context) { requestContext = context.getRequestContext(); });
                    purrl[' internal'].context.request.test = 'data';
                    PURRL.hook(purrl, 'onData');
                    expect(requestContext).to.deep.equal({
                        test : 'data'
                    });
                });
            });
        });
    });

    describe('.header()', function () {
        describe('when called with no arguments', function () {
            it('should throw an error', function () {
                try {
                    purrl.header();
                    expect(true, 'An error should have been thrown').to.be.false;
                } catch (error) {
                    expect(error).to.be.an.instanceOf(Error);
                    expect(error.message).to.equal('purrl.header() requires a [ key ] string and a [ value ]');
                }
            });
        });

        describe('when called with only a key', function () {
            it('should throw an error', function () {
                try {
                    purrl.header('accepts');
                    expect(true, 'An error should have been thrown').to.be.false;
                } catch (error) {
                    expect(error).to.be.an.instanceOf(Error);
                    expect(error.message).to.equal('purrl.header() requires a [ key ] string and a [ value ]');
                }
            });
        });

        describe('when called with a non-string', function () {
            it('should throw an error', function () {
                try {
                    purrl.header([], 1);
                    expect(true, 'An error should have been thrown').to.be.false;
                } catch (error) {
                    expect(error).to.be.an.instanceOf(Error);
                    expect(error.message).to.equal('purrl.header() requires a [ key ] string and a [ value ]');
                }
            });
        });

        describe('when called with a key and a value', function () {
            it('should return the purrl object', function () {
                expect(purrl.header('accept', 'application/json')).to.equal(purrl);
            });

            it('should set [ key ] to [ value ] on [ requestHeader ]', function () {
                purrl.header('accept', 'application/json');
                expect(purrl[' internal'].requestHeader).to.deep.equal({
                    accept : 'application/json'
                });
            });
        });
    });

    describe('.noHeader()', function () {
        describe('when called with no arguments', function () {
            it('should throw an error', function () {
                try {
                    purrl.noHeader();
                    expect(true, 'An error should have been thrown').to.be.false;
                } catch (error) {
                    expect(error).to.be.an.instanceOf(Error);
                    expect(error.message).to.equal('purrl.noHeader() requires a [ key ] string');
                }
            });
        });
        describe('when called with a non-string key', function () {
            it('should throw an error', function () {
                try {
                    purrl.noHeader([]);
                    expect(true, 'An error should have been thrown').to.be.false;
                } catch (error) {
                    expect(error).to.be.an.instanceOf(Error);
                    expect(error.message).to.equal('purrl.noHeader() requires a [ key ] string');
                }
            });
        });

        describe('when called with a key', function () {
            it('should return the purrl object', function () {
                expect(purrl.noHeader('accept')).to.equal(purrl);
            });

            it('set the value of [ key ] to [ undefined ] on the [ requestHeader ]', function () {
                purrl.noHeader('accept');
                expect(purrl[' internal'].requestHeader).to.deep.equal({
                    accept : undefined
                });
            });
        });
    });

    describe('.param()', function () {
        describe('when called with no arguments', function () {
            it('should throw an error', function () {
                try {
                    purrl.param();
                    expect(true, 'An error should have been thrown').to.be.false;
                } catch (error) {
                    expect(error).to.be.an.instanceOf(Error);
                    expect(error.message).to.equal('purrl.param() requires a [ key ] string and a [ value ]');
                }
            });
        });

        describe('when called with only a key', function () {
            it('should throw an error', function () {
                try {
                    purrl.param('key');
                    expect(true, 'An error should have been thrown').to.be.false;
                } catch (error) {
                    expect(error).to.be.an.instanceOf(Error);
                    expect(error.message).to.equal('purrl.param() requires a [ key ] string and a [ value ]');
                }
            });
        });

        describe('when called with only a non-string key', function () {
            it('should throw an error', function () {
                try {
                    purrl.param([], 1);
                    expect(true, 'An error should have been thrown').to.be.false;
                } catch (error) {
                    expect(error).to.be.an.instanceOf(Error);
                    expect(error.message).to.equal('purrl.param() requires a [ key ] string and a [ value ]');
                }
            });
        });

        describe('when called with a key and a value', function () {
            it('should return the purrl object', function () {
                expect(purrl.param('key', 'KEY')).to.equal(purrl);
            });

            it('should set [ key ] to [ value ] on [ requestParam ]', function () {
                purrl.param('key', 'KEY');
                expect(purrl[' internal'].requestParam).to.deep.equal({
                    key : 'KEY'
                });
            });
        });
    });

    describe('.noParam()', function () {
        describe('when called with no arguments', function () {
            it('should throw an error', function () {
                try {
                    purrl.noParam();
                    expect(true, 'An error should have been thrown').to.be.false;
                } catch (error) {
                    expect(error).to.be.an.instanceOf(Error);
                    expect(error.message).to.equal('purrl.noParam() requires a [ key ] string');
                }
            });
        });

        describe('when called with a non-string key', function () {
            it('should throw an error', function () {
                try {
                    purrl.noParam([]);
                    expect(true, 'An error should have been thrown').to.be.false;
                } catch (error) {
                    expect(error).to.be.an.instanceOf(Error);
                    expect(error.message).to.equal('purrl.noParam() requires a [ key ] string');
                }
            });
        });

        describe('when called with a key', function () {
            it('should return the purrl object', function () {
                expect(purrl.noParam('key')).to.equal(purrl);
            });

            it('set the value of [ key ] to [ null ] on the [ requestParam ]', function () {
                purrl.noParam('key');
                expect(purrl[' internal'].requestParam).to.deep.equal({
                    key : undefined
                });
            });
        });
    });

    describe('when sending a request', function () {
        var requestStub, requestObject;
        beforeEach(function () {
            requestObject = {
                on : sinon.stub(),
                write : sinon.stub(),
                end : sinon.stub()
            };
            requestStub = sinon.stub(require('http'), 'request').returns(requestObject);
            purrl.config('host', 'example.com');
        });

        afterEach(function () {
            requestStub.restore();
        });

        it('should call the [ onRequest ] hook', function () {
            var onRequest = sinon.stub();
            purrl.config('hook', 'onRequest', onRequest).get();
            expect(onRequest.callCount).to.equal(1);
            expect(onRequest.firstCall.args[0].request).to.equal(requestObject);
        });

        it('should clear the internal [ path ] array', function () {
            purrl('started', 'the', 'part').get();
            expect(purrl[' internal'].path).to.deep.equal([]);
        });

        it('should clear the internal [ requestParam ] array', function () {
            purrl[' internal'].requestParam.key = 'VALUE';
            purrl.get();
            expect(purrl[' internal'].requestParam).to.deep.equal({});
        });

        it('should clear the internal [ requestHeader ] array', function () {
            purrl[' internal'].requestHeader.accept = 'application/json';
            purrl.get();
            expect(purrl[' internal'].requestHeader).to.deep.equal({});
        });

        it('should clear the internal [ context.request ] object', function () {
            purrl[' internal'].context.request.test = 'data';
            purrl.config('hook', 'onRequest', []).get();
            expect(purrl[' internal'].context.request).to.deep.equal({});
        });

        it('should call the protocol\'s [ request() ]', function () {
            purrl.get();
            expect(requestStub.callCount).to.equal(1);
        });

        it('should throw an error when [ host ] is not configured', function () {
            delete purrl[' internal'].host;
            try {
                purrl(1).get();
                expect(true, 'An error should have been thrown').to.be.false;
            } catch (error) {
                expect(error).to.be.an.instanceOf(Error);
                expect(error.message).to.equal('Cannot send the request. The host is not configured.');
                expect(purrl[' internal'].path).to.deep.equal([]);
            }
        });

        it('should pass a correct options object to the protocol\'s [ request() ]', function () {
            purrl.config({
                host : 'example.com',
                port : 8080,
                header : {
                    'content-type' : 'application/json',
                    'content-length' : 1024
                },
                param : {
                    optOne : 'on&&e'
                }
            })
            .config('param', 'option^:^Two', 'two two')
            .header('x-powered-by', 'PURRL')
            .param('three', 3)
            (1, 'dos', 'tro is').get();

            expect(requestStub.firstCall.args).to.deep.equal([{
                hostname : 'example.com',
                port : 8080,
                headers : {
                    'content-type' : 'application/json',
                    'content-length' : '1024',
                    'x-powered-by' : 'PURRL'
                },
                method : 'GET',
                path : '/1/dos/tro%20is?optOne=on%26%26e&option%5E%3A%5ETwo=two%20two&three=3'
            }]);
        });

        describe('when a [ key ] is set to [ undefined ] in [ requestHeader ]', function () {
            it('should suppress that value if it is set in [ header ]', function () {
                purrl.config({
                    host : 'example.com',
                    header : {
                        'content-type' : 'application/json',
                        'content-length' : 1024
                    }
                }).noHeader('content-length').get();
                expect(requestStub.firstCall.args).to.deep.equal([{
                    hostname : 'example.com',
                    headers : {
                        'content-type' : 'application/json'
                    },
                    method : 'GET',
                    path : '/'
                }]);
            });
        });

        describe('when a [ key ] is set to [ undefined ] in [ requestParam ]', function () {
            it('should suppress that value if it is set in [ param ]', function () {
                purrl.config({
                    host : 'example.com',
                    param : {
                        key : 'KEY',
                        token : 'TOKEN'
                    }
                }).noParam('key')('api').get();
                expect(requestStub.firstCall.args).to.deep.equal([{
                    hostname : 'example.com',
                    headers : {},
                    method : 'GET',
                    path : '/api?token=TOKEN'
                }]);
            });
        });

        it('should set a listener on the [ response ] event of the request object', function () {
            purrl.get();
            expect(requestObject.on.calledWith('response')).to.be.true;
        });

        it('should set a listener on the [ error ] event of the request object', function () {
            purrl.get();
            expect(requestObject.on.calledWith('error')).to.be.true;
        });

        it('should call [ .end() ] on the request object', function () {
            purrl.get();
            expect(requestObject.end.callCount).to.equal(1);
        });

        describe('when the [ response ] event is triggered', function () {
            var responseObject, onResponse, onData, onBody;
            beforeEach(function () {
                var ctr, len;
                onResponse = sinon.stub();
                onData = sinon.stub();
                onBody = sinon.stub();
                purrl.config('hook', {
                    onResponse : onResponse,
                    onData : onData,
                    onBody : onBody
                }).get();
                responseObject = {
                    on : sinon.stub()
                };
                for (ctr = 0, len = requestObject.on.callCount; ctr < len; ctr++) {
                    if (requestObject.on.getCall(ctr).args[0] === 'response') {
                        requestObject.on.getCall(ctr).args[1](responseObject);
                        break;
                    }
                }
            });

            it('should call the [ onResponse ] hook', function () {
                expect(onResponse.callCount).to.equal(1);
                expect(onResponse.firstCall.args[0].response).to.equal(responseObject);
            });

            it('should register a listener for the [ data ] event on the response object.', function () {
                expect(responseObject.on.calledWith('data')).to.be.true;
            });

            it('should register a listener for the [ end ] event on the response object.', function () {
                expect(responseObject.on.calledWith('end')).to.be.true;
            });

            describe('[ data ] and [ end ] handling', function () {
                var sendData, sendEnd;
                beforeEach(function () {
                    var ctr, len;
                    for (ctr = 0, len = responseObject.on.callCount; ctr < len; ctr++) {
                        if (responseObject.on.getCall(ctr).args[0] === 'data') {
                            sendData = responseObject.on.getCall(ctr).args[1];
                        }
                        if (responseObject.on.getCall(ctr).args[0] === 'end') {
                            sendEnd = responseObject.on.getCall(ctr).args[1];
                        }
                    }
                });

                it('should append together all data chunks and send them to the [ onBody ] hook', function () {
                    sendData('first');
                    sendData(' second');
                    sendData(' third');
                    sendEnd();
                    expect(onData.callCount).to.equal(3);
                    expect(onData.getCall(0).args[0].data).to.equal('first');
                    expect(onData.getCall(1).args[0].data).to.equal(' second');
                    expect(onData.getCall(2).args[0].data).to.equal(' third');
                    expect(onBody.firstCall.args[0].body).to.equal('first second third');
                });

                it('should allow [ onData ] handlers to alter the data', function () {
                    purrl.config('hook', 'onData', [
                        function (context) {
                            context.data = context.data
                            .toUpperCase();
                        },
                        function (context) {
                            if (context.data[0] === ' ') {
                                context.data = ',' + context.data;
                            }
                        }
                    ]);
                    sendData('first');
                    sendData(' second');
                    sendData(' third');
                    sendEnd();
                    expect(onBody.firstCall.args[0].body).to.equal('FIRST, SECOND, THIRD');
                });

                it('should allow [ onData ] handlers to cancel individual data chunks', function () {
                    purrl.config('hook', 'onData', [
                        function (context) {
                            if (context.data.indexOf('c') !== -1) {
                                context.cancel();
                            }
                        }
                    ]);
                    sendData('first');
                    sendData(' second');
                    sendData(' third');
                    sendEnd();
                    expect(onBody.firstCall.args[0].body).to.equal('first third');
                });
            });
        });

        describe('when a value is passed', function () {
            var beforeRequestBody;
            beforeEach(function () {
                beforeRequestBody = sinon.stub();
                purrl.config('hook', 'beforeRequestBody', beforeRequestBody);
            });

            it('should add the [ Transfer-Encoding ] header', function () {
                purrl.post('Test Body');
                expect(requestStub.firstCall.args[0].headers).to.have.property('transfer-encoding');
                expect(requestStub.firstCall.args[0].headers['transfer-encoding']).to.equal('chunked');
            });

            it('should not alter an transient explicit [ Transfer-Encoding ] header', function () {
                purrl.header('transfer-encoding', 'utf8').post('Test Body');
                expect(requestStub.firstCall.args[0].headers['transfer-encoding']).to.equal('utf8');
            });

            it('should not alter an persistent explicit [ Transfer-Encoding ] header', function () {
                purrl.config('header', 'transfer-encoding', 'utf8').post('Test Body');
                expect(requestStub.firstCall.args[0].headers['transfer-encoding']).to.equal('utf8');
            });

            it('should call request.write()', function () {
                purrl.post('Test Body');
                expect(requestObject.write.callCount).to.equal(1);
                expect(requestObject.write.firstCall.args).to.deep.equal(['Test Body']);
            });

            it('should call the [ beforeRequestBody ] hook', function () {
                purrl.post('Test Body');
                expect(beforeRequestBody.callCount).to.equal(1);
                expect(beforeRequestBody.firstCall.args[0].body).to.deep.equal('Test Body');
            });

            it('should allow the [ beforeRequestBody ] hook to cancel sending the body', function () {
                purrl.config('hook', 'beforeRequestBody', function (context) { context.cancel(); });
                purrl.post('Test Body');
                expect(requestObject.write.callCount).to.equal(0);
            });

            it('should use the body as changed by the [ beforeRequestBody ] hook', function () {
                purrl.config('hook', 'beforeRequestBody', function (context) { context.body = context.body.toUpperCase(); });
                purrl.post('Test Body');
                expect(requestObject.write.callCount).to.equal(1);
                expect(requestObject.write.firstCall.args).to.deep.equal(['TEST BODY']);
            });
        });

        describe('when [ error ] event is triggered', function () {
            it('should call the onRequestError hook', function () {
                var ctr, len, testError = new Error('Test Error'), onRequestErrorStub = sinon.stub();
                purrl.config('hook', 'onRequestError', onRequestErrorStub).get();
                for (ctr = 0, len = requestObject.on.callCount; ctr < len; ctr++) {
                    if (requestObject.on.getCall(ctr).args[0] === 'error') {
                        requestObject.on.getCall(ctr).args[1](testError);
                        break;
                    }
                }
                expect(onRequestErrorStub.callCount).to.equal(1);
                expect(onRequestErrorStub.firstCall.args[0].error).to.equal(testError);
            });
        });

        describe('.get()', function () {
            it('should return undefined', function () {
                expect(purrl.get()).to.be.undefined;
            });

            it('should cause the request method to be [ GET ]', function () {
                purrl.get();
                expect(requestStub.firstCall.args[0].method).to.equal('GET');
            });
        });

        describe('.post()', function () {
            it('should return undefined', function () {
                expect(purrl.post()).to.be.undefined;
            });

            it('should cause the request method to be [ POST ]', function () {
                purrl.post();
                expect(requestStub.firstCall.args[0].method).to.equal('POST');
            });
        });

        describe('.put()', function () {
            it('should return undefined', function () {
                expect(purrl.put()).to.be.undefined;
            });

            it('should cause the request method to be [ PUT ]', function () {
                purrl.put();
                expect(requestStub.firstCall.args[0].method).to.equal('PUT');
            });
        });

        describe('.patch()', function () {
            it('should return undefined', function () {
                expect(purrl.patch()).to.be.undefined;
            });

            it('should cause the request method to be [ PATCH ]', function () {
                purrl.patch();
                expect(requestStub.firstCall.args[0].method).to.equal('PATCH');
            });
        });

        describe('.delete()', function () {
            it('should return undefined', function () {
                expect(purrl.delete()).to.be.undefined;
            });

            it('should cause the request method to be [ DELETE ]', function () {
                purrl.delete();
                expect(requestStub.firstCall.args[0].method).to.equal('DELETE');
            });
        });
    });

    describe('default error or success handling', function () {
        var context, requestContext;
        beforeEach(function () {
            requestContext = {};
            context = {
                getRequestContext : sinon.stub().returns(requestContext)
            };
            sinon.stub(console, 'log');
        });

        afterEach(function () {
            console.log.restore();
        });

        it('should store the request object in the [ requestContext ]', function () {
            context.request = {name : 'requestObject'};
            purrl[' internal'].hook.onRequest[0].call(null, context);
            expect(requestContext.request).to.equal(context.request);
        });

        it('should serialize a response body of type [ object ] to JSON and set the Content-Type header', function () {
            context.body = {
                test : 'value'
            };
            requestContext.request = {
                setHeader : sinon.stub()
            };
            purrl[' internal'].hook.beforeRequestBody[0].call(null, context);
            expect(context.body).to.equal('{"test":"value"}');
            expect(requestContext.request.setHeader.callCount).to.equal(2);
            expect(requestContext.request.setHeader.firstCall.args).to.deep.equal(['Content-Type', 'application/json']);
            expect(requestContext.request.setHeader.secondCall.args).to.deep.equal(['Content-Length', 16]);
        });

        it('should serialize a response body of type [ array ] to JSON and set the Content-Type header', function () {
            context.body = ['test', 'value'];
            requestContext.request = {
                setHeader : sinon.stub()
            };
            purrl[' internal'].hook.beforeRequestBody[0].call(null, context);
            expect(context.body).to.equal('["test","value"]');
            expect(requestContext.request.setHeader.callCount).to.equal(2);
            expect(requestContext.request.setHeader.firstCall.args).to.deep.equal(['Content-Type', 'application/json']);
            expect(requestContext.request.setHeader.secondCall.args).to.deep.equal(['Content-Length', 16]);
        });

        it('should not alter a response body of type [ string ]', function () {
            context.body = 'test value';
            requestContext.request = {
                setHeader : sinon.stub()
            };
            purrl[' internal'].hook.beforeRequestBody[0].call(null, context);
            expect(context.body).to.equal('test value');
            expect(requestContext.request.setHeader.callCount).to.equal(0);
        });

        it('should set the response encoding to [ utf8 ]', function () {
            var responseObject = {
                setEncoding : sinon.stub()
            };
            purrl[' internal'].hook.onResponse[0].call(null, {response : responseObject});
            expect(responseObject.setEncoding.callCount).to.equal(1);
            expect(responseObject.setEncoding.firstCall.args).to.deep.equal(['utf8']);
        });

        it('should output the results from the call to the console', function () {
            purrl[' internal'].hook.onBody[0].call(null, {body : 'The whole enchilada.'});
            expect(console.log.callCount).to.equal(1);
            expect(console.log.firstCall.args[0]).to.equal('The whole enchilada.');
        });

        it('should output the error from the call to the console', function () {
            purrl[' internal'].hook.onRequestError[0].call(null, {error : 'Something bad happened.'});
            expect(console.log.callCount).to.equal(1);
            expect(console.log.firstCall.args).to.deep.equal(['Something bad happened.']);
        });
    });

    describe('in the REPL', function () {
        var contextObj, requestContext;
        beforeEach(function () {
            requestContext = {
                replCallback : sinon.stub()
            };
            contextObj = {
                getRequestContext : sinon.stub().returns(requestContext)
            };
            purrl = new PURRL(PURRL.defaultReplConfig);
        });

        it('should put the replCallback in the request context beforeRequest', function () {
            var temp = requestContext.replCallback;
            global[' requestCallback'] = sinon.stub().returns(temp);
            delete requestContext.replCallback;
            try {
                purrl[' internal'].hook.beforeRequest[0].call(null, contextObj);
                expect(contextObj.getRequestContext.callCount).to.equal(1);
                expect(requestContext.replCallback).to.equal(temp);
            } finally {
                delete global[' requestCallback'];
            }
        });

        it('should call the REPL callback with the results from the call', function () {
            contextObj.body = 'The whole enchilada.';
            purrl[' internal'].hook.onBody[0].call(null, contextObj);
            expect(contextObj.getRequestContext.callCount).to.equal(1);
            expect(requestContext.replCallback.callCount).to.equal(1);
            expect(requestContext.replCallback.firstCall.args).to.deep.equal([null, 'The whole enchilada.']);
        });

        it('should call the REPL callback with the error from the call', function () {
            contextObj.error = 'Something bad happened.';
            purrl[' internal'].hook.onRequestError[0].call(null, contextObj);
            expect(contextObj.getRequestContext.callCount).to.equal(1);
            expect(requestContext.replCallback.callCount).to.equal(1);
            expect(requestContext.replCallback.firstCall.args).to.deep.equal(['Something bad happened.']);
        });
    });
});
