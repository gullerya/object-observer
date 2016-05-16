(function (scope) {
	'use strict';

	var api;

	function copyShallow(target) {
		var result;
		if (!target || typeof target !== 'object') {
			throw new Error('copy target MUST be a non-null object');
		}

		if (Array.isArray(target)) {
			result = target.slice();
		} else {
			result = Object.assign({}, target);
		}
		return result;
	}

	function proxify(target, observableData, basePath) {
		var proxy;

		function processArraySubgraph(element, index) {
			var path, copy;
			if (element && typeof element === 'object') {
				path = basePath ? [basePath, key].join('.') : key;
				copy = copyShallow(element);
				target[index] = proxify(copy, observableData, path);
			}
		}

		function processObjectSubgraph(key) {
			var path, copy;
			if (target[key] && typeof target[key] === 'object') {
				path = basePath ? [basePath, key].join('.') : key;
				copy = copyShallow(target[key]);
				target[key] = proxify(copy, observableData, path);
			}
		}

		function proxiedArrayGet(target, key) {
			var result = Reflect.get(target, key);
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
			if (result && value !== oldValue && observableData.callbacks.length) {
				if (Array.isArray(target) && !isNaN(parseInt(key))) {
					path = basePath ? [basePath, '[' + key + ']'].join('.') : '[' + key + ']';
				} else {
					path = basePath ? [basePath, key].join('.') : key;
				}

				if (typeof oldValue === 'object' && oldValue) {
					//	TODO: clean ups?
				}
				if (typeof value === 'object' && value) {
					target[key] = proxify(value, observableData, path);
				}
				if (oldValuePresent) {
					change = new UpdateChange(path, value, oldValue);
				} else {
					change = new InsertChange(path, value);
				}
				changes.push(change);
				observableData.callbacks.forEach(function (callback) {
					try {
						callback(changes);
					} catch (e) {
						console.error(e);
					}
				});
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
			if (result) {
				if (Array.isArray(target) && !isNaN(parseInt(key))) {
					path = basePath ? [basePath, '[' + key + ']'].join('.') : '[' + key + ']';
				} else {
					path = basePath ? [basePath, key].join('.') : key;
				}

				if (typeof oldValue === 'object' && oldValue) {
					//	TODO: clean ups?
				}
				change = new DeleteChange(path, oldValue);
				changes.push(change);
				observableData.callbacks.forEach(function (callback) {
					try {
						callback(changes);
					} catch (e) {
						console.error(e);
					}
				});
			}
			return result;
		}

		if (Array.isArray(target)) {
			target.forEach(processArraySubgraph);
			proxy = new Proxy(target, {
				get: proxiedArrayGet,
				set: proxiedSet,
				deleteProperty: proxiedDelete
			});
		} else {
			Reflect.ownKeys(target).forEach(processObjectSubgraph);
			proxy = new Proxy(target, {
				set: proxiedSet,
				deleteProperty: proxiedDelete
			});
		}

		return proxy;
	}

	function ObservableData(target) {
		var clone,
			proxy,
			callbacks = [];

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
					i = callbacks.indexOf(argument);
					if (i) {
						callbacks.splice(i, 1);
					}
				});
			} else {
				callbacks.splice(0, callbacks.length);
			}
		}

		clone = copyShallow(target);
		proxy = proxify(clone, this, '');

		Reflect.defineProperty(proxy, 'observe', { value: observe });
		Reflect.defineProperty(proxy, 'unobserve', { value: unobserve });

		Reflect.defineProperty(this, 'callbacks', { get: function () { return callbacks.slice(); } });
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
	function ReverseChange(path, oldValue) {
		Reflect.defineProperty(this, 'type', { value: 'reverse' });
	}
	function ShuffleChange(path, oldValue) {
		Reflect.defineProperty(this, 'type', { value: 'shuffle' });
	}

	api = {};

	Reflect.defineProperty(api, 'observableFrom', {
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

	Reflect.defineProperty(scope, 'ObjectObserver', { value: api });
})(this);