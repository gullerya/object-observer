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
        subGraph.forEach((element, index) => {
            if (element && typeof element === 'object') {
                path = basePath ? [basePath, '[' + index + ']'].join('.') : ('[' + index + ']');
                copy = copyShallow(element);
                subGraph[index] = proxify(copy, observableData, path);
            }
        });
    }

    function processObjectSubgraph(subGraph, observableData, basePath) {
        var path, copy;
        Reflect.ownKeys(subGraph).forEach(key => {
            if (subGraph[key] && typeof subGraph[key] === 'object') {
                path = basePath ? [basePath, key].join('.') : key;
                copy = copyShallow(subGraph[key]);
                subGraph[key] = proxify(copy, observableData, path);
            }
        });
    }

    function proxify(target, observableData, basePath) {
        var proxy;

        function proxiedArrayGet(target, key) {
            var result;
            if (key === 'push') {
                result = function proxiedPush() {
                    var pushResult, pushContent = [], changes = [];
                    Array.from(arguments).forEach((arg, index) => {
                        var pArg;
                        if (arg && typeof arg === 'object') {
                            pArg = proxify(arg, observableData, basePath + '[' + (target.length + index) + ']');
                        } else {
                            pArg = arg;
                        }
                        pushContent.push(pArg);
                    });
                    pushContent.forEach(function (pe, index) {
                        changes.push(new InsertChange(basePath + '[' + (target.length + index) + ']', pe));
                    });
                    pushResult = Reflect.apply(target[key], target, pushContent);
                    observableData.callbacks.forEach(function (callback) {
                        try {
                            callback(changes);
                        } catch (e) {
                            console.error(e);
                        }
                    });
                    return pushResult;
                }
            } else if (key === 'unshift') {
                result = function proxiedUnshift() {
                    var unshiftResult, unshiftContent = [], changes = [];
                    Array.from(arguments).forEach((arg, index) => {
                        var pArg;
                        if (arg && typeof arg === 'object') {
                            pArg = proxify(arg, observableData, basePath + '[' + index + ']');
                        } else {
                            pArg = arg;
                        }
                        unshiftContent.push(pArg);
                    });
                    unshiftContent.forEach(function (pe, index) {
                        changes.push(new InsertChange(basePath + '[' + index + ']', pe));
                    });
                    unshiftResult = Reflect.apply(target[key], target, unshiftContent);
                    observableData.callbacks.forEach(function (callback) {
                        try {
                            callback(changes);
                        } catch (e) {
                            console.error(e);
                        }
                    });
                    return unshiftResult;
                }
            } else if (key === 'reverse') {
                result = function proxiedReverse() {
                    var changes = [];
                    observableData.preventCallbacks = true;
                    Reflect.apply(target[key], target, arguments);
                    processArraySubgraph(target, observableData, basePath);
                    observableData.preventCallbacks = false;
                    changes.push(new ReverseChange());
                    observableData.callbacks.forEach(function (callback) {
                        try {
                            callback(changes);
                        } catch (e) {
                            console.error(e);
                        }
                    });

                    return observableData.proxy;
                }
            } else if (key === 'sort') {
                result = function proxiedSort() {
                    var changes = [];
                    observableData.preventCallbacks = true;
                    Reflect.apply(target[key], target, arguments);
                    processArraySubgraph(target, observableData, basePath);
                    observableData.preventCallbacks = false;
                    changes.push(new ShuffleChange());
                    observableData.callbacks.forEach(function (callback) {
                        try {
                            callback(changes);
                        } catch (e) {
                            console.error(e);
                        }
                    });

                    return observableData.proxy;
                }
            } else {
                result = Reflect.get(target, key);
            }
            return result;
        }

        function proxiedSet(target, key, value) {
            var oldValuePresent = target.hasOwnProperty(key),
				oldValue = target[key],
				result,
				changes = [],
				change,
				path;

            result = Reflect.set(target, key, value);
            if (observableData.callbacks.length && result && value !== oldValue) {
                if (Array.isArray(target) && !isNaN(parseInt(key))) {
                    path = basePath ? [basePath, '[' + key + ']'].join('.') : '[' + key + ']';
                } else {
                    path = basePath ? [basePath, key].join('.') : key;
                }

                if (typeof oldValue === 'object' && oldValue) {
                    if (proxiesToTargetsMap.has(oldValue)) {
                        proxiesToTargetsMap.delete(oldValue);
                    }
                }
                if (typeof value === 'object' && value) {
                    target[key] = proxify(value, observableData, path);
                }
                if (!observableData.preventCallbacks) {
                    if (oldValuePresent) {
                        change = new UpdateChange(path, value, oldValue);
                    } else {
                        change = new InsertChange(path, value);
                    }
                    changes.push(change);
                    observableData.callbacks.forEach(callback => {
                        try {
                            callback(changes);
                        } catch (e) {
                            console.error(e);
                        }
                    });
                }
            }
            return result;
        }

        function proxiedDelete(target, key) {
            var oldValue = target[key],
				result,
				changes = [],
				change,
				path;

            result = Reflect.deleteProperty(target, key);
            if (observableData.callbacks.length && result) {
                if (typeof oldValue === 'object' && oldValue) {
                    if (proxiesToTargetsMap.has(oldValue)) {
                        proxiesToTargetsMap.delete(oldValue);
                    }
                }
                if (!observableData.preventCallbacks) {
                    if (Array.isArray(target) && !isNaN(parseInt(key))) {
                        path = basePath ? [basePath, '[' + key + ']'].join('.') : '[' + key + ']';
                    } else {
                        path = basePath ? [basePath, key].join('.') : key;
                    }
                    change = new DeleteChange(path, oldValue);
                    changes.push(change);
                    observableData.callbacks.forEach(callback => {
                        try {
                            callback(changes);
                        } catch (e) {
                            console.error(e);
                        }
                    });
                }
            }
            return result;
        }

        if (proxiesToTargetsMap.has(target) && !proxiesToTargetsMap.get(target).proxy) {
            let tmp = target;
            target = proxiesToTargetsMap.get(target);
            console.log(proxiesToTargetsMap.delete(tmp));
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
                Array.from(arguments).forEach(argument => {
                    var i = callbacks.indexOf(argument);
                    if (i) {
                        callbacks.splice(i, 1);
                    }
                });
            } else {
                callbacks.splice(0, callbacks.length);
            }
        }

        proxy = proxify(copyShallow(target), this, '');
        Reflect.defineProperty(proxy, 'observe', { value: observe });
        Reflect.defineProperty(proxy, 'unobserve', { value: unobserve });

        Reflect.defineProperty(this, 'callbacks', { get: function () { return callbacks.slice(); } });
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

    api = {};

    Reflect.defineProperty(api, 'from', {
        value: function (target) {
            if (!target || typeof target !== 'object') {
                throw new Error('observable MAY ONLY be created from non-null object only');
            } else if ('observe' in target || 'unobserve' in target) {
                throw new Error('target object MUST NOT have not own nor inherited properties "observe" and/or "unobserve"')
            }
            var observableData = new ObservableData(target);
            return observableData.proxy;
        }
    });

    Reflect.defineProperty(scope, 'Observable', { value: api });
})(this);