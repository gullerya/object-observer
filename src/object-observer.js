(function (scope) {
	'use strict';

	var observables = new WeakMap(),
		pathsMap = new WeakMap(),
		details;

	//	PUBLIC APIs
	//
	function createObservable(target) {
		var result,
			rootTarget = arguments[1] || target;

		result = Proxy.revocable(target, {
			set: function proxiedSet(target, key, value) {
				var oldValue = target[key],
					result,
					changes = [],
					path;

				result = Reflect.set(target, key, value);
				path = pathsMap.has(target) ? [pathsMap.get(target), key].join('.') : key;
				if (result) {
					if (typeof oldValue === 'object' && oldValue) {
						//	remove old proxy
					}
					if (typeof value === 'object' && value) {
						pathsMap.set(value, path);
						Reflect.set(target, key, createObservable(value, rootTarget));
					}
					observables.get(rootTarget).forEach(function (callback) {
						try {
							callback(changes);
						} catch (e) {
							console.error(e);
						}
					});
				}
				return result;
			},
			deleteProperty: function proxiedDelete(target, key) {
				var oldValue = target[key],
					result,
					changes = [],
					path;

				result = Reflect.deleteProperty(target, key);
				if (result) {
					if (typeof oldValue === 'object' && oldValue) {
						pathsMap.get(oldValue).revoke();
						pathsMap.delete(oldValue);
						//	calc flat paths and build an array of changes
					} else {
						path = pathsMap.has(target) ? [pathsMap.get(target), key].join('.') : key;
						changes.push({
							path: path,
							oldValue: oldValue
						});
					}
					observables.get(rootTarget).forEach(function (callback) {
						try {
							callback(changes);
						} catch (e) {
							console.error(e);
						}
					});
				}
				return result;
			}
		}).proxy;

		return result;
	}

	function observe(observable, callback) {
		if (!observables.has(observable)) {
			throw new Error(observable + ' is not a known observable');
		}
		if (typeof callback !== 'function') {
			throw new Error('callback parameter MUST be a function');
		}

		observables.get(observable).push(callback);
	}

	function unobserve(observable) {
		if (!observables.has(observable)) {
			throw new Error(observable + ' is not a known observable');
		}

		if (arguments.length > 1) {
			for (let i = 1; i < arguments.length; i++) {
				//	if callbacks list contains argument[i] - remove it
			}
		} else {
			observables.get(observable) = [];
		}
	}

	//	INTERNALS
	//
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

	Reflect.defineProperty(this, 'details', {
		value: {
			description: 'Proxy driven data observer implementation'
		}
	});
	Reflect.defineProperty(scope, 'createObservable', {
		value: function (target) {
			if (!target || typeof target !== 'object') {
				throw new Error('observable may be created from non null object only');
			}
			let result = createObservable(target);
			observables.set(target, []);
			return result;
		}
	});
	Reflect.defineProperty(scope, 'observe', { value: observe });
	Reflect.defineProperty(scope, 'unobserve', { value: unobserve });
	Reflect.defineProperty(scope, 'flatten', { value: flattenObject });
})(this);
