define([
    'sdk/utils/Deferred',
    'jasmine/jasmine'
  ],
  function(Deferred) {

    describe('utils/Deferred', function() {
        var deferred;

        beforeEach(function() {
            deferred = new Deferred();
        });

        describe('-> Promise', function() {

            describe('#init', function() {

                it('should define and set some properties', function() {
                    expect(deferred.promise.callbacks).not.toBe(undefined);
                    expect(deferred.promise.callbacks.length).toBe(0);
                    expect(deferred.promise.errbacks).not.toBe(undefined);
                    expect(deferred.promise.errbacks.length).toBe(0);
                    expect(deferred.promise.resolved).toBe(false);
                    expect(deferred.promise.failed).toBe(false);
                    expect(deferred.promise.resolutionArg).toBe(undefined);
                });

            });

            describe('#addSuccessCallback', function() {

                it('should throw if passed a non-function', function() {
                    expect(function() { deferred.promise.addSuccessCallback('flibble'); }).toThrow();
                });

                it('should call the callback immediately with the resolution args if it is already resolved', function() {
                    deferred.promise.resolved = true;
                    deferred.promise.resolutionArg = 'boop';
                    var callback = jasmine.createSpy('callback');

                    deferred.promise.addSuccessCallback(callback);

                    expect(callback).toHaveBeenCalledWith('boop');
                });

                it('should add the callback to the queue if it is not already resolved or failed', function() {
                    var callback = jasmine.createSpy('callback');

                    deferred.promise.addSuccessCallback(callback);

                    expect(deferred.promise.callbacks.length).toBe(1);
                    expect(deferred.promise.callbacks[0]).toBe(callback);
                });

                it('should, if passed a failure callback, add it and link the two', function() {
                    var callback = function() {},
                        errback = function() {};

                    deferred.promise.addSuccessCallback(callback, errback);

                    expect(deferred.promise.callbacks[0]).toBe(callback);
                    expect(deferred.promise.errbacks[0]).toBe(errback);
                    expect(deferred.promise.callbacks[0].errback).toBe(errback);
                    expect(deferred.promise.errbacks[0].callback).toBe(callback);
                });

                it('should return a new promise for chaining', function() {
                    var result = deferred.promise.addSuccessCallback(function() {}),
                        result2 = deferred.promise.addSuccessCallback(function() {}, function() {});

                    expect(result instanceof deferred.promise.constructor).toBe(true);
                    expect(result).not.toBe(deferred.promise);
                    expect(result2 instanceof deferred.promise.constructor).toBe(true);
                    expect(result).not.toBe(deferred.promise);
                });

                it('should, if resolved, return a new promise that is also already resolved', function() {
                    var promise, newPromise;

                    deferred.resolve('unagi');
                    newPromise = deferred.promise.addSuccessCallback(function() {});

                    expect(newPromise.resolved).toBe(true);
                });

                it('should, if failed, return a new promise that is also already failed', function() {
                    var promise, newPromise;

                    deferred.fail('maki');
                    newPromise = deferred.promise.addSuccessCallback(function() {});

                    expect(newPromise.failed).toBe(true);
                });

                it('should, if cancelled, return a new promise that is also already cancelled', function() {
                    var promise, newPromise;

                    deferred.cancel();
                    newPromise = deferred.promise.addSuccessCallback(function() {});

                    expect(newPromise.cancelled).toBe(true);
                });

            });

            it('should have a function "then" as an alias to "addSuccessCallback"', function() {
                expect(deferred.promise.then).toBe(deferred.promise.addSuccessCallback);
            });

            describe('#addFailureCallback', function() {

                it('should throw if passed a non-function', function() {
                    expect(function() { deferred.promise.addFailureCallback('flibble'); }).toThrow();
                });

                it('should call the callback immediately with the resolution args if it is already failed', function() {
                    deferred.promise.failed = true;
                    deferred.promise.resolutionArg = 'boop';
                    var callback = jasmine.createSpy('callback');

                    deferred.promise.addFailureCallback(callback);

                    expect(callback).toHaveBeenCalledWith('boop');
                });

                it('should add the callback to the queue if it is not already resolved or failed', function() {
                    var callback = jasmine.createSpy('callback');

                    deferred.promise.addFailureCallback(callback);

                    expect(deferred.promise.errbacks.length).toBe(1);
                    expect(deferred.promise.errbacks[0]).toBe(callback);
                });

                it('should return a new promise for chaining', function() {
                    var result = deferred.promise.addFailureCallback(function() {});

                    expect(result instanceof deferred.promise.constructor).toBe(true);
                    expect(result).not.toBe(deferred.promise);
                });

                it('should, if resolved, return a new promise that is also already resolved', function() {
                    var promise, newPromise;

                    deferred.resolve('unagi');
                    newPromise = deferred.promise.addFailureCallback(function() {});

                    expect(newPromise.resolved).toBe(true);
                });

                it('should, if failed, return a new promise that is also already failed', function() {
                    var promise, newPromise;

                    deferred.fail('maki');
                    newPromise = deferred.promise.addFailureCallback(function() {});

                    expect(newPromise.failed).toBe(true);
                });

                it('should, if cancelled, return a new promise that is also already cancelled', function() {
                    var promise, newPromise;

                    deferred.cancel();
                    newPromise = deferred.promise.addFailureCallback(function() {});

                    expect(newPromise.cancelled).toBe(true);
                });

            });

            it('should have a function "otherwise" as an alias to "addFailureCallback"', function() {
                expect(deferred.promise.otherwise).toBe(deferred.promise.addFailureCallback);
            });

            describe('#cancel', function() {

                it('should prevent any future calls to Deferred#resolve or' +
                  ' from running its callbacks', function() {

                    var callback1 = jasmine.createSpy('callback1'),
                        callback2 = jasmine.createSpy('callback2'),
                        callback3 = jasmine.createSpy('callback3'),
                        callback4 = jasmine.createSpy('callback4'),
                        callback5 = jasmine.createSpy('callback5'),
                        callback6 = jasmine.createSpy('callback6'),
                        deferred2 = new Deferred();

                    deferred.promise.then(callback1);
                    deferred.resolve(true);
                    deferred.promise.then(callback2);
                    deferred.promise.cancel();
                    deferred.promise.then(callback3);

                    expect(callback1).toHaveBeenCalled();
                    expect(callback2).toHaveBeenCalled();
                    expect(callback3).not.toHaveBeenCalled();

                    deferred2.promise.then(callback4);
                    deferred2.promise.cancel();
                    deferred2.promise.then(callback5);
                    deferred2.resolve(true);
                    deferred2.promise.then(callback6);

                    expect(callback4).not.toHaveBeenCalled();
                    expect(callback5).not.toHaveBeenCalled();
                    expect(callback6).not.toHaveBeenCalled();

                });

                it('should cancel all linked Deferreds both up and down the chain', function() {
                    var promise2, promise3;

                    promise2 = deferred.promise.addSuccessCallback(function() {});
                    promise3 = promise2.addSuccessCallback(function() {});

                    promise2.cancel();

                    expect(promise2.cancelled).toBe(true);
                    expect(deferred.promise.cancelled).toBe(true);
                    expect(promise3.cancelled).toBe(true);
                });

            });

        });


        describe('#init', function() {

            it('creates a new Promise', function() {
                expect(deferred.promise).not.toBe(undefined);
            });

        });

        describe('#resolve', function() {

            it('should do nothing if the promise is already resolved', function() {
                var callback = jasmine.createSpy('callback');
                deferred.promise.addSuccessCallback(callback);
                deferred.promise.resolved = true;

                deferred.resolve('woop');

                expect(callback).not.toHaveBeenCalled();
            });

            it('should do nothing if the promise is failed', function() {
                var callback = jasmine.createSpy('callback');
                deferred.promise.addSuccessCallback(callback);
                deferred.promise.failed = true;

                deferred.resolve('woop');

                expect(callback).not.toHaveBeenCalled();
            });

            it('should set promise.resolved to true', function() {
                deferred.resolve('woop');
                expect(deferred.promise.resolved).toBe(true);
            });

            it('should record the arguments in promise.resolutionArg', function() {
                var arg1 = 'woop';

                deferred.resolve(arg1);

                expect(deferred.promise.resolutionArg).toBe('woop');
            });

            it('should apply the arguments to all stored callbacks', function() {
                var callback1 = jasmine.createSpy('callback1'),
                    callback2 = jasmine.createSpy('callback2');
                deferred.promise.addSuccessCallback(callback1);
                deferred.promise.addSuccessCallback(callback2);

                deferred.resolve('dingo bingo');

                expect(callback1).toHaveBeenCalledWith('dingo bingo');
                expect(callback2).toHaveBeenCalledWith('dingo bingo');
            });

            it('should also resolve all child Deferreds with the returned value from the callback that generated them', function() {
                var promise1, promise2,
                    callback1 = function(result){ return 'I love '+result; },
                    callback2 = function(result){ return 'I hate '+result; },
                    promise1callback = jasmine.createSpy('callback1'),
                    promise2callback = jasmine.createSpy('callback2');

                promise1 = deferred.promise.addSuccessCallback(callback1);
                promise2 = deferred.promise.addSuccessCallback(callback2);
                promise1.addSuccessCallback(promise1callback);
                promise2.addSuccessCallback(promise2callback);

                deferred.resolve('dingo bingo');

                expect(promise1callback).toHaveBeenCalledWith('I love dingo bingo');
                expect(promise2callback).toHaveBeenCalledWith('I hate dingo bingo');
            });

            it('should, if the callback returns a promise, resolve or fail the callback\'s child Deferred with the resolution/failure value of that promise', function() {
                var promise1, promise2,
                    deferred1 = new Deferred(),
                    deferred2 = new Deferred(),
                    callback1 = function(result){ return deferred1.promise; },
                    callback2 = function(result){ return deferred2.promise; },
                    promise1callback = jasmine.createSpy('promise1callback'),
                    promise1errback = jasmine.createSpy('promise1errback'),
                    promise2callback = jasmine.createSpy('promise2callback'),
                    promise2errback = jasmine.createSpy('promise2errback');

                promise1 = deferred.promise.addSuccessCallback(callback1);
                promise2 = deferred.promise.addSuccessCallback(callback2);
                promise1.addSuccessCallback(promise1callback);
                promise1.addFailureCallback(promise1errback);
                promise2.addSuccessCallback(promise2callback);
                promise2.addFailureCallback(promise2errback);

                deferred.resolve('dingo bingo');
                deferred1.resolve('hells yes');
                deferred2.fail('hells no');

                expect(promise1callback).toHaveBeenCalledWith('hells yes');
                expect(promise1errback).not.toHaveBeenCalled();
                expect(promise2callback).not.toHaveBeenCalled();
                expect(promise2errback).toHaveBeenCalledWith('hells no');
            });

            it('should, if the callback returns a failed promise and there is a'+
              ' linked failure callback, not call the failure callback and propogate'+
              ' the failure down the tree', function() {
                var promise,
                    deferred1 = new Deferred(),
                    deferred2 = new Deferred(),
                    callbacks = {
                        one: function(result){ return deferred1.promise; },
                        two: function(result){ return deferred2.promise; }
                    },
                    promiseCallback = jasmine.createSpy('promiseCallback'),
                    promiseErrback = jasmine.createSpy('promiseErrback');

                spyOn(callbacks, 'two').andCallThrough();

                promise = deferred.promise.addSuccessCallback(callbacks.one, callbacks.two);
                promise.addSuccessCallback(promiseCallback);
                promise.addFailureCallback(promiseErrback);

                deferred.resolve('dingo bingo');
                deferred1.fail('hells yes');
                deferred2.fail('hells yeah');

                expect(promiseCallback).not.toHaveBeenCalled();
                expect(promiseErrback).toHaveBeenCalledWith('hells yes');
                expect(callbacks.two).not.toHaveBeenCalled();
            });

            it('should, if the callback returns a failed promise and there is no linked failure callback, propogate the failure down the tree', function() {
                var promise1, promise2,
                    deferred1 = new Deferred(),
                    deferred2 = new Deferred(),
                    callback1 = function(result){ return deferred1.promise; },
                    callback2 = function(result){ return deferred2.promise; },
                    promise1Callback = jasmine.createSpy('promise1Callback'),
                    promise1Errback = jasmine.createSpy('promise1Errback'),
                    promise2Callback = jasmine.createSpy('promise2Callback'),
                    promise2Errback = jasmine.createSpy('promise2Errback');

                promise1 = deferred.promise.addSuccessCallback(callback1);
                promise2 = deferred.promise.addFailureCallback(callback2);
                promise1.addSuccessCallback(promise1Callback);
                promise1.addFailureCallback(promise1Errback);
                promise2.addSuccessCallback(promise2Callback);
                promise2.addFailureCallback(promise2Errback);

                deferred.resolve('dingo bingo');
                deferred1.fail('hells yes');
                deferred2.fail('hells yeah');

                expect(promise1Callback).not.toHaveBeenCalled();
                expect(promise1Errback).toHaveBeenCalledWith('hells yes');
                expect(promise2Callback).not.toHaveBeenCalled();
                expect(promise2Errback).not.toHaveBeenCalled();
            });

        });

        describe('#fail', function() {

            it('should do nothing if the promise is resolved', function() {
                var callback = jasmine.createSpy('callback');
                deferred.promise.addSuccessCallback(callback);
                deferred.promise.resolved = true;

                deferred.fail('woop');

                expect(callback).not.toHaveBeenCalled();
            });

            it('should do nothing if the promise is already failed', function() {
                var callback = jasmine.createSpy('callback');
                deferred.promise.addSuccessCallback(callback);
                deferred.promise.failed = true;

                deferred.fail('woop');

                expect(callback).not.toHaveBeenCalled();
            });

            it('should set promise.failed to true', function() {
                deferred.fail('woop');
                expect(deferred.promise.failed).toBe(true);
            });

            it('should record the arguments in promise.resolutionArg', function() {
                var arg1 = 'woop';

                deferred.fail(arg1);

                expect(deferred.promise.resolutionArg).toBe('woop');
            });

            it('should apply the arguments to all stored errbacks', function() {
                var callback1 = jasmine.createSpy('callback1'),
                    callback2 = jasmine.createSpy('callback2');
                deferred.promise.addFailureCallback(callback1);
                deferred.promise.addFailureCallback(callback2);

                deferred.fail('dingo bingo');

                expect(callback1).toHaveBeenCalledWith('dingo bingo');
                expect(callback2).toHaveBeenCalledWith('dingo bingo');
            });

            it('should also fail all child Deferreds with the returned value from the callback that generated them', function() {
                var promise1, promise2,
                    callback1 = function(result){ return 'I love '+result; },
                    callback2 = function(result){ return 'I hate '+result; },
                    promise1callback = jasmine.createSpy('callback1'),
                    promise2callback = jasmine.createSpy('callback2');

                promise1 = deferred.promise.addFailureCallback(callback1);
                promise2 = deferred.promise.addFailureCallback(callback2);
                promise1.addFailureCallback(promise1callback);
                promise2.addFailureCallback(promise2callback);

                deferred.fail('dingo bingo');

                expect(promise1callback).toHaveBeenCalledWith('I love dingo bingo');
                expect(promise2callback).toHaveBeenCalledWith('I hate dingo bingo');
            });

            it('should, if the callback returns a promise, resolve or fail the callback\'s child Deferred with the resolution/failure value of that promise', function() {
                var promise1, promise2,
                    deferred1 = new Deferred(),
                    deferred2 = new Deferred(),
                    callback1 = function(result){ return deferred1.promise; },
                    callback2 = function(result){ return deferred2.promise; },
                    promise1callback = jasmine.createSpy('promise1callback'),
                    promise1errback = jasmine.createSpy('promise1errback'),
                    promise2callback = jasmine.createSpy('promise2callback'),
                    promise2errback = jasmine.createSpy('promise2errback');

                promise1 = deferred.promise.addFailureCallback(callback1);
                promise2 = deferred.promise.addFailureCallback(callback2);
                promise1.addSuccessCallback(promise1callback);
                promise1.addFailureCallback(promise1errback);
                promise2.addSuccessCallback(promise2callback);
                promise2.addFailureCallback(promise2errback);

                deferred.fail('dingo bingo');
                deferred1.resolve('hells yes');
                deferred2.fail('hells no');

                expect(promise1callback).toHaveBeenCalledWith('hells yes');
                expect(promise1errback).not.toHaveBeenCalled();
                expect(promise2callback).not.toHaveBeenCalled();
                expect(promise2errback).toHaveBeenCalledWith('hells no');
            });

            it('should, if the callback returns a resolved promise and there is a linked success callback, call the success callback with the result', function() {
                var promise,
                    deferred1 = new Deferred(),
                    deferred2 = new Deferred(),
                    callback1 = function(result){ return deferred1.promise; },
                    callback2 = function(result){ return deferred2.promise; },
                    promiseCallback = jasmine.createSpy('promiseCallback'),
                    promiseErrback = jasmine.createSpy('promiseErrback');

                promise = deferred.promise.addSuccessCallback(callback1, callback2);
                promise.addSuccessCallback(promiseCallback);
                promise.addFailureCallback(promiseErrback);

                deferred.fail('dingo bingo');
                deferred1.resolve('hells yes');
                deferred2.resolve('hells yeah');

                expect(promiseCallback).toHaveBeenCalledWith('hells yeah');
                expect(promiseErrback).not.toHaveBeenCalled();
            });

            it('should, if the callback returns a resolved promise and there is no linked success callback, propogate the success down the tree', function() {
                var promise1, promise2,
                    deferred1 = new Deferred(),
                    deferred2 = new Deferred(),
                    callback1 = function(result){ return deferred1.promise; },
                    callback2 = function(result){ return deferred2.promise; },
                    promise1Callback = jasmine.createSpy('promise1Callback'),
                    promise1Errback = jasmine.createSpy('promise1Errback'),
                    promise2Callback = jasmine.createSpy('promise2Callback'),
                    promise2Errback = jasmine.createSpy('promise2Errback');

                promise1 = deferred.promise.addSuccessCallback(callback1);
                promise2 = deferred.promise.addFailureCallback(callback2);
                promise1.addSuccessCallback(promise1Callback);
                promise1.addFailureCallback(promise1Errback);
                promise2.addSuccessCallback(promise2Callback);
                promise2.addFailureCallback(promise2Errback);

                deferred.fail('dingo bingo');
                deferred1.resolve('hells yes');
                deferred2.resolve('hells yeah');

                expect(promise1Callback).not.toHaveBeenCalled();
                expect(promise1Errback).not.toHaveBeenCalled();
                expect(promise2Callback).toHaveBeenCalledWith('hells yeah');
                expect(promise2Errback).not.toHaveBeenCalled();
            });

        });

        describe('#cancel', function() {

            it('should call cancel on this Deferred\'s promise', function() {
                spyOn(deferred.promise, 'cancel').andCallThrough();

                deferred.cancel();

                expect(deferred.promise.cancel).toHaveBeenCalled();
            });

        });

        describe('.all', function() {

            it('should throw if not passed an array of Promises', function() {
                var deferred2 = new Deferred();

                expect(function() {
                    Deferred.all('foo');
                }).toThrow();

                expect(function() {
                    Deferred.all(['foo', 'bar']);
                }).toThrow();

                expect(function() {
                    Deferred.all(deferred.promise);
                }).toThrow();

                expect(function() {
                    Deferred.all([deferred.promise, deferred2.promise]);
                }).not.toThrow();
            });

            it('should return a promise', function() {
                var deferred2 = new Deferred();

                expect(Deferred.all([
                    deferred.promise,
                    deferred2.promise
                  ]) instanceof deferred.promise.constructor).toBe(true);
            });

            it('should resolve the promise with an array of the resolutions from' +
              ' the passed-in promises, in the correct order', function() {
                // first we resolve the promises AFTER the call to 'all'
                var arg1 = 'flibble',
                    arg2 = 76,
                    callback = jasmine.createSpy('callback'),
                    deferred2 = new Deferred(),
                    allDeferred = Deferred.all([ deferred.promise, deferred2.promise ]).
                      then(callback);

                expect(allDeferred.resolved).toBe(false);
                expect(callback).not.toHaveBeenCalled();

                deferred.resolve(arg2);

                expect(allDeferred.resolved).toBe(false);
                expect(callback).not.toHaveBeenCalled();

                deferred2.resolve(arg1);

                expect(allDeferred.resolved).toBe(true);
                expect(callback).toHaveBeenCalled();
                expect(callback.calls[0].args[0][0]).toBe(76);
                expect(callback.calls[0].args[0][1]).toBe('flibble');

                // next we resolve the promises BEFORE the call to 'all'
                callback.reset();
                deferred = new Deferred();
                deferred2 = new Deferred();

                deferred.resolve(arg1);
                deferred2.resolve(arg2);

                allDeferred = Deferred.all([ deferred.promise, deferred2.promise ]).
                  then(callback);

                expect(allDeferred.resolved).toBe(true);
                expect(callback).toHaveBeenCalled();
                expect(callback.calls[0].args[0][0]).toBe('flibble');
                expect(callback.calls[0].args[0][1]).toBe(76);
            });

            it('should fail the promise early* with an array of the results from' +
              ' the passed-in promises, in the correct order', function() {
                // * Failing early means that as soon as a promise fails it won't
                //   wait for the others before failing the 'all' promise
                var arg1 = 'flibble',
                    arg2 = 76,
                    callback = jasmine.createSpy('callback'),
                    deferred2 = new Deferred(),
                    allDeferred = Deferred.all([ deferred.promise, deferred2.promise ]).
                      addFailureCallback(callback);

                expect(allDeferred.failed).toBe(false);
                expect(callback).not.toHaveBeenCalled();

                deferred2.fail(arg2);

                expect(allDeferred.failed).toBe(true);
                expect(callback).toHaveBeenCalled();
                expect(callback.calls[0].args[0][0]).toBe(undefined);
                expect(callback.calls[0].args[0][1]).toBe(76);
            });

            it('should fail the promise late (when passed true for the failLate' +
              ' param) with an array of the results from the passed-in promises,' +
              ' in the correct order', function() {
                // * Failing late means that it waits for all promises to be resolved
                // or failed before failing the 'all' promise
                var arg1 = 'flibble',
                    arg2 = 76,
                    callback = jasmine.createSpy('callback'),
                    deferred2 = new Deferred(),
                    allDeferred = Deferred.all([ deferred.promise, deferred2.promise ], true).
                      addFailureCallback(callback);

                expect(allDeferred.failed).toBe(false);
                expect(callback).not.toHaveBeenCalled();

                deferred2.fail(arg2);

                expect(allDeferred.failed).toBe(false);
                expect(callback).not.toHaveBeenCalled();

                deferred.resolve(arg1);

                expect(allDeferred.failed).toBe(true);
                expect(callback).toHaveBeenCalled();
                expect(callback.calls[0].args[0][0]).toBe('flibble');
                expect(callback.calls[0].args[0][1]).toBe(76);
            });

            it('should return a promise already resolved with an empty array' +
              ' if it is passed an empty promise array', function() {
                var callbackArg,
                    promise = Deferred.all([]),
                    functions = {
                        callback: function(arg){
                            callbackArg = arg;
                        }
                    };
                spyOn(functions, 'callback').andCallThrough();

                promise.then(functions.callback);

                expect(functions.callback).toHaveBeenCalled();
                expect(callbackArg instanceof Array).toBe(true);
                expect(callbackArg.length).toBe(0);
            });

        });

        describe('.setOutcomeHandler', function() {

            afterEach(function() {
                Deferred.setOutcomeHandler(function(callback) {
                    callback();
                });
            });

            // this has to actually be used in order to determine whether it has been set properly
            it('should set an outcome handler which is run as part of resolving or failing a promise', function() {
                var functions = {
                        outcomeHandler: function(callback) {
                            callback();
                        },
                        callback: function() {
                        }
                    };

                spyOn(functions, 'outcomeHandler').andCallThrough();
                spyOn(functions, 'callback').andCallThrough();
                Deferred.setOutcomeHandler(functions.outcomeHandler);

                deferred.promise.then(functions.callback);
                deferred.resolve();

                expect(functions.outcomeHandler).toHaveBeenCalled();
                expect(functions.callback).toHaveBeenCalled();
            });

        });

        describe('.setExceptionHandler', function() {

            afterEach(function() {
                Deferred.setExceptionHandler(function(error) {
                    throw error;
                });
            });

            // this has to actually be used in order to determine whether it has been set properly
            it('should set an exception handler which is run when an exception is encountered', function() {
                var handlerError,
                    functions = {
                        exceptionHandler: function(error) {
                            handlerError = error;
                        }
                    };

                spyOn(functions, 'exceptionHandler').andCallThrough();
                Deferred.setExceptionHandler(functions.exceptionHandler);

                try{
                    // anything that will cause an exception to be generated
                    Deferred.all('fooooo');
                }
                catch(e){}

                expect(functions.exceptionHandler).toHaveBeenCalled();
                expect(handlerError.message).toBe("Deferred#all: promises must be an Array");
            });

        });

        describe('.setActivationHandler', function() {

            var counter;

            beforeEach(function() {
                counter = 0;
                Deferred.setActivationHandler(function(value) {
                    counter += value;
                });
            });

            afterEach(function() {
                Deferred.setActivationHandler(function() {});
            });

            it('should be incremented by one when the first callback is set on a promise', function() {
                deferred.promise.addSuccessCallback(function() {});
                expect(counter).toBe(1);
                deferred.promise.addSuccessCallback(function() {});
                deferred.promise.addFailureCallback(function() {});
                expect(counter).toBe(1);
            });

            it('should be decremented by one when a promise is resolved, failed or cancelled', function() {
                deferred.promise.addSuccessCallback(function() {});
                expect(counter).toBe(1);
                deferred.resolve('foo');
                expect(counter).toBe(0);

                deferred = new Deferred();
                deferred.promise.addSuccessCallback(function() {});
                expect(counter).toBe(1);
                deferred.fail('foo');
                expect(counter).toBe(0);

                deferred = new Deferred();
                deferred.promise.addSuccessCallback(function() {});
                expect(counter).toBe(1);
                deferred.cancel();
                expect(counter).toBe(0);
            });

            it('should be decremented by one when a promise is deactivated when it falls out of resolution scope', function() {
                deferred.promise.addSuccessCallback(function(){}).
                    addSuccessCallback(function(){}); // when deferred fails, this will fall out of resolution scope
                deferred.promise.addFailureCallback(function(){});
                expect(counter).toBe(2);
                deferred.fail(false);
                expect(counter).toBe(0); // one down for failing deferred, another as the second success callback was cancelled.
            });

            it('should be incremented by one when a promise is reactivated due to a linked callback being used', function() {
                var deferred2 = new Deferred();

                deferred.promise.addSuccessCallback(function(){}, function() { // linked callbacks
                    return deferred2.promise;
                }).
                  addSuccessCallback(function(){}); // when deferred fails, this will fall out of resolution scope
                expect(counter).toBe(2);

                deferred.fail(false); // as this fails and deferred2.promise is returned, deferred2 is activated when callbacks are added to resolve the onward chain
                expect(counter).toBe(1); // one down for failing deferred, another down as the second success callback was cancelled.
                deferred2.resolve('yay'); // this pops the active counter down to 0
                expect(counter).toBe(0); // the success callback is reactivated and then resolved & deactivated immediately so... tough to test specifically.
            });

        });

    });

  }
);