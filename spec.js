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
                .config('query', {
                    key : 'KEY',
                    token : 'TOKEN'
                });
                expect(purrl.config()).to.deep.equal({
                    protocol : 'https',
                    host : 'example.com',
                    query : {
                        key : 'KEY',
                        token : 'TOKEN'
                    }
                });
                expect(purrl.config().query).to.not.equal(purrl[' internal'].query);
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
                it('should throw an error', function () {
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

        describe('option [ query ]', function () {
            describe('when passed no setting', function () {
                it('should return a copy of the currently set permanent query parameters', function () {
                    expect(purrl.config('query')).to.deep.equal({});
                    expect(purrl.config('query')).to.not.equal(purrl[' internal'].query);
                });
            });

            describe('when passed neither a key name or a query object', function () {
                it('should throw an error', function () {
                    try {
                        purrl.config('query', []);
                        expect(true, 'An error should have been thrown').to.be.false;
                    } catch (error) {
                        expect(error).to.be.an.instanceOf(Error);
                        expect(error.message).to.equal('The query setting must be [ key ] and [ value ] or a [ query ] object.');
                    }
                });
            });

            describe('when passed a key name without a value', function () {
                it('should return the value of the key', function () {
                    expect(purrl.config('query', 'key', 'KEY').config('query', 'key')).to.equal('KEY');
                });
            });

            describe('when passed a valid key / value pair', function () {
                it('should return the purrl object', function () {
                    expect(purrl.config('query', 'key', 'KEY')).to.deep.equal(purrl);
                });

                it('should add the key / value pair to the the configuration', function () {
                    expect(purrl.config('query', 'key', 'KEY').config('query')).to.deep.equal({
                        key : 'KEY'
                    });
                    expect(purrl.config('query', 'token', 'TOKEN').config('query')).to.deep.equal({
                        key : 'KEY',
                        token : 'TOKEN'
                    });
                });
            });

            describe('when passed a valid object setting', function () {
                it('should return the purrl object', function () {
                    expect(purrl.config('query', {
                        key : 'KEY',
                        token : 'TOKEN'
                    })).to.equal(purrl);
                });

                it('should perform a complete replace using the passed values', function () {
                    purrl.config('query', 'other', 'OTHER');
                    expect(purrl.config('query', {
                        key : 'KEY',
                        token : 'TOKEN'
                    }).config('query')).to.deep.equal({
                        key : 'KEY',
                        token : 'TOKEN'
                    });
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

        it('call each function in the hook\'s list on the internal [ hookGlobal ] object', function () {
            PURRL.hook(purrl, 'onData');
            expect(fakeHook1.firstCall.calledOn(purrl[' internal'].hookGlobal)).to.be.true;
            expect(fakeHook2.firstCall.calledOn(purrl[' internal'].hookGlobal)).to.be.true;
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

        describe('hook context .cancel()', function () {
            it('should cancel execution of later hooks in the chain', function () {
                purrl.config('addHook', 'onData', function (context) { context.cancel(); }, 1);
                PURRL.hook(purrl, 'onData');
                expect(fakeHook1.callCount).to.equal(1);
                expect(fakeHook2.callCount).to.equal(0);
            });
        });
    });

    describe('.get()', function () {
        var requestStub, requestObject;
        beforeEach(function () {
            requestObject = {
                end : sinon.stub(),
                on : sinon.stub()
            };
            requestStub = sinon.stub(require('http'), 'request').returns(requestObject);
            purrl.config('host', 'example.com');
        });

        afterEach(function () {
            requestStub.restore();
        });

        it('should return undefined', function () {
            expect(purrl.get()).to.be.undefined;
        });

        it('should clear the internal [ path ] array', function () {
            purrl('started', 'the', 'part').get();
            expect(purrl[' internal'].path).to.deep.equal([]);
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
                query : {
                    optOne : 'on&&e'
                }
            })
            .config('query', 'opt^:^Two', 'two two')
            (1, 'dos', 'tro is').get();
            expect(requestStub.firstCall.args).to.deep.equal([{
                hostname : 'example.com',
                port : 8080,
                method : 'GET',
                path : '/1/dos/tro%20is?optOne=on%26%26e&opt%5E%3A%5ETwo=two%20two'
            }]);
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

        describe('when [ response ] event is triggered', function () {
            var responseObject, body;
            beforeEach(function () {
                var ctr, len;
                purrl.config('hook', 'onBody', function (context) { body = context.body; }).get();
                responseObject = {
                    setEncoding : sinon.stub(),
                    on : sinon.stub()
                };
                for (ctr = 0, len = requestObject.on.callCount; ctr < len; ctr++) {
                    if (requestObject.on.getCall(ctr).args[0] === 'response') {
                        requestObject.on.getCall(ctr).args[1](responseObject);
                        break;
                    }
                }
            });

            it('should register a listener for the [ data ] event on the response object.', function () {
                expect(responseObject.on.calledWith('data')).to.be.true;
            });

            it('should register a listener for the [ end ] event on the response object.', function () {
                expect(responseObject.on.calledWith('end')).to.be.true;
            });

            it('should set the encoding for the response to [ utf8 ]', function () {
                expect(responseObject.setEncoding.callCount).to.equal(1);
                expect(responseObject.setEncoding.firstCall.args).to.deep.equal(['utf8']);
            });

            describe('[ data ] and [ end ] handling', function () {
                it('should append together all data chunks and send them to the [ onBody ] hook', function () {
                    var ctr, len, onData, onEnd;
                    for (ctr = 0, len = responseObject.on.callCount; ctr < len; ctr++) {
                        if (responseObject.on.getCall(ctr).args[0] === 'data') {
                            onData = responseObject.on.getCall(ctr).args[1];
                        }
                        if (responseObject.on.getCall(ctr).args[0] === 'end') {
                            onEnd = responseObject.on.getCall(ctr).args[1];
                        }
                    }
                    onData('first');
                    onData(' second');
                    onData(' third');
                    onEnd();
                    expect(body).to.equal('first second third');
                });
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
    });

    describe('default error or success handling', function () {
        beforeEach(function () {
            sinon.stub(console, 'log');
        });

        afterEach(function () {
            console.log.restore();
        });

        it('should output the results from the call to the console', function () {
            var hookGlobal = {};
            purrl[' internal'].hook.onBody[0].call(hookGlobal, {body : 'The whole enchilada.'});
            expect(console.log.callCount).to.equal(1);
            expect(console.log.firstCall.args[0]).to.equal('The whole enchilada.');
        });

        it('should output the error from the call to the console', function () {
            var hookGlobal = {};
            purrl[' internal'].hook.onRequestError[0].call(hookGlobal, {error : 'Something bad happened.'});
            expect(console.log.callCount).to.equal(1);
            expect(console.log.firstCall.args).to.deep.equal(['Something bad happened.']);
        });
    });

    describe('in the REPL', function () {
        var replCallback;
        beforeEach(function () {
            replCallback = sinon.stub();
            global[' requestCallback'] = sinon.stub().returns(replCallback);
            purrl.config(PURRL.defaultReplConfig);
        });

        afterEach(function () {
            delete global[' requestCallback'];
        });

        it('should call the REPL callback with the results from the call', function () {
            var hookGlobal = {};
            purrl[' internal'].hook.beforeRequest[0].call(hookGlobal, {});
            purrl[' internal'].hook.onBody[0].call(hookGlobal, {body : 'The whole enchilada.'});
            expect(replCallback.callCount).to.equal(1);
            expect(replCallback.firstCall.args).to.deep.equal([null, 'The whole enchilada.']);
        });

        it('should call the REPL callback with the error from the call', function () {
            var hookGlobal = {};
            purrl[' internal'].hook.beforeRequest[0].call(hookGlobal, {});
            purrl[' internal'].hook.onRequestError[0].call(hookGlobal, {error : 'Something bad happened.'});
            expect(replCallback.callCount).to.equal(1);
            expect(replCallback.firstCall.args).to.deep.equal(['Something bad happened.']);
        });
    });
});
