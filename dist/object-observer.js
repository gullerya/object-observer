(function (scope) {
    'use strict';

    var api,
        proxiesToTargetsMap = new WeakMap();

    function copyShallow(target) {
        var result;
        if (Array.isArray(target)) {
            result = target.slice();
        } else {
            result = Object.assign({}, target);
        }
        return result;
    }

    function processArraySubgraph(subGraph, observableData, basePath) {
        var path, copy;
        subGraph.forEach(function (element, index) {
            if (element && typeof element === 'object') {
                path = basePath.concat(index);
                copy = copyShallow(element);
                subGraph[index] = proxify(copy, observableData, path);
            }
        });
    }

    function processObjectSubgraph(subGraph, observableData, basePath) {
        var path, copy;
        Reflect.ownKeys(subGraph).forEach(function (key) {
            if (subGraph[key] && typeof subGraph[key] === 'object') {
                path = basePath.concat(key);
                copy = copyShallow(subGraph[key]);
                subGraph[key] = proxify(copy, observableData, path);
            }
        });
    }

    function proxify(target, observableData, basePath) {
        var proxy;

        function proxiedArrayGet(target, key) {
            var result;
            if (key === 'pop') {
                result = function proxiedPop() {
                    var poppedIndex, popResult, changes;
                    poppedIndex = target.length - 1;
                    observableData.preventCallbacks = true;
                    popResult = Reflect.apply(target[key], target, arguments);
                    observableData.preventCallbacks = false;
                    changes = [new DeleteChange(basePath.concat(poppedIndex), popResult)];
                    publishChanges(observableData.callbacks, changes);
                    return popResult;
                };
            } else if (key === 'push') {
                result = function proxiedPush() {
                    var pushResult, changes = [];
                    observableData.preventCallbacks = true;
                    pushResult = Reflect.apply(target[key], target, arguments);
                    processArraySubgraph(target, observableData, basePath);
                    observableData.preventCallbacks = false;
                    for (var i = arguments.length; i > 0; i--) {
                        changes.push(new InsertChange(basePath.concat(pushResult - i), target[pushResult - i]));
                    }
                    publishChanges(observableData.callbacks, changes);
                    return pushResult;
                };
            } else if (key === 'shift') {
                result = function proxiedShift() {
                    var shiftResult, changes;
                    observableData.preventCallbacks = true;
                    shiftResult = Reflect.apply(target[key], target, arguments);
                    processArraySubgraph(target, observableData, basePath);
                    observableData.preventCallbacks = false;
                    changes = [new DeleteChange(basePath.concat(0), shiftResult)];
                    publishChanges(observableData.callbacks, changes);
                    return shiftResult;
                };
            } else if (key === 'unshift') {
                result = function proxiedUnshift() {
                    var unshiftResult, unshiftContent = [], changes = [];
                    Array.from(arguments).forEach(function (arg, index) {
                        var pArg;
                        if (arg && typeof arg === 'object') {
                            pArg = proxify(arg, observableData, basePath.concat(index));
                        } else {
                            pArg = arg;
                        }
                        unshiftContent.push(pArg);
                    });
                    unshiftContent.forEach(function (pe, index) {
                        changes.push(new InsertChange(basePath.concat(index), pe));
                    });
                    unshiftResult = Reflect.apply(target[key], target, unshiftContent);
                    processArraySubgraph(target, observableData, basePath);
                    publishChanges(observableData.callbacks, changes);
                    return unshiftResult;
                };
            } else if (key === 'reverse') {
                result = function proxiedReverse() {
                    var reverseResult, changes = [];
                    observableData.preventCallbacks = true;
                    reverseResult = Reflect.apply(target[key], target, arguments);
                    processArraySubgraph(target, observableData, basePath);
                    observableData.preventCallbacks = false;
                    changes.push(new ReverseChange());
                    publishChanges(observableData.callbacks, changes);
                    return reverseResult;
                };
            } else if (key === 'sort') {
                result = function proxiedSort() {
                    var sortResult, changes = [];
                    observableData.preventCallbacks = true;
                    sortResult = Reflect.apply(target[key], target, arguments);
                    processArraySubgraph(target, observableData, basePath);
                    observableData.preventCallbacks = false;
                    changes.push(new ShuffleChange());
                    publishChanges(observableData.callbacks, changes);
                    return sortResult;
                };
            } else if (key === 'fill') {
                result = function proxiedFill() {
                    var fillResult, start, end, changes = [], prev;
                    start = arguments.length < 2 ? 0 : (arguments[1] < 0 ? target.length + arguments[1] : arguments[1]);
                    end = arguments.length < 3 ? target.length : (arguments[2] < 0 ? target.length + arguments[2] : arguments[2]);
                    prev = target.slice(start, end);
                    observableData.preventCallbacks = true;
                    fillResult = Reflect.apply(target[key], target, arguments);
                    processArraySubgraph(target, observableData, basePath);
                    observableData.preventCallbacks = false;
                    for (var i = start; i < end; i++) {
                        if (target.hasOwnProperty(i - start)) {
                            changes.push(new UpdateChange(basePath.concat(i), target[i], prev[i - start]));
                        } else {
                            changes.push(new InsertChange(basePath.concat(i), target[i]));
                        }
                    }
                    publishChanges(observableData.callbacks, changes);
                    return fillResult;
                };
            } else if (key === 'splice') {
                result = function proxiedSplice() {
                    var changes = [],
                        index,
                        startIndex,
                        removed,
                        inserted,
                        spliceResult;
                    observableData.preventCallbacks = true;
                    startIndex = arguments.length === 0 ? 0 : (arguments[0] < 0 ? target.length + arguments[0] : arguments[0]);
                    removed = arguments.length < 2 ? (target.length - startIndex) : arguments[1];
                    inserted = Math.max(arguments.length - 2, 0);
                    spliceResult = Reflect.apply(target[key], target, arguments);
                    processArraySubgraph(target, observableData, basePath);
                    observableData.preventCallbacks = false;
                    for (index = 0; index < removed; index++) {
                        if (index < inserted) {
                            changes.push(new UpdateChange(basePath.concat(startIndex + index), target[startIndex + index], spliceResult[index]));
                        } else {
                            changes.push(new DeleteChange(basePath.concat(startIndex + index), spliceResult[index]));
                        }
                    }
                    for (; index < inserted; index++) {
                        changes.push(new InsertChange(basePath.concat(startIndex + index), target[startIndex + index]));
                    }

                    publishChanges(observableData.callbacks, changes);
                    return spliceResult;
                };
            } else {
                result = Reflect.get(target, key);
            }
            return result;
        }

        function proxiedSet(target, key, value) {
            var oldValuePresent = target.hasOwnProperty(key),
				oldValue = target[key],
				result,
				changes = Array.isArray(observableData.eventsCollector) ? observableData.eventsCollector : [],
				path;

            result = Reflect.set(target, key, value);
            if (observableData.callbacks.length && result && value !== oldValue) {
                path = basePath.concat(key);

                if (typeof oldValue === 'object' && oldValue) {
                    if (proxiesToTargetsMap.has(oldValue)) {
                        proxiesToTargetsMap.delete(oldValue);
                    }
                }
                if (typeof value === 'object' && value) {
                    target[key] = proxify(value, observableData, path);
                }
                if (oldValuePresent) {
                    changes.push(new UpdateChange(path, value, oldValue));
                } else {
                    changes.push(new InsertChange(path, value));
                }
                if (!observableData.preventCallbacks) {
                    publishChanges(observableData.callbacks, changes);
                }
            }
            return result;
        }

        function proxiedDelete(target, key) {
            var oldValue = target[key],
				result,
				changes = Array.isArray(observableData.eventsCollector) ? observableData.eventsCollector : [],
				path;

            result = Reflect.deleteProperty(target, key);
            if (observableData.callbacks.length && result) {
                if (typeof oldValue === 'object' && oldValue) {
                    if (proxiesToTargetsMap.has(oldValue)) {
                        proxiesToTargetsMap.delete(oldValue);
                    }
                }
                path = basePath.concat(key);
                changes.push(new DeleteChange(path, oldValue));
                if (!observableData.preventCallbacks) {
                    publishChanges(observableData.callbacks, changes);
                }
            }
            return result;
        }

        if (proxiesToTargetsMap.has(target)) {
            var tmp = target;
            target = proxiesToTargetsMap.get(target);
            proxiesToTargetsMap.delete(tmp);
        }
        if (Array.isArray(target)) {
            processArraySubgraph(target, observableData, basePath);
            proxy = new Proxy(target, {
                get: proxiedArrayGet,
                set: proxiedSet,
                deleteProperty: proxiedDelete
            });
        } else {
            processObjectSubgraph(target, observableData, basePath);
            proxy = new Proxy(target, {
                set: proxiedSet,
                deleteProperty: proxiedDelete
            });
        }
        proxiesToTargetsMap.set(proxy, target);

        return proxy;
    }

    function ObservableData(target) {
        var proxy,
			callbacks = [],
            eventsCollector,
            preventCallbacks = false;

        function observe(callback) {
            if (typeof callback !== 'function') { throw new Error('callback parameter MUST be a function'); }

            if (callbacks.indexOf(callback) < 0) {
                callbacks.push(callback);
            } else {
                console.info('observer callback may be bound only once for an observable');
            }
        }

        function unobserve() {
            if (arguments.length) {
                Array.from(arguments).forEach(function (argument) {
                    var i = callbacks.indexOf(argument);
                    if (i) {
                        callbacks.splice(i, 1);
                    }
                });
            } else {
                callbacks.splice(0, callbacks.length);
            }
        }

        proxy = proxify(copyShallow(target), this, []);
        Reflect.defineProperty(proxy, 'observe', { value: observe });
        Reflect.defineProperty(proxy, 'unobserve', { value: unobserve });

        Reflect.defineProperty(this, 'callbacks', { get: function () { return callbacks.slice(); } });
        Reflect.defineProperty(this, 'eventsCollector', { value: eventsCollector, writable: true });
        Reflect.defineProperty(this, 'preventCallbacks', { value: preventCallbacks, writable: true });
        Reflect.defineProperty(this, 'proxy', { value: proxy });
    }

    function InsertChange(path, value) {
        Reflect.defineProperty(this, 'type', { value: 'insert' });
        Reflect.defineProperty(this, 'path', { value: path });
        Reflect.defineProperty(this, 'value', { value: value });
    }
    function UpdateChange(path, value, oldValue) {
        Reflect.defineProperty(this, 'type', { value: 'update' });
        Reflect.defineProperty(this, 'path', { value: path });
        Reflect.defineProperty(this, 'value', { value: value });
        Reflect.defineProperty(this, 'oldValue', { value: oldValue });
    }
    function DeleteChange(path, oldValue) {
        Reflect.defineProperty(this, 'type', { value: 'delete' });
        Reflect.defineProperty(this, 'path', { value: path });
        Reflect.defineProperty(this, 'oldValue', { value: oldValue });
    }
    function ReverseChange() {
        Reflect.defineProperty(this, 'type', { value: 'reverse' });
    }
    function ShuffleChange() {
        Reflect.defineProperty(this, 'type', { value: 'shuffle' });
    }

    function publishChanges(callbacks, changes) {
        for (var i = 0; i < callbacks.length; i++) {
            try {
                callbacks[i](changes);
            } catch (e) {
                console.error(e);
            }
        }
    }

    api = {};

    Reflect.defineProperty(api, 'from', {
        value: function (target) {
            if (!target || typeof target !== 'object') {
                throw new Error('observable MAY ONLY be created from non-null object only');
            } else if ('observe' in target || 'unobserve' in target) {
                throw new Error('target object MUST NOT have not own nor inherited properties "observe" and/or "unobserve"');
            }
            var observableData = new ObservableData(target);
            return observableData.proxy;
        }
    });

    Reflect.defineProperty(scope, 'Observable', { value: api });
})(this);