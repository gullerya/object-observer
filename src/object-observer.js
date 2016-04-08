(function (scope) {
	'use strict';

	var pathsMap = new WeakMap();

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

	function DataObserver() {

		function observe(target, callback) {
			if (!target || typeof target !== 'object') {
				throw new Error('target MUST be a non-empty object');
			}
			if (typeof callback !== 'function') {
				throw new Error('callback parameter MUST be a function');
			}

			return Proxy.revocable(target, {
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
							Reflect.set(target, key, observe(value, callback));
						}
						//	instead of simple callback below, an array of changes should be delivered
						callback(path, value, oldValue);
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
						changes.forEach(callback);
					}
					return result;
				}
			}).proxy;
		}

		Reflect.defineProperty(this, 'getObserved', { value: observe });
		Reflect.defineProperty(this, 'details', {
			value: {
				description: 'Proxy driven data observer implementation'
			}
		});
	}

	Reflect.defineProperty(scope, 'DataObserver', { value: DataObserver });
	Reflect.defineProperty(scope, 'flatten', { value: flattenObject });
})(this);

