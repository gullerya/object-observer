(function (scope) {
	'use strict';

	var observed = new WeakMap(),
		observables = new WeakMap(),
		callbacks = new WeakMap(),
		api,
		details;

	function createObservable(target, rootTarget, basePath) {
		var clone, result;

		//	instrumentation
		clone = copy(target);
		result = proxify(clone, rootTarget, basePath);
		Observable.call(result);

		//	registration
		if (target === rootTarget) {
			observables.set(result, new ObservableInfo(rootTarget, basePath));
			callbacks.set(target, []);
		} else {
			observables.set(result, new ObservableInfo(rootTarget, basePath));
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

		function proxiedSet(target, key, value) {
			var oldValue = target[key],
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
				change = {};
				change.path = path;
				change.value = value;
				if (typeof oldValue !== 'undefined') { change.oldValue = oldValue; }
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
				change = {};
				change.path = path;
				change.oldValue = oldValue;
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

	//	TODO: move here the whole management of the internal of each observable, e.g. info object may be disposed
	function Observable() {
		Reflect.defineProperty(this, 'observe', { value: observe });
		Reflect.defineProperty(this, 'unobserve', { value: unobserve });
	}

	function observe(callback) {
		if (typeof callback !== 'function') {
			throw new Error('callback parameter MUST be a function');
		}

		var observableInfo = observables.get(this),
			cbs;
		if (!observableInfo) {
			throw new Error(this + ' is not a known observable');
		} else {
			cbs = callbacks.get(observableInfo.root);
		}

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

		var observableInfo = observables.get(this), i,
			cbs;
		if (!observableInfo) {
			throw new Error(observable + ' is not a known observable');
		} else {
			cbs = callbacks.get(observableInfo.root);
		}

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

	function ObservableInfo(rootObservable, basePath) {
		Reflect.defineProperty(this, 'root', { value: rootObservable });
		Reflect.defineProperty(this, 'basePath', { value: basePath });
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