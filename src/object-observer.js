(function (scope) {
	'use strict';

	var callbacks = new WeakMap(),
		api,
		details;

	function createObservable(target, rootTarget, basePath) {
		var clone, result;

		//	instrumentation
		clone = copy(target);
		result = proxify(clone, rootTarget, basePath);
		Observable.call(result, rootTarget, basePath);

		//	registration
		if (target === rootTarget) {
			callbacks.set(target, []);
		}

		return result;
	}

	function copy(target) {
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

	function proxify(target, rootTarget, basePath) {
		var proxy,
			ownPath;

		function processArraySubgraph(element, index) {
			if (element && typeof element === 'object') {
				ownPath = basePath ? [basePath, key].join('.') : key;
				target[index] = createObservable(element, rootTarget, ownPath);
			}
		}

		function processObjectSubgraph(key) {
			if (target[key] && typeof target[key] === 'object') {
				ownPath = basePath ? [basePath, key].join('.') : key;
				target[key] = createObservable(target[key], rootTarget, ownPath);
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
			if (result && value !== oldValue && callbacks.get(rootTarget).length) {
				if (Array.isArray(target) && !isNaN(parseInt(key))) {
					path = basePath ? [basePath, '[' + key + ']'].join('.') : '[' + key + ']';
				} else {
					path = basePath ? [basePath, key].join('.') : key;
				}

				if (typeof oldValue === 'object' && oldValue) {
					//	TODO: clean ups?
				}
				if (typeof value === 'object' && value) {
					target[key] = createObservable(value, rootTarget, path);
				}
				if (oldValuePresent) {
					change = new UpdateChange(path, value, oldValue);
				} else {
					change = new InsertChange(path, value);
				}
				changes.push(change);
				callbacks.get(rootTarget).forEach(function (callback) {
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
				callbacks.get(rootTarget).forEach(function (callback) {
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

	function observe(callback) {
		if (typeof callback !== 'function') {
			throw new Error('callback parameter MUST be a function');
		}

		var cbs = callbacks.get(this.root);

		if (cbs.indexOf(callback) < 0) {
			cbs.push(callback);
		} else {
			console.info('observer callback may be bound only once for an observable');
		}
	}

	function unobserve() {
		if (!observable || typeof observable !== 'object') {
			throw new Error('observable parameter MUST be a non-null object');
		}

		var i, cbs = callbacks.get(this.root);

		if (arguments.length) {
			Array.from(arguments).forEach(function (argument) {
				i = cbs.indexOf(argument);
				if (i) {
					cbs.splice(i, 1);
				}
			});
		} else {
			cbs.splice(0, cbs.length);
		}
	}

	function Observable(rootObservable, basePath) {
		Reflect.defineProperty(this, 'root', { value: rootObservable });
		Reflect.defineProperty(this, 'basePath', { value: basePath });
		Reflect.defineProperty(this, 'observe', { value: observe });
		Reflect.defineProperty(this, 'unobserve', { value: unobserve });
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

	Reflect.defineProperty(api, 'details', {
		value: {
			description: 'Proxy driven data observer implementation'
		}
	});
	Reflect.defineProperty(api, 'observableFrom', {
		value: function (target) {
			if (!target || typeof target !== 'object') {
				throw new Error('observable MAY ONLY be created from non-null object only');
			} else if ('observe' in target || 'unobserve' in target) {
				throw new Error('target object MUST NOT have not own nor inherited properties "observe" and/or "unobserve"')
			}
			return createObservable(target, target, '');
		}
	});

	Reflect.defineProperty(scope, 'ObjectObserver', { value: api });
})(this);