(() => {
	'use strict';

	const scope = this || window,
		proxiesToTargetsMap = new Map(),
		targetsToObserved = new Map(),
		observedToObservable = new Map(),
		nonObservables = ['Date', 'Blob', 'Number', 'String', 'Boolean', 'Error', 'SyntaxError', 'TypeError', 'URIError', 'Function', 'Promise', 'RegExp'];

	function copyShallow(target) {
		return Array.isArray(target) ?
			target.slice() :
			Object.assign(new target.constructor(), target);
	}

	function isNonObservable(target) {
		return nonObservables.indexOf(target.constructor.name) >= 0;
	}

	function proxiedArrayGet(target, key) {
		let result,
			observed = targetsToObserved.get(target),
			observable = observedToObservable.get(observed.root);
		if (key === 'pop') {
			result = function proxiedPop() {
				let poppedIndex, popResult, changes;
				poppedIndex = target.length - 1;
				popResult = Reflect.apply(target[key], target, arguments);
				if (popResult && typeof popResult === 'object') {
					popResult = proxiesToTargetsMap.get(popResult);
					targetsToObserved.get(popResult).revoke();
				}
				changes = [new DeleteChange(observed.path.concat(poppedIndex), popResult)];
				observable.notify(changes);
				return popResult;
			};
		} else if (key === 'push') {
			result = function proxiedPush() {
				let pushContent, pushResult, changes = [], startingLength;
				pushContent = Array.from(arguments);
				startingLength = target.length;
				for (let i = 0, l = pushContent.length, item; i < l; i++) {
					item = pushContent[i];
					if (item && typeof item === 'object') {
						pushContent[i] = new Observed(item, startingLength + i, observed).proxy;
					}
					changes.push(new InsertChange(observed.path.concat(startingLength + i), item));
				}
				pushResult = Reflect.apply(target[key], target, pushContent);
				observable.notify(changes);
				return pushResult;
			};
		} else if (key === 'shift') {
			result = function proxiedShift() {
				let shiftResult, changes, tmpObserved;
				shiftResult = Reflect.apply(target[key], target, arguments);
				if (shiftResult && typeof shiftResult === 'object') {
					shiftResult = proxiesToTargetsMap.get(shiftResult);
					targetsToObserved.get(shiftResult).revoke();
				}
				for (let i = 0, l = target.length, item; i < l; i++) {
					item = target[i];
					if (item && typeof item === 'object') {
						tmpObserved = targetsToObserved.get(proxiesToTargetsMap.get(item));
						if (tmpObserved) {
							tmpObserved.ownKey = i;
						} else {
							console.error('failed to resolve proxy -> target -> observed');
						}
					}
				}
				changes = [new DeleteChange(observed.path.concat(0), shiftResult)];
				observable.notify(changes);
				return shiftResult;
			};
		} else if (key === 'unshift') {
			result = function proxiedUnshift() {
				let unshiftContent, unshiftResult, changes = [], tmpObserved;
				unshiftContent = Array.from(arguments);
				unshiftContent.forEach(function(item, index) {
					if (item && typeof item === 'object') {
						unshiftContent[index] = new Observed(item, index, observed).proxy;
					}
				});
				unshiftResult = Reflect.apply(target[key], target, unshiftContent);
				for (let i = 0, l = target.length, item; i < l; i++) {
					item = target[i];
					if (item && typeof item === 'object') {
						tmpObserved = targetsToObserved.get(proxiesToTargetsMap.get(item));
						if (tmpObserved) {
							tmpObserved.ownKey = i;
						} else {
							console.error('failed to resolve proxy -> target -> observed');
						}
					}
				}
				for (let i = 0, l = unshiftContent.length; i < l; i++) {
					changes.push(new InsertChange(observed.path.concat(i), target[i]));
				}
				observable.notify(changes);
				return unshiftResult;
			};
		} else if (key === 'reverse') {
			result = function proxiedReverse() {
				let changes, tmpObserved;
				Reflect.apply(target[key], target, arguments);
				for (let i = 0, l = target.length, item; i < l; i++) {
					item = target[i];
					if (item && typeof item === 'object') {
						tmpObserved = targetsToObserved.get(proxiesToTargetsMap.get(item));
						if (tmpObserved) {
							tmpObserved.ownKey = i;
						} else {
							console.error('failed to resolve proxy -> target -> observed');
						}
					}
				}
				changes = [new ReverseChange()];
				observable.notify(changes);
				return this;
			};
		} else if (key === 'sort') {
			result = function proxiedSort() {
				let changes, tmpObserved;
				Reflect.apply(target[key], target, arguments);
				for (let i = 0, l = target.length, item; i < l; i++) {
					item = target[i];
					if (item && typeof item === 'object') {
						tmpObserved = targetsToObserved.get(proxiesToTargetsMap.get(item));
						if (tmpObserved) {
							tmpObserved.ownKey = i;
						} else {
							console.error('failed to resolve proxy -> target -> observed');
						}
					}
				}
				changes = [new ShuffleChange()];
				observable.notify(changes);
				return this;
			};
		} else if (key === 'fill') {
			result = function proxiedFill() {
				let start, end, changes = [], prev, argLen = arguments.length, tarLen = target.length;
				start = argLen < 2 ? 0 : (arguments[1] < 0 ? tarLen + arguments[1] : arguments[1]);
				end = argLen < 3 ? tarLen : (arguments[2] < 0 ? tarLen + arguments[2] : arguments[2]);
				prev = target.slice();
				Reflect.apply(target[key], target, arguments);
				for (let i = start, item; i < end; i++) {
					item = target[i];
					if (item && typeof item === 'object') {
						target[i] = new Observed(item, i, observed).proxy;
					}
					if (prev.hasOwnProperty(i)) {
						changes.push(new UpdateChange(observed.path.concat(i), target[i], prev[i] && typeof prev[i] === 'object' ? proxiesToTargetsMap.get(prev[i]) : prev[i]));
						if (prev[i] && typeof prev[i] === 'object') {
							targetsToObserved.get(proxiesToTargetsMap.get(prev[i])).revoke();
						}
					} else {
						changes.push(new InsertChange(observed.path.concat(i), target[i]));
					}
				}
				observable.notify(changes);
				return this;
			};
		} else if (key === 'splice') {
			result = function proxiedSplice() {
				let spliceContent, spliceResult, changes = [], tmpObserved,
					index, startIndex, removed, inserted, splLen, tarLen = target.length;

				spliceContent = Array.from(arguments);
				splLen = spliceContent.length;

				//	observify the newcomers
				for (let i = 0, item; i < splLen; i++) {
					item = spliceContent[i];
					if (i > 1 && item && typeof item === 'object') {
						spliceContent[i] = new Observed(item, i, observed).proxy;
					}
				}

				//	calculate pointers
				startIndex = splLen === 0 ? 0 : (spliceContent[0] < 0 ? tarLen + spliceContent[0] : spliceContent[0]);
				removed = splLen < 2 ? tarLen - startIndex : spliceContent[1];
				inserted = Math.max(splLen - 2, 0);
				spliceResult = Reflect.apply(target[key], target, spliceContent);

				//	reindex the paths
				for (let i = 0, item; i < tarLen; i++) {
					item = target[i];
					if (item && typeof item === 'object') {
						tmpObserved = targetsToObserved.get(proxiesToTargetsMap.get(item));
						if (tmpObserved) {
							tmpObserved.ownKey = i;
						} else {
							console.error('failed to resolve proxy -> target -> observed');
						}
					}
				}

				//	revoke removed Observed
				for (let i = 0, l = spliceResult.length, item; i < l; i++) {
					item = spliceResult[i];
					if (removed && typeof removed === 'object') {
						item = proxiesToTargetsMap.get(removed);
						targetsToObserved.get(item).revoke();
					}
				}

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
				observable.notify(changes);

				return spliceResult;
			};
		} else {
			result = Reflect.get(target, key);
		}
		return result;
	}

	function proxiedSet(target, key, value) {
		let oldValuePresent = target.hasOwnProperty(key),
			oldValue = target[key],
			result,
			observed = targetsToObserved.get(target),
			observable = observedToObservable.get(observed.root);

		if (value && typeof value === 'object' && !isNonObservable(value)) {
			result = Reflect.set(target, key, new Observed(value, key, observed).proxy);
		} else {
			result = Reflect.set(target, key, value);
		}

		if (result) {
			if (proxiesToTargetsMap.has(oldValue)) {
				targetsToObserved.get(proxiesToTargetsMap.get(oldValue)).revoke();
				proxiesToTargetsMap.delete(oldValue);
			}

			if (observable.hasListeners) {
				let path = observed.path.concat(key),
					changes = [oldValuePresent ? new UpdateChange(path, value, oldValue) : new InsertChange(path, value)];
				if (!observed.preventCallbacks) {
					observable.notify(changes);
				}
			}
		}
		return result;
	}

	function proxiedDelete(target, key) {
		let oldValue = target[key],
			result,
			observed = targetsToObserved.get(target),
			observable = observedToObservable.get(observed.root);

		result = Reflect.deleteProperty(target, key);

		if (result) {
			if (proxiesToTargetsMap.has(oldValue)) {
				targetsToObserved.get(proxiesToTargetsMap.get(oldValue)).revoke();
				proxiesToTargetsMap.delete(oldValue);
			}

			if (observable.hasListeners) {
				let path = observed.path.concat(key),
					changes = [new DeleteChange(path, oldValue)];
				if (!observed.preventCallbacks) {
					observable.notify(changes);
				}
			}
		}
		return result;
	}

	function processArraySubgraph(graph, parentObserved) {
		for (let i = 0, l = graph.length, item; i < l; i++) {
			item = graph[i];
			if (item && typeof item === 'object' && !isNonObservable(item)) {
				graph[i] = new Observed(item, i, parentObserved).proxy;
			}
		}
	}

	function processObjectSubgraph(graph, parentObserved) {
		let keys = Object.keys(graph);
		for (let i = 0, l = keys.length, key, item; i < l; i++) {
			key = keys[i];
			item = graph[key];
			if (item && typeof item === 'object' && !isNonObservable(item)) {
				graph[key] = new Observed(item, key, parentObserved).proxy;
			}
		}
	}

	function Observed(origin, ownKey, parent) {
		let targetClone, revokableProxy;

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
		Object.defineProperties(this, {
			revokable: {value: revokableProxy},
			proxy: {value: revokableProxy.proxy},
			parent: {value: parent},
			ownKey: {value: ownKey, writable: true}
		});
	}

	Object.defineProperty(Observed.prototype, 'root', {
		get: function() {
			let result = this;
			while (result.parent) {
				result = result.parent;
			}
			return result;
		}
	});
	Object.defineProperty(Observed.prototype, 'path', {
		get: function() {
			let result = [], pointer = this;
			while (typeof pointer.ownKey !== 'undefined') {
				result.push(pointer.ownKey);
				pointer = pointer.parent;
			}
			return result.reverse();
		}
	});
	Object.defineProperty(Observed.prototype, 'revoke', {
		value: function() {
			let proxy = this.proxy,
				keys = Object.keys(proxy);
			for (let i = 0, l = keys.length, key, item; i < l; i++) {
				key = keys[i];
				item = proxy[key];
				if (proxiesToTargetsMap.has(item)) {
					targetsToObserved.get(proxiesToTargetsMap.get(item)).revoke();
					proxiesToTargetsMap.get(proxy)[key] = proxiesToTargetsMap.get(item);
				}
			}
			this.revokable.revoke();
			//	TODO: ensure if there are any other cleanups to do here (probably remove observed?)
		}
	});

	function Observable(observed) {
		let isRevoked = false, callbacks = [];

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
				for (let i = 0, l = arguments.length, idx; i < l; i++) {
					idx = callbacks.indexOf(arguments[i]);
					if (idx >= 0) callbacks.splice(idx, 1);
				}
			} else {
				callbacks.splice(0, callbacks.length);
			}
		}

		function revoke() {
			if (!isRevoked) {
				isRevoked = true;
				observed.revoke();
			} else {
				console.log('revokation of Observable have an effect only once');
			}
		}

		function hasListeners() {
			return callbacks.length > 0;
		}

		function notify(changes) {
			for (let i = 0, l = callbacks.length, callback; i < l; i++) {
				callback = callbacks[i];
				try {
					callback(changes);
				} catch (e) {
					console.error(e);
				}
			}
		}

		Object.defineProperties(observed.proxy, {
			observe: {value: observe},
			unobserve: {value: unobserve},
			revoke: {value: revoke}
		});

		Object.defineProperties(this, {
			hasListeners: {value: hasListeners},
			notify: {value: notify}
		});
	}

	function InsertChange(path, value) {
		Object.defineProperties(this, {
			type: {value: 'insert'},
			path: {value: path},
			value: {value: value}
		});
	}

	function UpdateChange(path, value, oldValue) {
		Object.defineProperties(this, {
			type: {value: 'update'},
			path: {value: path},
			value: {value: value},
			oldValue: {value: oldValue}
		});
	}

	function DeleteChange(path, oldValue) {
		Object.defineProperties(this, {
			type: {value: 'delete'},
			path: {value: path},
			oldValue: {value: oldValue}
		});
	}

	function ReverseChange() {
		Object.defineProperties(this, {
			type: {value: 'reverse'}
		});
	}

	function ShuffleChange() {
		Object.defineProperties(this, {
			type: {value: 'shuffle'}
		});
	}

	Object.defineProperty(Observable, 'from', {
		value: function(target) {
			if (!target || typeof target !== 'object') {
				throw new Error('observable MAY ONLY be created from non-null object only');
			} else if ('observe' in target || 'unobserve' in target || 'revoke' in target) {
				throw new Error('target object MUST NOT have nor own neither inherited properties from the following list: "observe", "unobserve", "revoke"');
			} else if (isNonObservable(target)) {
				throw new Error(target + ' found to be one of non-observable object types: ' + nonObservables);
			}
			let observed = new Observed(target),
				observable = new Observable(observed);
			observedToObservable.set(observed, observable);
			return observed.proxy;
		}
	});

	Object.defineProperty(scope, 'Observable', {value: Observable});
})();