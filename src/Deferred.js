define(['./cpLib'], function(lib) {

    // TODO remove these lines once requirejs paths problem is sorted out.
    this.timesrun = this.timesrun ? this.timesrun+1 : 1;
    console.log('Deferred setup ('+this.timesrun+')');

    /**
        Deferred is a very simple promise provider
    */

    /**
        Provides methods to add callbacks to execute when the Deferred is resolved
        @class
        @alias Promise
    */
    var Promise = lib.makeClass(),

    /**
        Allows continued execution of code after an async operation
        @class
        @alias Deferred
    */
        Deferred = lib.makeClass(),

    /**
        Handles outcome from Deferred and Promise instances.
          The default configuration simply calls the callback but this can be
          overridden using setOutcomeHandler
        @param {function} callback A function which will produce the outcome
    */
        outcomeHandler = function(callback) {
            callback();
        },

    /**
        Handles exceptions from Deferred and Promise instances.
          The default configuration simply throws the error but this can be
          overridden using setExceptionHandler
        @param {Error} error An error
    */
        exceptionHandler = function(error) {
            throw error;
        },


    /**
        Function that is called when a new Deferred is activated (has a callback
          assigned), or is deactivated (is resolved, failed, cancelled or deactivated).
          Set to an empty function by default but can be used to track outstanding
          promises (eg. when waiting for a page to finish loading and rendering).
    */
        activationHandler = function() {},


    /**
        Encapsulates a deferred object returning a function that allows the
          action to be run anywhere without altering the original scope.
        @param {function} callback A callback that has a child needing handling
        @param {string} source resolve or fail: the action this function is being generated from
        @param {string} action resolve or fail: the way to handle the child {@link Deferred}
        @returns {function} Function proxying to a method on deferred
    */
        createChildHandlingCallback = function (callback, source, action) {
            // this returned function is a callback, so it takes an argument
            // and passes it through to the deferred action
            return function(result) {
                if(source === 'fail') {
                    if(action === 'resolve' && callback.callback) {
                        reactivate([callback.callback.deferred]);
                        callback = callback.callback;
                    }
                    else if(action === 'fail' && callback.errback) {
                        reactivate([callback.errback.deferred]);
                        callback = callback.errback;
                    }
                }

                callback.deferred[action](result);

                // it also returns the value so it can be used as a callback result
                return result;
            };
        },


    /**
        Artificially disables an array of Deferred and all their children.
          It's like cancelling them, but without the upward propogation.
        @param {Deferred[]} deferreds An array of {@link Deferred}
    */
        deactivate = function (deferreds) {
            var i, deferred;

            for(i=0; i<deferreds.length; i++) {
                deferred = deferreds[i];

                deferred.promise.cancelled = true;
                if(deferred.promise.callbacks.length || deferred.promise.errbacks.length) {
                    activationHandler(-1);
                    deactivate(deferred.promise.callbacks.map(getDeferredFromCallback));
                    deactivate(deferred.promise.errbacks.map(getDeferredFromCallback));
                }
            }
        },


    /**
        Reactivates an array of Deferred and all their children.
        @param {Deferred[]} deferreds An array of {@link Deferred}
    */
        reactivate = function (deferreds) {
            var i, deferred;

            for(i=0; i<deferreds.length; i++) {
                deferred = deferreds[i];

                if(!deferred.promise.resolved &&
                    !deferred.promise.failed &&
                    deferred.promise.cancelled
                ) {
                    deferred.promise.cancelled = false;
                    if(deferred.promise.callbacks.length || deferred.promise.errbacks.length) {
                        activationHandler(1);
                        reactivate(deferred.promise.callbacks.map(getDeferredFromCallback));
                        reactivate(deferred.promise.errbacks.map(getDeferredFromCallback));
                    }
                }
            }
        },


    /**
        Gets the {@link Deferred} from a callback (used for Array.map)
        @param {function} callback Callback
        @returns {Deferred} Deferred
    */
        getDeferredFromCallback = function(callback) {
            return callback.deferred;
        };


    /**
        Initialise a promise object
        @param {Deferred} deferred The Deferred which will resolve or fail this
          promise and kick off its callbacks
        @private
    */
    Promise.prototype.init = function(deferred) {
        if(!(deferred instanceof Deferred)) {
            throw new Error('Promise#init: an instance of Deferred must be' +
              ' supplied to a new Promise');
        }

        this.deferred = deferred;
        this.callbacks = [];
        this.errbacks = [];
        this.resolved = false;
        this.failed = false;
        this.cancelled = false;
        // this.resolutionArg = undefined;
    };


    /**
        Adds a callback to be executed when the deferred object is resolved.
        @param {function} callback The function to be executed. Gets passed
          any args that are passed to Deferred.resolve()
        @param {function} errback (optional) For convenience and compatibility.
          This function will be passed on to {@link addFailureCallback}
        @returns {Promise} Returns itself for chaining.
    */
    Promise.prototype.addSuccessCallback = function(callback, errback) {
        var childDeferred,
            that = this;

        if(this.cancelled) {
            console.warn('Promise#addSuccessCallback: cannot add callback as' +
              ' promise has been cancelled');
            return this;
        }

        if(callback instanceof Function) {
            childDeferred = new Deferred(this.deferred);

            callback.deferred = childDeferred;
            this.deferred.children.push(childDeferred);

            if(this.resolved || this.failed) {
                if(this.resolved) {
                    outcomeHandler(function() {
                        callback(that.resolutionArg);
                    });
                    childDeferred.resolve(this.resolutionArg);
                }
                else {
                    childDeferred.fail(this.resolutionArg);
                }
            }
            else {
                if(!this.callbacks.length && !this.errbacks.length) {
                    activationHandler(1);
                }

                this.callbacks.push(callback);
            }

            if(errback instanceof Function) {
                // link the two callbacks
                errback.callback = callback;
                callback.errback = errback;

                this.addFailureCallback(errback);
            }

            return childDeferred.promise;

        }
        else {
            exceptionHandler(new Error('Promise#addSuccessCallback: callback must be a function'));
        }
    };


    /**
        Convenience method for addSuccessCallback
        @method
    */
    Promise.prototype.then = Promise.prototype.addSuccessCallback;


    /**
        Adds a callback to be executed when the deferred object is NOT resolved.
        @param {function} callback The function to be executed. Gets passed
                                    any args that are passed to Deferred.fail()
        @returns {Promise} Returns itself for chaining.
    */
    Promise.prototype.addFailureCallback = function(callback) {
        var childDeferred,
            that = this;

        if(this.cancelled) {
            console.warn('Promise#addFailureCallback: cannot add callback as' +
              ' promise has been cancelled');
            return this;
        }

        if (callback instanceof Function) {
            childDeferred = new Deferred(this.deferred);

            callback.deferred = childDeferred;
            this.deferred.children.push(childDeferred);

            if(this.resolved || this.failed) {
                if(this.failed) {
                    outcomeHandler(function() {
                        callback(that.resolutionArg);
                    });
                    childDeferred.fail(this.resolutionArg);
                }
                else {
                    childDeferred.resolve(this.resolutionArg);
                }
            }
            else {
                if(!this.callbacks.length && !this.errbacks.length) {
                    activationHandler(1);
                }

                this.errbacks.push(callback);
            }

            return childDeferred.promise;
        }
        else {
            exceptionHandler(new Error('Promise#addFailureCallback: callback must be a function'));
        }
    };


    /**
        Convenience method for addFailureCallback
        @method
    */
    Promise.prototype.otherwise = Promise.prototype.addFailureCallback;


    /**
        Clears the callback list so that any future resolutions or failures on
          the parent Deferred will do nothing.
    */
    Promise.prototype.cancel = function() {
        var i;

        if(!this.cancelled) {
            if(this.callbacks.length || this.errbacks.length) {
                activationHandler(-1);
            }

            this.callbacks = [];
            this.errbacks = [];
            this.cancelled = true;

            // up the chain
            if(this.deferred.deferredParent && !this.deferred.deferredParent.cancelled) {
                this.deferred.deferredParent.cancel();
            }

            // down the chain
            for(i in this.deferred.children) {
                if(!this.deferred.children[i].cancelled) {
                    this.deferred.children[i].cancel();
                }
            }
        }
    };



    /**
        Initialise a deferred object
        @param {Deferred} deferredParent (optional) The parent to this deferred
        @private
    */
    Deferred.prototype.init = function(deferredParent) {

        if(deferredParent !== undefined && !(deferredParent instanceof Deferred)) {
            throw new Error('Deferred#init: deferredParent must be an instance' +
              ' of Deferred');
        }

        this.deferredParent = deferredParent;
        this.promise = new Promise(this);
        this.children = []; // child Deferreds, used for chaining

    };


    /**
        Resolves this deferred object's promise.
        All arguments are passed to the callback function(s) stored in the promise
        @param {mixed} callbackArg The argument with which to resolve the promise
    */
    Deferred.prototype.resolve = function(callbackArg) {
        var that = this;

        if(this.promise.cancelled) {
            console.warn('Deferred#resolve: cannot resolve as promise has been' +
              ' cancelled');
            return;
        }

        if(!this.promise.resolved && !this.promise.failed){

            this.promise.resolved = true;
            this.promise.resolutionArg = callbackArg;

            if(!that.promise.callbacks.length) {
                for(i=0; i<that.promise.errbacks.length; i++) {
                    if(callbackArg instanceof Promise) {
                        callbackArg.addSuccessCallback(
                            createChildHandlingCallback(that.promise.errbacks[i], 'resolve', 'resolve')
                        );
                        callbackArg.addFailureCallback(
                            createChildHandlingCallback(that.promise.errbacks[i], 'resolve', 'fail')
                        );
                    }
                    else {
                        that.promise.errbacks[i].deferred.resolve(callbackArg);
                    }
                }
            }
            else {
                outcomeHandler(function() {
                    var i, result;

                    for(i=0; i<that.promise.callbacks.length; i++) {
                        result = that.promise.callbacks[i](callbackArg);

                        if(result instanceof Promise) {
                            result.addSuccessCallback(
                                createChildHandlingCallback(that.promise.callbacks[i], 'resolve', 'resolve')
                            );
                            result.addFailureCallback(
                                createChildHandlingCallback(that.promise.callbacks[i], 'resolve', 'fail')
                            );
                        }
                        else {
                            that.promise.callbacks[i].deferred.resolve(result);
                        }
                    }

                    deactivate(that.promise.errbacks.map(getDeferredFromCallback));
                });
            }

            if(this.promise.callbacks.length || this.promise.errbacks.length) {
                activationHandler(-1);
            }

        }
    };


    /**
        Breaks / fails this deferred object's promise.
        All arguments are passed to the callback function(s) stored in the promise
        @param {mixed} errbackArg The argument with which to fail the promise
    */
    Deferred.prototype.fail = function(errbackArg) {
        var that = this,
            args = arguments;

        if(this.promise.cancelled) {
            console.warn('Deferred#fail: cannot fail as promise has been' +
              ' cancelled');
            return;
        }

        if(!this.promise.resolved && !this.promise.failed){

            this.promise.failed = true;
            this.promise.resolutionArg = errbackArg;

            if(!that.promise.errbacks.length) {
                for(i=0; i<that.promise.callbacks.length; i++) {
                    if(errbackArg instanceof Promise) {
                        errbackArg.addSuccessCallback(
                            createChildHandlingCallback(that.promise.callbacks[i], 'fail', 'resolve')
                        );
                        errbackArg.addFailureCallback(
                            createChildHandlingCallback(that.promise.callbacks[i], 'fail', 'fail')
                        );
                    }
                    else {
                        that.promise.callbacks[i].deferred.fail(errbackArg);
                    }
                }
            }
            else {
                outcomeHandler(function() {
                    var i, result;

                    for(i=0; i<that.promise.errbacks.length; i++) {
                        result = that.promise.errbacks[i](errbackArg);

                        if(result instanceof Promise) {
                            result.addSuccessCallback(
                                createChildHandlingCallback(that.promise.errbacks[i], 'fail', 'resolve')
                            );
                            result.addFailureCallback(
                                createChildHandlingCallback(that.promise.errbacks[i], 'fail', 'fail')
                            );
                        }
                        else {
                            that.promise.errbacks[i].deferred.fail(result);
                        }
                    }

                    deactivate(that.promise.callbacks.map(getDeferredFromCallback));
                });
            }


            if(this.promise.callbacks.length || this.promise.errbacks.length) {
                activationHandler(-1);
            }

        }
    };


    /**
        Cancels the callbacks for the async operation.
    */
    Deferred.prototype.cancel = function () {
        this.promise.cancel();
    };


    /**
        Creates a promise that is resolved only when all the promises provided
          have been resolved.
        @param {array} promises An array of promises
        @param {boolean} failLate If true, it waits until all promises have been
          resolved or failed before failing the collection.
        @return {Promise}
    */
    Deferred.all = function(promises, failLate) {
        var i, promise, deferred,
            failed = false,
            promisesCompleted = 0,
            promisesTotal = 0,
            promiseData = [],
            failEarly = (typeof failLate === 'undefined') ? true : !failLate,
            complete = function(data) {
                if(failed) {
                    deferred.fail(data);
                }
                else{
                    deferred.resolve(data);
                }
            },
            resolve = function(data, i) {
                promiseData[i] = data;
                promisesCompleted += 1;
                if(promisesCompleted == promisesTotal) {
                    complete(promiseData);
                }
            },
            fail = function(data, i) {
                promiseData[i] = data;
                promisesCompleted += 1;
                failed = true;
                if(promisesCompleted == promisesTotal || failEarly) {
                    complete(promiseData);
                }
            },
            makeResolverFunction = function(i) {
                return function(data){
                    resolve(data, i);
                };
            },
            makeFailerFunction = function(i) {
                return function(data){
                    fail(data, i);
                };
            };

        if(!lib.isArray(promises)) {
            exceptionHandler(new Error('Deferred#all: promises must be an Array'));
        }
        else {
            deferred = new Deferred();

            if(promises.length === 0) {
                deferred.resolve([]);
            }
            else {

                promisesTotal = promises.length;

                for(i=0; i<promises.length; i++) {

                    promise = promises[i];

                    if(promise instanceof Promise) {
                        promise.addSuccessCallback(makeResolverFunction(i));
                        promise.addFailureCallback(makeFailerFunction(i));
                    }
                    else{
                        exceptionHandler(new Error('Deferred#all: got passed a non-Promise'));
                    }

                }

            }
        }

        return deferred.promise;
    };


    /**
        Sets a function to be called to handle the outcome of a Deferred
          This allows for pre- or post-processing to take place around the
          resolution or failure of promises.
        @param {function} outcomeHandler The function that will handle all
          outcome from Deferred and Promise objects. This function must take a
          single function as an argument.
    */
    Deferred.setOutcomeHandler = function(outcomeHandlerFn) {
        outcomeHandler = outcomeHandlerFn;
    };


    /**
        Sets a function to be called in the case of an exception. This allows
          us to channel new exceptions through a custom handler if required.
        @param {function} exceptionHandler The function that will handle all
          exceptions from Deferred and Promise objects. This function must take
          an Error as an argument.
    */
    Deferred.setExceptionHandler = function(exceptionHandlerFn) {
        exceptionHandler = exceptionHandlerFn;
    };


    /**
        Sets a function to be called when a Deferred is activated or deactivated
    */
    Deferred.setActivationHandler = function(callbackFn) {
        activationHandler = callbackFn;
    };


   return Deferred;

});