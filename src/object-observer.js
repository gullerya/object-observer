(function (scope) {
	'use strict';

	var proxiesToRevokables = new WeakMap(),
        proxiesToTargetsMap = new WeakMap(),
		targetsToObserved = new WeakMap(),
        observedToObservable = new WeakMap();

	function copyShallow(target) {
		var result;
		if (Array.isArray(target)) {
			result = target.slice();
		} else {
			result = Object.assign({}, target);
		}
		return result;
	}

	function revokeProxyGraph(proxyGraph) {
		return;
		Reflect.ownKeys(proxyGraph).forEach(function (key) {
			var prop = proxyGraph[key];
			if (prop && typeof prop === 'object') {
				revokeProxyGraph(prop);
			}
		});
		if (proxiesToRevokables.has(proxyGraph)) {
			proxiesToRevokables.get(proxyGraph).revoke();
			proxiesToRevokables.delete(proxyGraph);
		} else {
			console.warn('did not found map for');
		}
	}

	function proxiedArrayGet(target, key) {
		var result,
			observed = targetsToObserved.get(target),
			observable = observedToObservable.get(observed.root);
		if (key === 'pop') {
			result = function proxiedPop() {
				var poppedIndex, popResult, changes;
				poppedIndex = target.length - 1;
				popResult = Reflect.apply(target[key], target, arguments);
				changes = [new DeleteChange(observed.path.concat(poppedIndex), popResult)];
				publishChanges(observable.callbacks, changes);
				return popResult;
			};
		} else if (key === 'push') {
			result = function proxiedPush() {
				var pushContent, pushResult, changes = [], startingLength;
				pushContent = Array.from(arguments);
				startingLength = target.length;
				pushContent.forEach(function (item, index) {
					if (item && typeof item === 'object') {
						pushContent[index] = new Observed(item, startingLength + index, observed).proxy;
					}
					changes.push(new InsertChange(observed.path.concat(startingLength + index), item));
				});
				pushResult = Reflect.apply(target[key], target, pushContent);
				publishChanges(observable.callbacks, changes);
				return pushResult;
			};
		} else if (key === 'shift') {
			result = function proxiedShift() {
				var shiftResult, changes, tmpObserved;
				shiftResult = Reflect.apply(target[key], target, arguments);
				target.forEach(function (element, index) {
					if (element && typeof element === 'object') {
						tmpObserved = targetsToObserved.get(proxiesToTargetsMap.get(element));
						if (tmpObserved) {
							tmpObserved.ownKey = index;
						} else {
							console.error('failed to resolve proxy -> target -> observed');
						}
					}
				});
				changes = [new DeleteChange(observed.path.concat(0), shiftResult)];
				publishChanges(observable.callbacks, changes);
				return shiftResult;
			};
		} else if (key === 'unshift') {
			result = function proxiedUnshift() {
				var unshiftContent, unshiftResult, changes = [], tmpObserved;
				unshiftContent = Array.from(arguments);
				unshiftContent.forEach(function (item, index) {
					if (item && typeof item === 'object') {
						unshiftContent[index] = new Observed(item, index, observed).proxy;
					}
				});
				unshiftResult = Reflect.apply(target[key], target, unshiftContent);
				target.forEach(function (item, index) {
					if (item && typeof item === 'object') {
						tmpObserved = targetsToObserved.get(proxiesToTargetsMap.get(item));
						if (tmpObserved) {
							tmpObserved.ownKey = index;
						} else {
							console.error('failed to resolve proxy -> target -> observed');
						}
					}
				});
				for (var i = 0; i < unshiftContent.length; i++) {
					changes.push(new InsertChange(observed.path.concat(i), target[i]));
				}
				publishChanges(observable.callbacks, changes);
				return unshiftResult;
			};
		} else if (key === 'reverse') {
			result = function proxiedReverse() {
				var reverseResult, changes = [], tmpObserved;
				reverseResult = Reflect.apply(target[key], target, arguments);
				target.forEach(function (element, index) {
					if (element && typeof element === 'object') {
						tmpObserved = targetsToObserved.get(proxiesToTargetsMap.get(element));
						if (tmpObserved) {
							tmpObserved.ownKey = index;
						} else {
							console.error('failed to resolve proxy -> target -> observed');
						}
					}
				});
				changes.push(new ReverseChange());
				publishChanges(observable.callbacks, changes);
				return reverseResult;
			};
		} else if (key === 'sort') {
			result = function proxiedSort() {
				var sortResult, changes = [], tmpObserved;
				sortResult = Reflect.apply(target[key], target, arguments);
				target.forEach(function (element, index) {
					if (element && typeof element === 'object') {
						tmpObserved = targetsToObserved.get(proxiesToTargetsMap.get(element));
						if (tmpObserved) {
							tmpObserved.ownKey = index;
						} else {
							console.error('failed to resolve proxy -> target -> observed');
						}
					}
				});
				changes.push(new ShuffleChange());
				publishChanges(observable.callbacks, changes);
				return sortResult;
			};
		} else if (key === 'fill') {
			result = function proxiedFill() {
				var fillResult, start, end, changes = [], prev;
				start = arguments.length < 2 ? 0 : (arguments[1] < 0 ? target.length + arguments[1] : arguments[1]);
				end = arguments.length < 3 ? target.length : (arguments[2] < 0 ? target.length + arguments[2] : arguments[2]);
				prev = target.slice();
				fillResult = Reflect.apply(target[key], target, arguments);
				for (var i = start; i < end; i++) {
					if (target[i] && typeof target[i] === 'object') {
						target[i] = new Observed(target[i], i, observed).proxy;
					}
					if (prev.hasOwnProperty(i)) {
						changes.push(new UpdateChange(observed.path.concat(i), target[i], prev[i]));
						if (prev[i] && typeof prev[i] === 'object') {
							console.error('REMINDER: implement revoke of replaced items by fill method');
						}
					} else {
						changes.push(new InsertChange(observed.path.concat(i), target[i]));
					}
				}
				publishChanges(observable.callbacks, changes);
				return fillResult;
			};
		} else if (key === 'splice') {
			result = function proxiedSplice() {
				var spliceContent, spliceResult, changes = [], tmpObserved,
					index, startIndex, removed, inserted;

				spliceContent = Array.from(arguments);

				//	obserify the newcomers
				spliceContent.forEach(function (item, index) {
					if (index > 1 && item && typeof item === 'object') {
						spliceContent[index] = new Observed(item, index, observed).proxy;
					}
				});

				//	calculate pointers
				startIndex = spliceContent.length === 0 ? 0 : (spliceContent[0] < 0 ? target.length + spliceContent[0] : spliceContent[0]);
				removed = spliceContent.length < 2 ? target.length - startIndex : spliceContent[1];
				inserted = Math.max(spliceContent.length - 2, 0);
				spliceResult = Reflect.apply(target[key], target, spliceContent);

				//	reindex the paths
				target.forEach(function (element, index) {
					if (element && typeof element === 'object') {
						tmpObserved = targetsToObserved.get(proxiesToTargetsMap.get(element));
						if (tmpObserved) {
							tmpObserved.ownKey = index;
						} else {
							console.error('failed to resolve proxy -> target -> observed');
						}
					}
				});

				//	revoke removed Observed
				spliceResult.forEach(function (removed) {
					if (removed && typeof removed === 'object') {
						console.error('REMINDER: implement revoke of removed items by splice method');
					}
				});

				//	publish changes
				for (index = 0; index < removed; index++) {
					if (index < inserted) {
						changes.push(new UpdateChange(observed.path.concat(startIndex + index), target[startIndex + index], spliceResult[index]));
					} else {
						changes.push(new DeleteChange(observed.path.concat(startIndex + index), spliceResult[index]));
					}
				}
				for (; index < inserted; index++) {
					changes.push(new InsertChange(observed.path.concat(startIndex + index), target[startIndex + index]));
				}
				publishChanges(observable.callbacks, changes);

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
			observed = targetsToObserved.get(target),
			observable = observedToObservable.get(observed.root),
			changes = Array.isArray(observed.eventsCollector) ? observed.eventsCollector : [],
			path;

		result = Reflect.set(target, key, value);
		if (observable.callbacks.length && result && value !== oldValue) {
			path = observed.path.concat(key);

			if (typeof oldValue === 'object' && oldValue) {
				if (proxiesToTargetsMap.has(oldValue)) {
					proxiesToTargetsMap.delete(oldValue);
				}
				if (proxiesToRevokables.has(oldValue)) {
					proxiesToRevokables.get(oldValue).revoke();
					proxiesToRevokables.delete(oldValue);
				}
			}
			if (typeof value === 'object' && value) {
				target[key] = new Observed(value, key, observed).proxy;
			}
			if (oldValuePresent) {
				changes.push(new UpdateChange(path, value, oldValue));
			} else {
				changes.push(new InsertChange(path, value));
			}
			if (!observed.preventCallbacks) {
				publishChanges(observable.callbacks, changes);
			}
		}
		return result;
	}

	function proxiedDelete(target, key) {
		var oldValue = target[key],
			result,
			observed = targetsToObserved.get(target),
			observable = observedToObservable.get(observed.root),
			changes = Array.isArray(observed.eventsCollector) ? observed.eventsCollector : [],
			path;

		result = Reflect.deleteProperty(target, key);
		if (observable.callbacks.length && result) {
			if (typeof oldValue === 'object' && oldValue) {
				if (proxiesToTargetsMap.has(oldValue)) {
					proxiesToTargetsMap.delete(oldValue);
				}
			}
			path = observed.path.concat(key);
			changes.push(new DeleteChange(path, oldValue));
			if (!observed.preventCallbacks) {
				publishChanges(observable.callbacks, changes);
			}
		}
		return result;
	}

	function processArraySubgraph(graph, parentObserved) {
		graph.forEach(function (element, index) {
			if (element && typeof element === 'object') {
				graph[index] = new Observed(element, index, parentObserved).proxy;
			}
		});
	}

	function processObjectSubgraph(graph, parentObserved) {
		Reflect.ownKeys(graph).forEach(function (key) {
			if (graph[key] && typeof graph[key] === 'object') {
				graph[key] = new Observed(graph[key], key, parentObserved).proxy;
			}
		});
	}

	function Observed(origin, ownKey, parent) {
		var targetClone,
			revokableProxy;

		if (!origin || typeof origin !== 'object') {
			throw new Error('Observed MUST be created from a non null object origin');
		}
		if (parent && (typeof ownKey === 'undefined' || ownKey === null)) {
			throw new Error('any non-root (parent-less) Observed MUST have an own path; now parent is ' + parent + '; key is ' + ownKey);
		}
		if (parent && !(parent instanceof Observed)) {
			throw new Error('parent, when supplied, MUST be an instance of Observed');
		}

		targetClone = copyShallow(origin);

		if (Array.isArray(targetClone)) {
			processArraySubgraph(targetClone, this);
			revokableProxy = Proxy.revocable(targetClone, {
				set: proxiedSet,
				get: proxiedArrayGet,
				deleteProperty: proxiedDelete
			});
		} else {
			processObjectSubgraph(targetClone, this);
			revokableProxy = Proxy.revocable(targetClone, {
				set: proxiedSet,
				deleteProperty: proxiedDelete
			});
		}

		targetsToObserved.set(targetClone, this);
		proxiesToTargetsMap.set(revokableProxy.proxy, targetClone);
		Reflect.defineProperty(this, 'proxy', { value: revokableProxy.proxy });
		Reflect.defineProperty(this, 'parent', { value: parent });
		Reflect.defineProperty(this, 'ownKey', { value: ownKey, writable: true });
	}

	Reflect.defineProperty(Observed.prototype, 'root', {
		get: function () {
			var result = this;
			while (result.parent) {
				result = result.parent;
			}
			return result;
		}
	});
	Reflect.defineProperty(Observed.prototype, 'path', {
		get: function () {
			var result = [], pointer = this;
			while (typeof pointer.ownKey !== 'undefined') {
				result.push(pointer.ownKey);
				pointer = pointer.parent;
			}
			return result.reverse();
		}
	});

	function Observable(observed) {
		var isRevoked = false,
			callbacks = [],
            eventsCollector;

		function observe(callback) {
			if (isRevoked) { throw new TypeError('revoked Observable MAY NOT be observed anymore'); }
			if (typeof callback !== 'function') { throw new Error('observer (callback) parameter MUST be a function'); }

			if (callbacks.indexOf(callback) < 0) {
				callbacks.push(callback);
			} else {
				console.info('observer (callback) may be bound to an observable only once');
			}
		}

		function unobserve() {
			if (isRevoked) { throw new TypeError('revoked Observable MAY NOT be unobserved amymore'); }
			if (arguments.length) {
				Array.from(arguments).forEach(function (argument) {
					var i = callbacks.indexOf(argument);
					if (i >= 0) {
						callbacks.splice(i, 1);
					}
				});
			} else {
				callbacks.splice(0, callbacks.length);
			}
		}

		function revoke() {
			return;
			if (!isRevoked) {
				isRevoked = true;
				revokeProxyGraph(observed.proxy);
			} else {
				console.log('revokation of Observable have an effect only once');
			}
		}

		observedToObservable.set(observed, this);
		Reflect.defineProperty(this, 'observe', { value: observe });
		Reflect.defineProperty(this, 'unobserve', { value: unobserve });
		Reflect.defineProperty(this, 'revoke', { value: revoke });

		//	TODO: remove these guys from public access
		Reflect.defineProperty(this, 'callbacks', { value: callbacks });
		Reflect.defineProperty(this, 'eventsCollector', { value: eventsCollector, writable: true });
	}
	Observable.prototype = Object.create(Observed.prototype);
	Observable.prototype.constructor = Observable;

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

	Reflect.defineProperty(Observable, 'from', {
		value: function (target) {
			if (!target || typeof target !== 'object') {
				throw new Error('observable MAY ONLY be created from non-null object only');
			} else if ('observe' in target || 'unobserve' in target || 'revoke' in target) {
				throw new Error('target object MUST NOT have nor own neither inherited properties from the following list: "observe", "unobserve", "revoke"');
			}
			var observed = new Observed(target);
			Observable.call(observed.proxy, observed);
			return observed.proxy;
		}
	});

	Reflect.defineProperty(scope, 'Observable', { value: Observable });
})(this);