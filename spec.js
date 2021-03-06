'use strict';

var fs = require('fs'),
expect = require('chai').expect,
sinon = require('sinon'),
Q = require('q'),
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
            var path = {toString : function () { return 'path'; }};
            purrl(1, 'part', {of : 'the'}, path);
            expect(purrl[' internal'].path).to.deep.equal([1, 'part', {of : 'the'}, path]);
        });

        describe('when the internal [ path ] contains non-named placeholders', function () {
            it('should replace each placeholder starting from left with each passed value', function () {
                purrl.config('pathElement', 'placeholder', [1, {}, 2, {}]);
                purrl.placeholder(3, 4);
                expect(purrl[' internal'].path).to.deep.equal([1, 3, 2, 4]);
            });

            it('should append each value as a string to the end of the internal [ path ] once all placeholders have been replaced', function () {
                purrl.config('pathElement', 'placeholder', [1, {}, 2, {}]);
                purrl.placeholder(3, 4, 5, 6);
                expect(purrl[' internal'].path).to.deep.equal([1, 3, 2, 4, 5, 6]);
            });

            it('should use non-matching objects as JSON string values', function () {
                purrl.config('pathElement', 'placeholder', [1, {p : 'one'}, 2, {}, {}, 3, {p : 'three'}]);
                purrl.placeholder({
                    one : 'uno',
                    three : 'tres'
                })({
                    one : 'uno',
                    three : 'tres'
                });
                expect(purrl[' internal'].path).to.deep.equal([1, 'uno', 2, {one : 'uno', three : 'tres'}, {}, 3, 'tres']);
            });
        });

        describe('when the internal [ path ] contains named placeholders', function () {
            it('should replace match each named placeholder with the property in a values object', function () {
                purrl.config('pathElement', 'placeholder', [1, {p : 'one'}, 2, {p : 'two'}, 3, {p : 'three'}]);
                purrl.placeholder({
                    one : 'uno',
                    three : 'tres'
                })({two : 'dos'}, 4);
                expect(purrl[' internal'].path).to.deep.equal([1, 'uno', 2, 'dos', 3, 'tres', 4]);
            });

            it('should not affect named placeholders with primitive values', function () {
                purrl.config('pathElement', 'placeholder', [1, {p : 'one'}, 2, {}]);
                purrl.placeholder(3, 4, 5, 6);
                expect(purrl[' internal'].path).to.deep.equal([1, {p : 'one'}, 2, 3, 4, 5, 6]);
            });
        });
    });

    describe('.config()', function () {
        beforeEach(function () {
            purrl.config('hook', 'onRequestError', []);
            purrl.config('hook', 'onRequest', []);
            purrl.config('hook', 'onResponseError', []);
            purrl.config('hook', 'beforeRequestBody', []);
            purrl.config('hook', 'onResponse', []);
            purrl.config('hook', 'onBody', []);
        });

        describe('when called with no arguments', function () {
            it('should return an object with a copy of the current configuration', function () {
                expect(purrl.config()).to.deep.equal({
                    protocol : 'http',
                    promise : 'q',
                    verb : {
                        get : 'GET',
                        post : 'POST',
                        put : 'PUT',
                        delete : 'DELETE'
                    }
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
                    promise : 'q',
                    host : 'example.com',
                    param : {
                        key : 'KEY',
                        token : 'TOKEN'
                    },
                    verb : {
                        get : 'GET',
                        post : 'POST',
                        put : 'PUT',
                        delete : 'DELETE'
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
                    promise : 'q',
                    host : 'example.com',
                    verb : {
                        get : 'GET',
                        post : 'POST',
                        put : 'PUT',
                        delete : 'DELETE'
                    }
                });
            });

            describe('when some of the items in the object are invalid', function () {
                it('should throw an error on the first unsupported configuration', function () {
                    expect(function () {
                        purrl.config({
                            protocol : 'http',
                            wazIsConfigThingy : 'someSetting'
                        });
                    }).to.throw(Error, 'The configuration option [ wazIsConfigThingy ] is not supported.');
                });

                it('should throw an error on the first invalid value', function () {
                    expect(function () {
                        purrl.config({
                            protocol : 'http',
                            port : 52.89
                        });
                    }).to.throw(Error, 'The value [ 52.89 ] is not a valid port number.');
                });
            });
        });

        describe('when called with neither an option name or a configuration object', function () {
            it('should throw an error', function () {
                expect(function () {
                    purrl.config([]);
                }).to.throw(Error, 'The [ config() ] method must be provided an [ option ] name with the correct settings or a configuration object.');
            });
        });

        describe('when called with an unsupported configuration option', function () {
            it('should throw an error', function () {
                expect(function () {
                    purrl.config('wazIsConfigThingy');
                }).to.throw(Error, 'The configuration option [ wazIsConfigThingy ] is not supported.');
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
                    expect(function () {
                        purrl.config('protocol', 'SPEEDY');
                    }).to.throw(Error, 'The [ SPEEDY ] protocol is not supported.');
                });
            });

            describe('when passed a valid setting', function () {
                it('should return the purrl object', function () {
                    expect(purrl.config('protocol', 'https')).to.equal(purrl);
                });

                it('should update the configuration', function () {
                    expect(purrl.config('protocol', 'https').config('protocol')).to.equal('https');
                });

                it('should clear the [ port ] configuration', function () {
                    expect(purrl.config('port', 80).config('protocol', 'https').config('port')).to.be.undefined;
                });
            });

            describe('when set simultaneously with [ port ]', function () {
                it('should not reset port to the default', function () {
                    expect(purrl.config({port : 8443, protocol : 'https'}).config()).to.deep.equal({
                        protocol : 'https',
                        promise : 'q',
                        port : 8443,
                        verb : {
                            get : 'GET',
                            post : 'POST',
                            put : 'PUT',
                            delete : 'DELETE'
                        }
                    });
                });

                it('should update the configuration', function () {
                    expect(purrl.config('protocol', 'https').config('protocol')).to.equal('https');
                });

                it('should clear the [ port ] configuration', function () {
                    expect(purrl.config('port', 80).config('protocol', 'https').config('port')).to.be.undefined;
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
                    expect(function () {
                        purrl.config('host', 5);
                    }).to.throw(Error, 'The value [ 5 ] is invalid for host. It must be a string.');
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
                    expect(function () {
                        purrl.config('port', 0);
                        console.dir(purrl.config('port'));
                    }).to.throw(Error, 'The value [ 0 ] is not a valid port number.');
                });

                it('should throw an error for too large a port', function () {
                    expect(function () {
                        purrl.config('port', 65536);
                        console.dir(purrl.config('port'));
                    }).to.throw(Error, 'The value [ 65536 ] is not a valid port number.');
                });

                it('should throw an error for non-integer', function () {
                    expect(function () {
                        purrl.config('port', '56.4');
                        console.dir(purrl.config('port'));
                    }).to.throw(Error, 'The value [ 56.4 ] is not a valid port number.');
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
                    expect(function () {
                        purrl.config('param', []);
                    }).to.throw(Error, 'The param setting must be [ key ] and [ value ] or a [ param ] object.');
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
                    expect(function () {
                        purrl.config('removeParam');
                    }).to.throw(Error, 'The removeParam setting must be passed a param key [ string ]');
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
                    expect(function () {
                        purrl.config('header', []);
                    }).to.throw(Error, 'The header setting must be [ key ] and [ value ] or a [ header ] object.');
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
                    expect(function () {
                        purrl.config('removeHeader');
                    }).to.throw(Error, 'The removeHeader setting must be passed a header key [ string ]');
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

        describe('option [ pathElement ]', function () {
            describe('when passed no setting', function () {
                it('should return a copy of the currently set custom path parameters', function () {
                    expect(purrl.config('pathElement')).to.deep.equal({});
                    expect(purrl.config('pathElement')).to.not.equal(purrl[' internal'].pathElement);
                    expect(purrl.config('pathElement', 'members', 'members').config('pathElement')).to.deep.equal({
                        members : ['members']
                    });
                });
            });

            describe('when passed neither a key name or a pathElement object', function () {
                it('should throw an error', function () {
                    expect(function () {
                        purrl.config('pathElement', []);
                    }).to.throw(Error, 'The pathElement setting must be [ key ] and [ value ] or a [ pathElement ] object.');
                });
            });

            describe('when passed a key name without a value', function () {
                it('should return the list of elements for the key', function () {
                    expect(purrl.config('pathElement', 'members')).to.be.undefined;
                    expect(purrl.config('pathElement', 'members', 'members').config('pathElement', 'members')).to.deep.equal(['members']);
                    expect(purrl.config('pathElement', 'members')).to.not.equal(purrl[' internal'].pathElement.members);
                });
            });

            describe('when passed a valid key / value pair', function () {
                it('should return the purrl object', function () {
                    expect(purrl.config('pathElement', 'members', 'members')).to.deep.equal(purrl);
                });

                it('should add the key as a property', function () {
                    purrl.config('pathElement', 'me', [1, 'members', 'me']);
                    expect(purrl).to.have.property('me');
                });

                describe('when the value is a string', function () {
                    it('should add to the configuration, under the key, the value in an array', function () {
                        expect(purrl.config('pathElement', 'members', 'members').config('pathElement')).to.deep.equal({
                            members : ['members']
                        });
                        expect(purrl.config('pathElement', 'me', 'me').config('pathElement')).to.deep.equal({
                            members : ['members'],
                            me : ['me']
                        });
                    });
                });

                describe('when the value is a non string', function () {
                    it('should add to the configuration, under the key, the value in an array', function () {
                        expect(purrl.config('pathElement', 'one', 1).config('pathElement')).to.deep.equal({
                            one : [1]
                        });
                    });
                });

                describe('when the value is an empty object', function () {
                    it('should add to the configuration, under the key, a placeholder value in an array', function () {
                        expect(purrl.config('pathElement', 'placeholder', {}).config('pathElement')).to.deep.equal({
                            placeholder : [{}]
                        });
                    });
                });

                describe('when the value is an object with a string [ p ] property', function () {
                    it('should add to the configuration, under the key, a placeholder value in an array', function () {
                        expect(purrl.config('pathElement', 'card', {p : 'card'}).config('pathElement')).to.deep.equal({
                            card : [{p : 'card'}]
                        });
                    });
                });

                describe('when the value is an object with properties but not a string [ p ] property', function () {
                    it('should add to the configuration, under the key, a the stringified value in an array', function () {
                        expect(purrl.config('pathElement', 'obj', [{one : 1}]).config('pathElement')).to.deep.equal({
                            obj : [{one : 1}]
                        });
                    });
                });

                describe('when the value is an array of all string items', function () {
                    it('should add to the configuration, under the key, the array value', function () {
                        expect(purrl.config('pathElement', 'me', ['members', 'me']).config('pathElement')).to.deep.equal({
                            me : ['members', 'me']
                        });
                    });
                });

                describe('when the value is an array will some non-string items', function () {
                    it('should convert the non-strings to strings then add to the configuration, under the key, the array', function () {
                        expect(purrl.config('pathElement', 'me', [1, 'members', 'me']).config('pathElement')).to.deep.equal({
                            me : [1, 'members', 'me']
                        });
                    });
                });
            });

            describe('when the key name is the same as an existing custom path element', function () {
                it('should replace the custom path element', function () {
                    purrl.config('pathElement', 'me', 'me');
                    purrl.config('pathElement', 'me', [1, 'members', 'me']);
                    expect(purrl.config('pathElement', 'me')).to.deep.equal([1, 'members', 'me']);
                    expect(purrl.me.me[' internal'].path).to.deep.equal([1, 'members', 'me', 1, 'members', 'me']);
                });
            });

            describe('when the key name is the same as an existing purrl property that is not a custom path element', function () {
                it('should throw an exception', function () {
                    expect(function () {
                        purrl.config('pathElement', 'get', 'get');
                    }).to.throw(Error, 'The pathElement [ get ] conflicts with another property.');
                });
            });

            describe('added property', function () {
                beforeEach(function () {
                    purrl.config('pathElement', 'me', [1, 'members', 'me']);
                });

                it('should be configurable and enumerable', function () {
                    var descriptor = Object.getOwnPropertyDescriptor(purrl, 'me');
                    expect(descriptor.configurable).to.be.true;
                    expect(descriptor.enumerable).to.be.true;
                });

                it('should return the purrl object', function () {
                    expect(purrl.me).to.equal(purrl);
                });

                it('should add all path elements to the internal path', function () {
                    purrl.me;
                    expect(purrl[' internal'].path).to.deep.equal([1, 'members', 'me']);
                });
            });

            describe('when passed a valid object setting', function () {
                it('should return the purrl object', function () {
                    expect(purrl.config('pathElement', {
                        one : 1,
                        me : [1, 'members', 'me']
                    })).to.equal(purrl);
                });

                it('should add the key / value pairs to the pathElement configuration', function () {
                    purrl.config('pathElement', 'cards', 'cards');
                    expect(purrl.config('pathElement', {
                        one : 1,
                        me : [1, 'members', 'me']
                    }).config('pathElement')).to.deep.equal({
                        cards : ['cards'],
                        one : [1],
                        me : [1, 'members', 'me']
                    });
                });
            });
        });

        describe('option [ removePathElement ]', function () {
            describe('when passed no pathElement key', function () {
                it('should throw an error', function () {
                    expect(function () {
                        purrl.config('removePathElement');
                    }).to.throw(Error, 'The removePathElement setting must be passed a pathElement key [ string ]');
                });
            });

            describe('when passed a pathElement key', function () {
                it('should return the purrl object', function () {
                    expect(purrl.config('removePathElement', 'me')).to.equal(purrl);
                });

                it('should remove pathElement from the object of pathElements', function () {
                    purrl.config('pathElement', {
                        boards : 'boards',
                        me : [1, 'members', 'me']
                    });
                    purrl.config('removePathElement', 'me');
                    expect(purrl.config('pathElement')).to.deep.equal({boards : ['boards']});
                    purrl.config('removePathElement', 'me');
                    expect(purrl.config('pathElement')).to.deep.equal({boards : ['boards']});
                    purrl.config('removePathElement', 'boards');
                    expect(purrl.config('pathElement')).to.deep.equal({});
                    purrl.config('removePathElement', 'boards');
                    expect(purrl.config('pathElement')).to.deep.equal({});
                });

                it('should remove the property from the purrl object', function () {
                    purrl.config('pathElement', {
                        boards : 'boards',
                        me : [1, 'members', 'me']
                    });
                    purrl.config('removePathElement', 'me');
                    expect(purrl.me).to.be.undefined;
                    purrl.config('removePathElement', 'boards');
                    expect(purrl.boards).to.be.undefined;
                });

                it('should NOT remove properties from non-path element configurations from the purrl object', function () {
                    purrl.config('removePathElement', 'get');
                    expect(purrl).to.have.property('get');
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
                    expect(function () {
                        purrl.config('hook', []);
                    }).to.throw(Error,
                    'The hook setting must be a recognized [ key ] with either a [ function ] or an [ array ] of functions or a [ hook ] object.');
                });
            });

            describe('when passed an invalid hook name', function () {
                it('should throw an error', function () {
                    expect(function () {
                        purrl.config('hook', 'notAHook');
                    }).to.throw(Error, 'Unrecognized hook name [ notAHook ]');
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
                    expect(function () {
                        purrl.config('hook', 'onData', [onData1, true]);
                    }).to.throw(Error, 'Error setting hook named [ onData ]. The value must be either a [ function ] or an [ array ] of functions.');
                });
            });

            describe('when passed a valid key and an invalid value', function () {
                it('should throw an error', function () {
                    expect(function () {
                        purrl.config('hook', 'onData', true);
                    }).to.throw(Error, 'Error setting hook named [ onData ]. The value must be either a [ function ] or an [ array ] of functions.');
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

        describe('option [ loadHooks ]', function () {
            describe('when passed a valid absolute path to a hook module', function () {
                it('should load the hooks from the module', function (done) {
                    fs.realpath('./testHook.js', function (err, absolutePath) {
                        expect(purrl.config('loadHooks', absolutePath).config('hook')).to.deep.equal({
                            onBody : ['function () { return 1 + 1; }']
                        });
                        done();
                    });
                });
            });

            describe('when passed a valid relative path to a hook module', function () {
                it('should load the hooks from the module', function () {
                    expect(purrl.config('loadHooks', './testHook.js').config('hook')).to.deep.equal({
                        onBody : ['function () { return 1 + 1; }']
                    });
                });
            });

            describe('when passed a valid name of a hook module', function () {
                it('should load the hooks from the module', function (done) {
                    Q.nfcall(fs.mkdir, './node_modules')
                    .then(function () {}, function () {}) // ignore any errors
                    .then(function () {
                        return Q.nfcall(fs.mkdir, './node_modules/testHook');
                    })
                    .then(function () {}, function () {}) // ignore any errors
                    .then(function () {
                        return Q.nfcall(fs.writeFile, './node_modules/testHook/package.json', JSON.stringify({main : 'index.js'}, null, 4));
                    })
                    .then(function () {
                        return Q.nfcall(fs.readFile, './testHook.js');
                    })
                    .then(function (data) {
                        return Q.nfcall(fs.writeFile, './node_modules/testHook/index.js', data);
                    })
                    .then(function () {
                        expect(purrl.config('loadHooks', 'testHook').config('hook')).to.deep.equal({
                            onBody : ['function () { return 1 + 1; }']
                        });
                    })
                    .done(done);
                });
            });

            describe('when passed an invalid path', function () {
                it('should throw an error', function () {
                    expect(function () {
                        purrl.config('loadHooks', './notAModule');
                    }).to.throw(Error, 'Could not load hooks from [ ./notAModule ].');
                });
            });
        });

        describe('option [ addHook ]', function () {
            describe('when passed no hookName', function () {
                it('should throw an error', function () {
                    expect(function () {
                        purrl.config('addHook');
                    }).to.throw(Error, 'The addHook setting must be passed a hookName [ string ], a value [ function ], and an optional index [ integer ]');
                });
            });

            describe('when passed no value', function () {
                it('should throw an error', function () {
                    expect(function () {
                        purrl.config('addHook', 'onData');
                    }).to.throw(Error, 'The addHook setting must be passed a hookName [ string ], a value [ function ], and an optional index [ integer ]');
                });
            });

            describe('when passed an invalid hookName', function () {
                it('should throw an error', function () {
                    expect(function () {
                        purrl.config('addHook', 'notAHook', function () {});
                    }).to.throw(Error, 'Unrecognized hook name [ notAHook ]');
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
                    expect(function () {
                        purrl.config('addHook', 'onData', onData1, 56.23);
                    }).to.throw(Error, 'The addHook index value is invalid.');
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
                    expect(function () {
                        purrl.config('removeHook');
                    }).to.throw(Error, 'The removeHook setting must be passed a hookName [ string ] and an index [ integer ]');
                });
            });

            describe('when passed an invalid hookName', function () {
                it('should throw an error', function () {
                    expect(function () {
                        purrl.config('removeHook', 'notAHook', function () {});
                    }).to.throw(Error, 'Unrecognized hook name [ notAHook ]');
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
                    expect(function () {
                        purrl.config('removeHook', 'onData', 56.23);
                    }).to.throw(Error, 'The removeHook index value is invalid.');
                });
            });

            describe('when passed a valid hookName and valid index but the index does not match a item in the list', function () {
                it('should throw an error', function () {
                    purrl.config('hook', 'onData', [onData1, onData2]);
                    expect(function () {
                        purrl.config('removeHook', 'onData', 100);
                    }).to.throw(Error, 'The removeHook index does not match an item in the list.');
                });
            });
        });

        describe('option [ promise ]', function () {
            describe('when passed no setting', function () {
                it('should return the current setting', function () {
                    expect(purrl.config('promise')).to.equal('q');
                });
            });

            describe('when passed an invalid setting', function () {
                it('should not throw an error when [ quite ] is passed [ true ]', function () {
                    purrl.config('promise', 'p', true);
                    expect(purrl.config('promise')).to.be.undefined;
                    expect(purrl[' internal'].promise.library).to.be.undefined;
                });

                it('should throw an error on missing named library', function () {
                    expect(function () {
                        purrl.config('promise', 'p');
                    }).to.throw(Error, 'Could not load the [ p ] promise library.');
                    expect(purrl.config('promise')).to.be.undefined;
                });

                it('should throw an error on non object or non function passed as library', function () {
                    expect(function () {
                        purrl.config('promise', []);
                    }).to.throw(Error, 'The supplied custom promise library does not meet the required interface.');
                    expect(purrl.config('promise')).to.be.undefined;
                });

                it('should throw an error on library object without defer function', function () {
                    expect(function () {
                        purrl.config('promise', {});
                    }).to.throw(Error, 'The supplied custom promise library does not meet the required interface.');
                    expect(purrl.config('promise')).to.be.undefined;
                });

                it('should throw an error on library function without defer function', function () {
                    expect(function () {
                        purrl.config('promise', function () {});
                    }).to.throw(Error, 'The supplied custom promise library does not meet the required interface.');
                    expect(purrl.config('promise')).to.be.undefined;
                });

                it('should throw an error on library object with defer that does not return an object', function () {
                    expect(function () {
                        purrl.config('promise', {
                            defer : sinon.stub()
                        });
                    }).to.throw(Error, 'The supplied custom promise library does not meet the required interface.');
                    expect(purrl.config('promise')).to.be.undefined;
                });

                it('should throw an error on library object when defer returns an object without the promise property', function () {
                    expect(function () {
                        purrl.config('promise', {
                            defer : sinon.stub().returns({
                                resolve : function () {},
                                reject : function () {}
                            })
                        });
                    }).to.throw(Error, 'The supplied custom promise library does not meet the required interface.');
                    expect(purrl.config('promise')).to.be.undefined;
                });

                it('should throw an error on library object when defer returns an object without the resolve function', function () {
                    expect(function () {
                        purrl.config('promise', {
                            defer : sinon.stub().returns({
                                promise : {},
                                reject : function () {}
                            })
                        });
                    }).to.throw(Error, 'The supplied custom promise library does not meet the required interface.');
                    expect(purrl.config('promise')).to.be.undefined;
                });

                it('should throw an error on library object when defer returns an object without the reject function', function () {
                    expect(function () {
                        purrl.config('promise', {
                            defer : sinon.stub().returns({
                                promise : true,
                                resolve : function () {}
                            })
                        });
                    }).to.throw(Error, 'The supplied custom promise library does not meet the required interface.');
                    expect(purrl.config('promise')).to.be.undefined;
                });
            });

            describe('when passed a valid object library', function () {
                var customLib;
                beforeEach(function () {
                    customLib = {
                        defer : sinon.stub().returns({
                            promise : {},
                            resolve : function () {},
                            reject : function () {}
                        })
                    };
                });

                it('should return the purrl object', function () {
                    expect(purrl.config('promise', customLib)).to.equal(purrl);
                });

                it('should update the configuration', function () {
                    expect(purrl.config('promise', customLib).config('promise')).to.equal('<custom>');
                    expect(purrl[' internal'].promise.library).to.equal(customLib);
                });
            });

            describe('when passed a valid function library', function () {
                var customLib;
                beforeEach(function () {
                    customLib = function () {};
                    customLib.defer = sinon.stub().returns({
                        promise : {},
                        resolve : function () {},
                        reject : function () {}
                    });
                });

                it('should return the purrl object', function () {
                    expect(purrl.config('promise', customLib)).to.equal(purrl);
                });

                it('should update the configuration', function () {
                    expect(purrl.config('promise', customLib).config('promise')).to.equal('<custom>');
                    expect(purrl[' internal'].promise.library).to.equal(customLib);
                });
            });

            describe('when passed a valid library name', function () {
                beforeEach(function () {
                    purrl.config('noPromise');
                });

                it('should return the purrl object', function () {
                    expect(purrl.config('promise', 'q')).to.equal(purrl);
                });

                it('should update the configuration', function () {
                    expect(purrl.config('promise', 'q').config('promise')).to.equal('q');
                    expect(purrl[' internal'].promise.library).to.equal(require('q'));
                });
            });
        });

        describe('option [ noPromise ]', function () {
            beforeEach(function () {
                purrl.config('promise', {
                    defer : sinon.stub().returns({
                        promise : {},
                        resolve : function () {},
                        reject : function () {}
                    })
                });
            });

            it('should return the purrl object', function () {
                expect(purrl.config('noPromise')).to.equal(purrl);
            });

            it('should unset to [ promise ] option', function () {
                expect(purrl.config('noPromise').config('promise')).to.be.undefined;
                expect(purrl[' internal'].promise.library).to.be.undefined;
            });
        });

        describe('option [ verb ]', function () {
            describe('when passed no setting', function () {
                it('should return the current setting', function () {
                    purrl[' internal'].verb = {};
                    expect(purrl.config('verb')).to.deep.equal({});
                });

                it('should return the current setting', function () {
                    expect(purrl.config('verb', 'get')).to.equal('GET');
                    expect(purrl.config('verb')).to.deep.equal({
                        get : 'GET',
                        post : 'POST',
                        put : 'PUT',
                        delete : 'DELETE'
                    });
                });
            });

            describe('when passed an invalid setting', function () {
                it('should throw an error on non string name or non object', function () {
                    expect(function () {
                        purrl.config('verb', []);
                    }).to.throw(Error, 'The verb setting must be [ key ] and a string [ value ] or a [ verb ] object.');
                });

                it('should throw an error on conflicting name', function () {
                    expect(function () {
                        purrl.config('verb', 'param', 'SEARCH');
                    }).to.throw(Error, 'The verb [ param ] conflicts with another property.');
                });

                it('should throw an error on non string value', function () {
                    expect(function () {
                        purrl.config('verb', 'get', []);
                    }).to.throw(Error, 'The verb setting must be [ key ] and a string [ value ] or a [ verb ] object.');
                });
            });

            describe('when passed a valid HTTP method', function () {
                it('should return the purrl object', function () {
                    expect(purrl.config('verb', 'search', 'SEARCH')).to.equal(purrl);
                });

                it('should update the configuration', function () {
                    expect(purrl.config('verb', 'search', 'SEARCH').config('verb', 'search')).to.equal('SEARCH');
                });

                it('should add a matching method on the [ purrl ] object', function () {
                    purrl.config('verb', 'search', 'SEARCH');
                    expect(purrl).to.have.property('search');
                    expect(purrl.search).to.be.a('function');
                });
            });

            describe('when passed a valid object', function () {
                it('should return the purrl object', function () {
                    expect(purrl.config('verb', {})).to.equal(purrl);
                });

                it('should update the configuration', function () {
                    expect(purrl.config('verb', {
                        search : 'SEARCH',
                        copy : 'COPY'
                    }).config('verb')).to.deep.equal({
                        get : 'GET',
                        post : 'POST',
                        put : 'PUT',
                        delete : 'DELETE',
                        search : 'SEARCH',
                        copy : 'COPY'
                    });
                });

                it('should the matching methods on the [ purrl ] object', function () {
                    purrl.config('verb', {
                        search : 'SEARCH',
                        copy : 'COPY'
                    });
                    expect(purrl).to.have.property('search');
                    expect(purrl.search).to.be.a('function');
                    expect(purrl).to.have.property('copy');
                    expect(purrl.copy).to.be.a('function');
                });
            });

            describe('added method', function () {
                var requestStub;
                beforeEach(function () {
                    requestStub = sinon.stub(require('http'), 'request').returns({
                        on : function () {},
                        end : function () {}
                    });
                    purrl.config({
                        host : 'example.com',
                        verb : {
                            foo : 'SEARCH'
                        }
                    });
                });

                afterEach(function () {
                    requestStub.restore();
                });

                it('should can the protocol\'s [ request() ]', function () {
                    purrl.foo();
                    expect(requestStub.callCount).to.equal(1);
                });

                it('should set the request [ method ] based on the configuration', function () {
                    purrl.foo();
                    purrl[' internal'].verb.foo = 'OTHER';
                    purrl.foo();
                    expect(requestStub.firstCall.args[0].method).to.equal('SEARCH');
                    expect(requestStub.secondCall.args[0].method).to.equal('OTHER');
                });

                it('should return a [ promise ]', function () {
                    expect(Q.isPromise(purrl.foo())).to.be.true;
                });

                describe('when no [ promise ] option is set', function () {
                    it('should return [ undefined ]', function () {
                        purrl.config('noPromise');
                        expect(purrl.foo()).to.be.undefined;
                    });
                });
            });
        });

        describe('option [ removeVerb ]', function () {
            describe('when passed no verb key', function () {
                it('should throw an error', function () {
                    expect(function () {
                        purrl.config('removeVerb');
                    }).to.throw(Error, 'The removeVerb setting must be passed a verb key [ string ]');
                });
            });

            describe('when passed a verb key', function () {
                it('should return the purrl object', function () {
                    expect(purrl.config('removeVerb', 'search')).to.equal(purrl);
                });

                it('should remove verb from the object of verbs', function () {
                    purrl.config('removeVerb', 'get');
                    expect(purrl.config('verb', 'get')).to.be.undefined;
                    purrl.config('removeVerb', 'get');
                    expect(purrl.config('verb', 'get')).to.be.undefined;
                    purrl.config('removeVerb', 'post');
                    expect(purrl.config('verb', 'post')).to.be.undefined;
                    purrl.config('removeVerb', 'post');
                    expect(purrl.config('verb', 'post')).to.be.undefined;
                });

                it('should remove the method from the purrl object', function () {
                    purrl.config('removeVerb', 'get');
                    expect(purrl.get).to.be.undefined;
                    purrl.config('removeVerb', 'post');
                    expect(purrl.post).to.be.undefined;
                });

                it('should NOT remove methods from non-verb configurations from the purrl object', function () {
                    purrl.config('removeVerb', 'param');
                    expect(purrl).to.have.property('param');
                });
            });
        });
    });

    describe('static .loadConfig()', function () {
        var purrl, fileName;
        describe('when passed a path to a valid configuration file', function () {
            before(function (done) {
                fileName = './test-load-config-1.json';
                Q.nfcall(fs.writeFile, fileName, JSON.stringify({
                    protocol : 'https',
                    host : 'example.com',
                    port : 8443,
                    param : {
                        newParam : 'new'
                    },
                    removeParam : 'shouldRemain',
                    header : {
                        newHeader : 'new'
                    },
                    removeHeader : 'shouldRemain',
                    pathElement :  {
                        x : [1, {}, 3]
                    },
                    removePathElement : 'y',
                    verb : {
                        search : 'SEARCH'
                    },
                    removeVerb : 'get',
                    loadHooks : './testHook.js',
                    promise : 'q'
                }))
                .done(function () {
                    purrl = new PURRL({
                        param : {
                            shouldRemain : 'value'
                        },
                        header : {
                            shouldRemain : 'value'
                        },
                        pathElement :  {
                            y : [9, 8, {p : 'id'}]
                        },
                        noPromise : true,
                        hook : {
                            beforeRequestBody : [],
                            onBody : [],
                            onRequest : [],
                            onRequestError : [],
                            onResponse : [],
                            onResponseError : []
                        }
                    });
                    PURRL.loadConfig(purrl, fileName);
                    done();
                });
            });

            after(function () {
                Q.nfcall(fs.unlink, fileName)
                .fail(function (reason) {
                    console.log('Could not remove test generated file [ ' + fileName + ' ]:\n', reason);
                });
            });

            it('should load the configuration from the JSON', function () {
                expect(purrl.config()).to.deep.equal({
                    protocol : 'https',
                    promise : 'q',
                    host : 'example.com',
                    port : 8443,
                    verb : {
                        get : 'GET',
                        post : 'POST',
                        put : 'PUT',
                        delete : 'DELETE',
                        search : 'SEARCH'
                    },
                    param : {
                        newParam : 'new',
                        shouldRemain : 'value'
                    },
                    header : {
                        newHeader : 'new',
                        shouldRemain : 'value'
                    },
                    pathElement :  {
                        x : [1, {}, 3],
                        y : [9, 8, {p : 'id'}]
                    },
                    hook : {
                        onBody : ['function () { return 1 + 1; }']
                    }
                });
            });

            it('should not use [ removeParam ] keys in JSON', function () {
                expect(purrl.config('param', 'shouldRemain')).to.equal('value');
            });

            it('should not use [ removeHeader ] keys in JSON', function () {
                expect(purrl.config('header', 'shouldRemain')).to.equal('value');
            });

            it('should not use [ removePathElement ] keys in JSON', function () {
                expect(purrl.config('pathElement', 'y')).to.deep.equal([9, 8, {p : 'id'}]);
            });

            it('should not use [ removeVerb ] keys in JSON', function () {
                expect(purrl.config('verb', 'get')).to.equal('GET');
            });
        });

        describe('when passed a path to a valid configuration file where [ noPromise ] is set', function () {
            before(function (done) {
                fileName = './test-load-config-2.json';
                Q.nfcall(fs.writeFile, fileName, JSON.stringify({
                    noPromise : true
                }))
                .done(function () {
                    purrl = new PURRL();
                    PURRL.loadConfig(purrl, fileName);
                    done();
                });
            });

            after(function () {
                Q.nfcall(fs.unlink, fileName)
                .fail(function (reason) {
                    console.log('Could not remove test generated file [ ' + fileName + ' ]:\n', reason);
                });
            });

            it('should unset [ promise ]', function () {
                expect(purrl.config('promise')).to.be.undefined;
            });
        });

        describe('when passed an invalid path', function () {
            it('should throw an error', function () {
                expect(function () {
                    PURRL.loadConfig(null, './does-not-exist.json');
                }).to.throw(Error, 'Could not load configuration from [ ./does-not-exist.json ].');
            });
        });

        describe('when loading configuration with an invalid option', function () {
            var error;
            before(function (done) {
                fileName = './test-load-config-3.json';
                Q.nfcall(fs.writeFile, fileName, JSON.stringify({
                    badOption : true
                }))
                .done(function () {
                    purrl = new PURRL();
                    purrl.config({
                        hook : {
                            beforeRequestBody : [],
                            onBody : [],
                            onRequest : [],
                            onRequestError : [],
                            onResponse : []
                        }
                    });
                    try {
                        PURRL.loadConfig(purrl, fileName);
                    } catch (e) {
                        error = e;
                    }
                    done();
                });
            });

            after(function () {
                Q.nfcall(fs.unlink, fileName)
                .fail(function (reason) {
                    console.log('Could not remove test generated file [ ' + fileName + ' ]:\n', reason);
                });
            });

            it('should throw an error', function () {
                expect(error).to.be.instanceOf(Error);
                expect(error.message).to.equal('The configuration option [ badOption ] is not supported.');
            });
        });

        describe('when loading configuration with an option that needs more than 1 value', function () {
            var error;
            before(function (done) {
                fileName = './test-load-config-4.json';
                Q.nfcall(fs.writeFile, fileName, JSON.stringify({
                    addHook : 'foo'
                }))
                .done(function () {
                    try {
                        PURRL.loadConfig(new PURRL(), fileName);
                    } catch (e) {
                        error = e;
                    }
                    done();
                });
            });

            after(function () {
                Q.nfcall(fs.unlink, fileName)
                .fail(function (reason) {
                    console.log('Could not remove test generated file [ ' + fileName + ' ]:\n', reason);
                });
            });

            it('should throw an error', function () {
                expect(error).to.be.instanceOf(Error);
                expect(error.message)
                .to.equal('The addHook setting must be passed a hookName [ string ], a value [ function ], and an optional index [ integer ]');
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
                expect(function () {
                    PURRL.hook(purrl, 'notAHook');
                }).to.throw(Error, 'Unrecognized hook name [ notAHook ]');
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
                expect(function () {
                    purrl.header();
                }).to.throw(Error, 'purrl.header() requires a [ key ] string and a [ value ]');
            });
        });

        describe('when called with only a key', function () {
            it('should throw an error', function () {
                expect(function () {
                    purrl.header('accepts');
                }).to.throw(Error, 'purrl.header() requires a [ key ] string and a [ value ]');
            });
        });

        describe('when called with a non-string', function () {
            it('should throw an error', function () {
                expect(function () {
                    purrl.header([], 1);
                }).to.throw(Error, 'purrl.header() requires a [ key ] string and a [ value ]');
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
                expect(function () {
                    purrl.noHeader();
                }).to.throw(Error, 'purrl.noHeader() requires a [ key ] string');
            });
        });
        describe('when called with a non-string key', function () {
            it('should throw an error', function () {
                expect(function () {
                    purrl.noHeader([]);
                }).to.throw(Error, 'purrl.noHeader() requires a [ key ] string');
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
                expect(function () {
                    purrl.param();
                }).to.throw(Error, 'purrl.param() requires a [ key ] string and a [ value ]');
            });
        });

        describe('when called with only a key', function () {
            it('should throw an error', function () {
                expect(function () {
                    purrl.param('key');
                }).to.throw(Error, 'purrl.param() requires a [ key ] string and a [ value ]');
            });
        });

        describe('when called with only a non-string key', function () {
            it('should throw an error', function () {
                expect(function () {
                    purrl.param([], 1);
                }).to.throw(Error, 'purrl.param() requires a [ key ] string and a [ value ]');
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
                expect(function () {
                    purrl.noParam();
                }).to.throw(Error, 'purrl.noParam() requires a [ key ] string');
            });
        });

        describe('when called with a non-string key', function () {
            it('should throw an error', function () {
                expect(function () {
                    purrl.noParam([]);
                }).to.throw(Error, 'purrl.noParam() requires a [ key ] string');
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

    describe('.toUrl()', function () {
        beforeEach(function () {
            purrl.config({
                protocol : 'https',
                host : 'example.com'
            });
        });

        it('should add the configured protocol at the start of the URL', function () {
            expect(purrl.toUrl().indexOf('https')).to.equal(0);
        });

        it('should add the configured host to the URL', function () {
            expect(purrl.toUrl()).to.equal('https://example.com');
        });

        it('should add the configured port to the URL if it is set', function () {
            purrl.config('port', 8080);
            expect(purrl.toUrl()).to.equal('https://example.com:8080');
            expect(purrl('api').toUrl()).to.equal('https://example.com:8080/api');
        });

        it('should clear the internal [ path ] array', function () {
            purrl('started', 'the', 'part').toUrl();
            expect(purrl[' internal'].path).to.deep.equal([]);
        });

        it('should clear the internal [ requestParam ] array', function () {
            purrl[' internal'].requestParam.key = 'VALUE';
            purrl.toUrl();
            expect(purrl[' internal'].requestParam).to.deep.equal({});
        });

        it('should clear the internal [ requestHeader ] array', function () {
            purrl[' internal'].requestHeader.accept = 'application/json';
            purrl.toUrl();
            expect(purrl[' internal'].requestHeader).to.deep.equal({});
        });

        it('should throw an error when [ host ] is not configured', function () {
            delete purrl[' internal'].host;
            expect(function () {
                purrl(1).toUrl();
            }).to.throw(Error, 'Cannot generate a URL. The host is not configured.');
            expect(purrl[' internal'].path).to.deep.equal([]);
        });

        describe('when placeholders remain in the internal [ path ]', function () {
            beforeEach(function () {
                purrl.config('pathElement', 'placeholder', {});
            });

            it('should throw an error', function () {
                expect(function () {
                    purrl.placeholder.toUrl();
                }).to.throw(Error, 'Cannot generate the URL path. Placeholders remain.');
                expect(purrl[' internal'].path).to.deep.equal([]);
            });

            it('should not call the [ beforePath ] hook', function () {
                var beforePath = sinon.stub();
                purrl.placeholder.config('hook', 'beforePath', beforePath);
                expect(function () {
                    purrl.toUrl();
                }).to.throw(Error, 'Cannot generate the URL path. Placeholders remain.');
                expect(beforePath.callCount).to.equal(0);
            });
        });

        describe('differs from sending a request', function () {
            var requestStub, beforeRequest;
            beforeEach(function () {
                requestStub = sinon.stub(require('https'), 'request');
                beforeRequest = sinon.stub();
                purrl.config('hook', 'beforeRequest', beforeRequest);
            });

            afterEach(function () {
                requestStub.restore();
            });

            it('should not invoke the [ beforeRequest ] hook', function () {
                purrl.toUrl();
                expect(beforeRequest.callCount).to.equal(0);
            });

            it('should not call the protocol\'s [ request() ]', function () {
                purrl.toUrl();
                expect(requestStub.callCount).to.equal(0);
            });
        });

        describe('[ beforePath ] hook', function () {
            var beforePath;
            beforeEach(function () {
                beforePath = sinon.stub();
                purrl.config('hook', 'beforePath', beforePath);
            });

            it('should be called', function () {
                purrl(5, 4, 3, 2, 1).toUrl();
                expect(beforePath.callCount).to.equal(1);
                expect(beforePath.firstCall.args[0].path).to.deep.equal([5, 4, 3, 2, 1]);
            });

            it('should send the path segments before URL encoding', function () {
                purrl('^^^').toUrl();
                expect(beforePath.firstCall.args[0].path).to.deep.equal(['^^^']);
            });

            it('should allow the [ beforePath ] hook to alter the path segments', function () {
                purrl.config('hook', 'beforePath', function (context) {
                    context.path.push('&&&', 'test');
                });
                expect(purrl('1').toUrl()).to.equal('https://example.com/1/%26%26%26/test');
            });

            it('should allow the [ beforePath ] hook to replace the path', function () {
                purrl.config('hook', 'beforePath', function (context) {
                    context.path = [{test : 'object'}, 'something', 'new'];
                });
                expect(purrl(1, 2, 3).toUrl()).to.equal('https://example.com/%7B%22test%22%3A%22object%22%7D/something/new');
            });
        });

        it('should build a correct URL', function () {
            purrl.config('param', {
                optOne : 'on&&e'
            })
            .config('param', 'option^:^Two', 'two two');

            expect(purrl.param('three', 3)(1, 'part', {of : 'the'}, {toString : function () { return 'path'; }}).toUrl())
            .to.equal('https://example.com/1/part/%7B%22of%22%3A%22the%22%7D/path?optOne=on%26%26e&option%5E%3A%5ETwo=two%20two&three=3');
        });

        describe('when a [ key ] is set to [ undefined ] in [ requestParam ]', function () {
            it('should suppress that value if it is set in [ param ]', function () {
                purrl.config({
                    host : 'example.com',
                    param : {
                        key : 'KEY',
                        token : 'TOKEN'
                    }
                });
                expect(purrl.noParam('key')('api').toUrl()).to.equal('https://example.com/api?token=TOKEN');
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
            expect(function () {
                purrl(1).get();
            }).to.throw(Error, 'Cannot send the request. The host is not configured.');
            expect(purrl[' internal'].path).to.deep.equal([]);
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
            (1, 'part', {of : 'the'}, {toString : function () { return 'path'; }}).get();

            expect(requestStub.firstCall.args).to.deep.equal([{
                hostname : 'example.com',
                port : 8080,
                headers : {
                    'content-type' : 'application/json',
                    'content-length' : '1024',
                    'x-powered-by' : 'PURRL'
                },
                method : 'GET',
                path : '/1/part/%7B%22of%22%3A%22the%22%7D/path?optOne=on%26%26e&option%5E%3A%5ETwo=two%20two&three=3'
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

        describe('when the [ response ] event is triggered with a 2xx code with [ promise ] set', function () {
            var responseObject, onResponse, onResponseError, onData, onBody, deferred;
            function Promise () {}
            beforeEach(function () {
                var ctr, len;
                onResponse = sinon.stub();
                onResponseError = sinon.stub();
                onData = sinon.stub();
                onBody = sinon.stub();
                deferred = Q.defer();
                Promise.defer = sinon.stub().returns(deferred);
                purrl.config({
                    hook : {
                        onResponse : onResponse,
                        onResponseError : onResponseError,
                        onData : onData,
                        onBody : onBody
                    },
                    promise : Promise
                }).get();
                responseObject = {
                    on : sinon.stub(),
                    statusCode : 200
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

            it('should register a listener for the [ error ] event on the response object.', function () {
                expect(responseObject.on.calledWith('error')).to.be.true;
            });

            describe('[ data ], [ error ] and [ end ] handling', function () {
                var sendData, sendEnd, sendError;
                beforeEach(function () {
                    var ctr, len;
                    for (ctr = 0, len = responseObject.on.callCount; ctr < len; ctr++) {
                        if (responseObject.on.getCall(ctr).args[0] === 'data') {
                            sendData = responseObject.on.getCall(ctr).args[1];
                        }
                        if (responseObject.on.getCall(ctr).args[0] === 'end') {
                            sendEnd = responseObject.on.getCall(ctr).args[1];
                        }
                        if (responseObject.on.getCall(ctr).args[0] === 'error') {
                            sendError = responseObject.on.getCall(ctr).args[1];
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

                it('should resolve the promise with the body when `end` is emitted', function (done) {
                    deferred.promise
                    .then(function (body) {
                        expect(body).to.equal('of work');
                    })
                    .done(done);
                    sendData('of work');
                    sendEnd();
                });

                it('should allow [ onData ] to alter the body used to resolve', function (done) {
                    purrl.config('hook', 'onBody', function (context) {
                        context.body = context.body.toUpperCase();
                    });
                    deferred.promise
                    .then(function (body) {
                        expect(body).to.equal('OF WORK');
                    })
                    .done(done);
                    sendData('of work');
                    sendEnd();
                });

                it('should reject the promise with the error when `error` is emitted', function (done) {
                    deferred.promise
                    .then(function () {
                        expect(true, 'An error should have been thrown').to.be.false;
                    }, function (reason) {
                        expect(reason).to.equal('Arrgh!');
                    }).done(done);
                    sendError('Arrgh!');
                });

                it('should call the onResponseError hook when `error` is emitted', function () {
                    sendError('error');
                    expect(onResponseError.callCount).to.equal(1);
                });
            });
        });

        describe('when the [ response ] event is triggered with a non 200 code with [ promise ] set', function () {
            var responseObject, onResponse, onResponseError, onData, onBody, promise;
            beforeEach(function () {
                var ctr, len;
                onResponse = sinon.stub();
                onResponseError = sinon.stub();
                onData = sinon.stub();
                onBody = sinon.stub();
                promise = purrl.config({
                    hook : {
                        onResponse : onResponse,
                        onResponseError : onResponseError,
                        onData : onData,
                        onBody : onBody
                    }
                }).get();
                responseObject = {
                    on : sinon.stub(),
                    statusCode : 404
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

            it('should register a listener for the [ error ] event on the response object.', function () {
                expect(responseObject.on.calledWith('error')).to.be.true;
            });

            describe('[ data ], [ error ] and [ end ] handling', function () {
                var sendData, sendEnd, sendError;
                beforeEach(function () {
                    var ctr, len;
                    for (ctr = 0, len = responseObject.on.callCount; ctr < len; ctr++) {
                        if (responseObject.on.getCall(ctr).args[0] === 'data') {
                            sendData = responseObject.on.getCall(ctr).args[1];
                        }
                        if (responseObject.on.getCall(ctr).args[0] === 'end') {
                            sendEnd = responseObject.on.getCall(ctr).args[1];
                        }
                        if (responseObject.on.getCall(ctr).args[0] === 'error') {
                            sendError = responseObject.on.getCall(ctr).args[1];
                        }
                    }
                });

                it('should call the [ onData ] or [ onBody ] hooks', function () {
                    sendData('first');
                    sendData(' second');
                    sendData(' third');
                    sendEnd();
                    expect(onData.callCount).to.equal(3);
                    expect(onBody.callCount).to.equal(1);
                });

                it('should call the onResponseError hook when `error` is emitted', function () {
                    sendError('error');
                    expect(onResponseError.callCount).to.equal(1);
                });

                it('should reject the promise with the code and a description', function (done) {
                    promise
                    .fail(function (reason) {
                        expect(reason.code).to.equal(404);
                        expect(reason.description).to.equal('Not Found');
                        expect(reason.body).to.equal('Not There');
                        expect(reason.message).to.equal('Non-success HTTP code [ 404 ]: Not There');
                    })
                    .done(done);
                    sendData('Not There');
                    sendEnd();
                });

                it('should reject the promise with the code and a description', function (done) {
                    promise
                    .fail(function (reason) {
                        expect(reason.code).to.equal(404);
                        expect(reason.description).to.equal('Not Found');
                        expect(reason.body).to.equal('');
                        expect(reason.message).to.equal('Non-success HTTP code');
                    })
                    .done(done);
                    sendEnd();
                });
            });
        });

        describe('when the [ response ] event is triggered with [ promise ] unset', function () {
            var responseObject, onResponse, onData, onBody, onResponseError;
            beforeEach(function () {
                var ctr, len;
                onResponse = sinon.stub();
                onData = sinon.stub();
                onBody = sinon.stub();
                onResponseError = sinon.stub();
                purrl.config({
                    hook : {
                        onResponse : onResponse,
                        onData : onData,
                        onBody : onBody,
                        onResponseError : onResponseError
                    },
                    noPromise : true
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

            it('should register a listener for the [ error ] event on the response object.', function () {
                expect(responseObject.on.calledWith('error')).to.be.true;
            });

            describe('[ data ], [ error ] and [ end ] handling', function () {
                var sendData, sendEnd, sendError;
                beforeEach(function () {
                    var ctr, len;
                    for (ctr = 0, len = responseObject.on.callCount; ctr < len; ctr++) {
                        if (responseObject.on.getCall(ctr).args[0] === 'data') {
                            sendData = responseObject.on.getCall(ctr).args[1];
                        }
                        if (responseObject.on.getCall(ctr).args[0] === 'end') {
                            sendEnd = responseObject.on.getCall(ctr).args[1];
                        }
                        if (responseObject.on.getCall(ctr).args[0] === 'error') {
                            sendError = responseObject.on.getCall(ctr).args[1];
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

                it('should call the onResponseError hook when `error` is emitted', function () {
                    sendError('error');
                    expect(onResponseError.callCount).to.equal(1);
                    expect(onResponseError.firstCall.args[0].error).to.equal('error');
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

        describe('when [ error ] event is triggered with [ promise ] set', function () {
            it('should call the onRequestError hook and reject the promise', function (done) {
                var ctr, len, testError = new Error('Test Error'), onRequestErrorStub = sinon.stub();
                purrl.config('hook', 'onRequestError', onRequestErrorStub).get()
                .fail(function (error) {
                    expect(error).to.equal(testError);
                }).done(done);
                for (ctr = 0, len = requestObject.on.callCount; ctr < len; ctr++) {
                    if (requestObject.on.getCall(ctr).args[0] === 'error') {
                        requestObject.on.getCall(ctr).args[1](testError);
                        break;
                    }
                }
                expect(onRequestErrorStub.callCount).to.equal(1);
                expect(onRequestErrorStub.firstCall.args[0].error).to.equal(testError);
            });

            it('should allow onRequestError hook to alter the error used to reject the promise', function (done) {
                var ctr, len, testError = new Error('Test Error');
                purrl.config('hook', 'onRequestError', function (context) { context.error = testError; }).get()
                .fail(function (error) {
                    expect(error).to.equal(testError);
                }).done(done);
                for (ctr = 0, len = requestObject.on.callCount; ctr < len; ctr++) {
                    if (requestObject.on.getCall(ctr).args[0] === 'error') {
                        requestObject.on.getCall(ctr).args[1]('Um, Guys?');
                        break;
                    }
                }
            });
        });

        describe('when [ error ] event is triggered with [ promise ] unset', function () {
            it('should call the onRequestError hook', function () {
                var ctr, len, testError = new Error('Test Error'), onRequestErrorStub = sinon.stub();
                purrl.config('noPromise');
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

        describe('verb methods when a [ promise ] is set', function () {
            var deferred;
            function Promise () {}
            beforeEach(function () {
                deferred = Q.defer();
                Promise.defer = sinon.stub().returns(deferred);
                purrl.config('promise', Promise);
                Promise.defer.reset();
            });

            it('should call the [ defer() ] method of the promise library', function () {
                purrl.get();
                expect(Promise.defer.callCount).to.equal(1);
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

        it('should output the non 200 response from the call to the console', function () {
            purrl[' internal'].hook.onResponseError[0].call(null, {error : {code : 404, description : 'Not Found'}});
            expect(console.log.callCount).to.equal(1);
            expect(console.log.firstCall.args).to.deep.equal(['404: Not Found']);
        });

        it('should output the response error from the call to the console', function () {
            purrl[' internal'].hook.onResponseError[0].call(null, {error : 'Something bad happened.'});
            expect(console.log.callCount).to.equal(1);
            expect(console.log.firstCall.args).to.deep.equal(['Something bad happened.']);
        });
    });

    describe('in the REPL', function () {
        var fileName, clients, contextObj, requestContext;
        beforeEach(function () {
            requestContext = {
                replCallback : sinon.stub()
            };
            contextObj = {
                getRequestContext : sinon.stub().returns(requestContext)
            };
            // Get the default purrl client
            clients = PURRL.createReplClients('./does-not-exist.json', false);
            purrl = clients.purrl;
        });

        describe('when a client does not initialize a promise library', function () {
            before(function (done) {
                fileName = './test-repl-config-4.json';
                Q.nfcall(fs.writeFile, fileName, JSON.stringify({
                    purrl : {
                        host : 'example.com',
                        noPromise : 'true'
                    }
                })).done(done);
            });

            beforeEach(function () {
                clients = PURRL.createReplClients(fileName);
                purrl = clients.purrl;
            });

            after(function () {
                Q.nfcall(fs.unlink, fileName)
                .fail(function (reason) {
                    console.log('Could not remove test generated file [ ' + fileName + ' ]:\n', reason);
                });
            });

            it('should set [ clients.allPromise ] to false', function () {
                expect(Object.keys(clients)).to.not.include('allPromise');
                expect(clients.allPromise).to.be.false;
            });

            it('should put the replCallback in the request context beforeRequest', function () {
                var temp = requestContext.replCallback;
                global[' requestCallback'] = sinon.stub().returns(temp);
                delete requestContext.replCallback;
                try {
                    PURRL.hook(purrl, 'beforeRequest', contextObj);
                    expect(contextObj.getRequestContext.callCount).to.equal(1);
                    expect(requestContext.replCallback).to.equal(temp);
                } finally {
                    delete global[' requestCallback'];
                }
            });

            it('should call the REPL callback with the results from the call', function () {
                contextObj.body = 'The whole enchilada.';
                PURRL.hook(purrl, 'onBody', contextObj);
                expect(contextObj.getRequestContext.callCount).to.equal(1);
                expect(requestContext.replCallback.callCount).to.equal(1);
                expect(requestContext.replCallback.firstCall.args).to.deep.equal([null, 'The whole enchilada.']);
            });

            it('should call the REPL callback with the error from the call', function () {
                contextObj.error = 'Something bad happened.';
                PURRL.hook(purrl, 'onRequestError', contextObj);
                expect(contextObj.getRequestContext.callCount).to.equal(1);
                expect(requestContext.replCallback.callCount).to.equal(1);
                expect(requestContext.replCallback.firstCall.args).to.deep.equal(['Something bad happened.']);
            });

            it('should call the REPL callback with the response error from the call', function () {
                contextObj.error = 'Something bad happened.';
                PURRL.hook(purrl, 'onResponseError', contextObj);
                expect(contextObj.getRequestContext.callCount).to.equal(1);
                expect(requestContext.replCallback.callCount).to.equal(1);
                expect(requestContext.replCallback.firstCall.args).to.deep.equal(['Something bad happened.']);
            });
        });

        describe('when all clients initialize promises', function () {
            it('should NOT put the replCallback in the request context beforeRequest', function () {
                var temp = requestContext.replCallback;
                global[' requestCallback'] = sinon.stub().returns(temp);
                delete requestContext.replCallback;
                try {
                    PURRL.hook(purrl, 'beforeRequest', contextObj);
                    expect(contextObj.getRequestContext.callCount).to.equal(0);
                    expect(requestContext.replCallback).to.be.undefined;
                } finally {
                    delete global[' requestCallback'];
                }
            });

            it('should set [ clients.allPromise ] to true', function () {
                expect(Object.keys(clients)).to.not.include('allPromise');
                expect(clients.allPromise).to.be.true;
            });

            it('should NOT call the REPL callback with the results from the call', function () {
                contextObj.body = 'The whole enchilada.';
                PURRL.hook(purrl, 'onBody', contextObj);
                expect(contextObj.getRequestContext.callCount).to.equal(0);
                expect(requestContext.replCallback.callCount).to.equal(0);
            });

            it('should NOT call the REPL callback with the error from the call', function () {
                contextObj.error = 'Something bad happened.';
                PURRL.hook(purrl, 'onRequestError', contextObj);
                expect(contextObj.getRequestContext.callCount).to.equal(0);
                expect(requestContext.replCallback.callCount).to.equal(0);
            });

            it('should NOT call the REPL callback with the response error from the call', function () {
                contextObj.error = 'Something bad happened.';
                PURRL.hook(purrl, 'onResponseError', contextObj);
                expect(contextObj.getRequestContext.callCount).to.equal(0);
                expect(requestContext.replCallback.callCount).to.equal(0);
            });
        });

        describe('with bad REPL config', function () {
            var purrl, fileName;
            before(function (done) {
                fileName = './test-repl-config-1.json';
                Q.nfcall(fs.writeFile, fileName, JSON.stringify({
                    cl1 : {},
                    cl2 : {
                        badOption : 'not good'
                    }
                }))
                .done(function () {
                    done();
                });
            });

            after(function () {
                Q.nfcall(fs.unlink, fileName)
                .fail(function (reason) {
                    console.log('Could not remove test generated file [ ' + fileName + ' ]:\n', reason);
                });
            });

            it('should throw an error', function () {
                expect(function () {
                    purrl = PURRL.createReplClients(fileName);
                }).to.throw(Error, 'The configuration option [ badOption ] is not supported.');
            });
        });

        describe('with bad REPL JSON', function () {
            var fileName;
            before(function (done) {
                fileName = './test-repl-config-2.json';
                Q.nfcall(fs.writeFile, fileName, '{badjson:true}')
                .done(function () {
                    done();
                });
            });

            after(function () {
                Q.nfcall(fs.unlink, fileName)
                .fail(function (reason) {
                    console.log('Could not remove test generated file [ ' + fileName + ' ]:\n', reason);
                });
            });

            it('should throw an error', function () {
                expect(function () {
                    PURRL.createReplClients(fileName);
                }).to.throw(Error);
            });
        });

        describe('with good REPL JSON', function () {
            var fileName, clients;
            before(function (done) {
                fileName = './test-repl-config-3.json';
                Q.nfcall(fs.writeFile, fileName, JSON.stringify({
                    purrl : {
                        host : 'example.com'
                    },
                    cli1 : {
                        host : 'localhost',
                        port : 8080
                    },
                    cli2 : {
                        protocol : 'https',
                        host : 'localhost',
                        port : 8443
                    }
                }))
                .done(function () {
                    clients = PURRL.createReplClients(fileName);
                    done();
                });
            });

            after(function () {
                Q.nfcall(fs.unlink, fileName)
                .fail(function (reason) {
                    console.log('Could not remove test generated file [ ' + fileName + ' ]:\n', reason);
                });
            });

            it('should create multiple clients', function () {
                expect(clients).to.have.property('purrl');
                expect(clients).to.have.property('cli1');
                expect(clients).to.have.property('cli2');
            });

            it('should configure each according to it\'s individual configuration', function () {
                expect(clients.purrl.toUrl()).to.equal('http://example.com');
                expect(clients.cli1.toUrl()).to.equal('http://localhost:8080');
                expect(clients.cli2.toUrl()).to.equal('https://localhost:8443');
            });
        });
    });
});
