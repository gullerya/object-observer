(function (scope) {
	'use strict';

	var observed = new WeakMap(),
		observables = new WeakMap(),
		callbacks = new WeakMap(),
		api,
		details;

	//	PUBLIC APIs
	//
	function createObservable(target, rootTarget, basePath) {
		var targetCopy,
			observable,
			ownPath;

		function processArraySubgraph(element, index) {
			if (element && typeof element === 'object') {
				ownPath = basePath ? [basePath, key].join('.') : key;
				targetCopy[index] = createObservable(element, rootTarget, ownPath);
			}
		}

		function processObjectSubgraph(key) {
			if (targetCopy[key] && typeof targetCopy[key] === 'object') {
				ownPath = basePath ? [basePath, key].join('.') : key;
				targetCopy[key] = createObservable(targetCopy[key], rootTarget, ownPath);
			}
		}

		function proxiedSet(target, key, value) {
			console.dir(this)
			var oldValue = target[key],
				result,
				changes = [],
				change,
				path;

			result = Reflect.set(target, key, value);
			if (result && value !== oldValue && callbacks.get(rootTarget).length) {
				path = basePath ? [basePath, key].join('.') : key;

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
				path = basePath ? [basePath, key].join('.') : key;

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

		//	cloning the original target
		targetCopy = copy(target);

		//	proxifying the clone
		if (Array.isArray(targetCopy)) {
			targetCopy.forEach(processArraySubgraph);
			//	TODO: handle an array case
		} else {
			Reflect.ownKeys(targetCopy).forEach(processObjectSubgraph);
			observable = new Proxy(targetCopy, {
				set: proxiedSet,
				deleteProperty: proxiedDelete
			});
		}

		//	registering the observable
		if (target === rootTarget) {
			observables.set(observable, new ObservableInfo(rootTarget, basePath));
			callbacks.set(target, []);
		} else {
			observables.set(observable, new ObservableInfo(rootTarget, basePath));
		}

		return observable;
	}

	function observe(observable, callback) {
		if (!observable || typeof observable !== 'object') {
			throw new Error('observable parameter MUST be a non-null object');
		}
		if (typeof callback !== 'function') {
			throw new Error('callback parameter MUST be a function');
		}

		var observableInfo = observables.get(observable),
			cbs;
		if (!observableInfo) {
			throw new Error(observable + ' is not a known observable');
		} else {
			cbs = callbacks.get(observableInfo.root);
		}

		if (cbs.indexOf(callback) < 0) {
			cbs.push(callback);
		} else {
			console.info('observer callback may be bound only once for an observable');
		}
	}

	function unobserve(observable) {
		if (!observable || typeof observable !== 'object') {
			throw new Error('observable parameter MUST be a non-null object');
		}

		var observableInfo = observables.get(observable), i,
			cbs;
		if (!observableInfo) {
			throw new Error(observable + ' is not a known observable');
		} else {
			cbs = callbacks.get(observableInfo.root);
		}

		if (arguments.length > 1) {
			Array.from(arguments).forEach(function (argument, index) {
				if (index > 1) {
					i = cbs.indexOf(argument);
					if (i) {
						cbs.splice(i, 1);
					}
				}
			});
		} else {
			cbs.splice(0, cbs.length);
		}
	}

	//	INTERNALS
	//
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

	function iterate(graph, result, path) {
		var tmp, pVal;
		if (Array.isArray(graph)) {
			tmp = path + '[';
			graph.forEach(function (itm, idx) {
				if (itm && typeof itm === 'object') {
					iterate(itm, result, [tmp, idx, ']'].join(''));
				} else {
					result[[tmp, idx, ']'].join('')] = itm;
				}
			});
		} else {
			tmp = (path ? path + '.' : '');
			Reflect.ownKeys(graph).forEach(function (pKey) {
				pVal = graph[pKey];
				if (pVal && typeof pVal === 'object') {
					iterate(pVal, result, tmp + pKey);
				} else {
					result[tmp + pKey] = pVal;
				}
			});
		}
	}

	function flattenObject(graph) {
		var result = {};
		if (typeof graph !== 'object') { throw new Error('illegal graph argument, object expected'); }
		if (graph) { iterate(graph, result, ''); }
		return result;
	}

	function calculateGraphChange(oldGraph, newGraph) {
		var oldGraphFlat,
			newGraphFlat,
			result;

		oldGraphFlat = flattenObject(oldGraph);
		newGraphFlat = flattenObject(newGraph);
		//	generate list of changes

		return result;
	}

	api = {};

	Reflect.defineProperty(api, 'details', {
		value: {
			description: 'Proxy driven data observer implementation'
		}
	});
	Reflect.defineProperty(api, 'createObservable', {
		value: function (target) {
			if (!target || typeof target !== 'object') {
				throw new Error('observable may be created from non-null object only');
			}
			return createObservable(target, target, '');
		}
	});
	Reflect.defineProperty(api, 'observe', { value: observe });
	Reflect.defineProperty(api, 'unobserve', { value: unobserve });
	Reflect.defineProperty(api, 'flatten', { value: flattenObject });

	Reflect.defineProperty(scope, 'ObjectObserver', { value: api });
})(this);