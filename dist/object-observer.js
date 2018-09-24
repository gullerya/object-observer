(() => {
	'use strict';

	const scope = this || window,
		proxiesToTargetsMap = new Map(),
		targetsToObserved = new WeakMap(),
		observedToObservable = new WeakMap(),
		nonObservables = {
			Date: true,
			Blob: true,
			Number: true,
			String: true,
			Boolean: true,
			Error: true,
			SyntaxError: true,
			TypeError: true,
			URIError: true,
			Function: true,
			Promise: true,
			RegExp: true
		};

	function cloneArrayShallow(target) {
		let i = 0, l = target.length, result = new Array(l);
		for (; i < l; i++) result[i] = target[i];
		return result;
	}

	function cloneObjectShallow(target) {
		return Object.assign({}, target);
	}

	function isNonObservable(target) {
		return nonObservables.hasOwnProperty(target.constructor.name);
	}

	function proxiedArrayGet(target, key) {
		let result,
			observed = targetsToObserved.get(target),
			observable = observedToObservable.get(observed.root);
		if (key === 'pop') {
			result = function proxiedPop() {
				let poppedIndex, popResult, tmpTarget;
				poppedIndex = target.length - 1;
				popResult = Reflect.apply(target[key], target, arguments);
				tmpTarget = proxiesToTargetsMap.get(popResult);
				if (tmpTarget) {
					targetsToObserved.get(tmpTarget).revoke();
					popResult = tmpTarget;
				}

				let i, p = observed.path, l = p.length, changePath = new Array(l + 1);
				for (i = 0; i < l; i++) changePath[i] = p[i];
				changePath[l] = poppedIndex;

				observable.notify([{type: 'delete', path: changePath, oldValue: popResult}]);
				return popResult;
			};
		} else if (key === 'push') {
			result = function proxiedPush() {
				let l = arguments.length, pushContent = new Array(l), pushResult, changes = [],
					startingLength, i1, p = observed.path, l1 = p.length, changePath;
				startingLength = target.length;
				for (let i = 0, item; i < l; i++) {
					item = arguments[i];
					if (item && typeof item === 'object') {
						item = new Observed(item, startingLength + i, observed).proxy;
					}
					pushContent[i] = item;
					changePath = new Array(l1 + 1);
					for (i1 = 0; i1 < l1; i1++) changePath[i] = p[i1];
					changePath[l1] = startingLength + i;

					changes[i] = {type: 'insert', path: changePath, value: item};
				}
				pushResult = Reflect.apply(target[key], target, pushContent);
				observable.notify(changes);
				return pushResult;
			};
		} else if (key === 'shift') {
			result = function proxiedShift() {
				let shiftResult, tmpTarget;
				shiftResult = Reflect.apply(target[key], target, arguments);
				tmpTarget = proxiesToTargetsMap.get(shiftResult);
				if (tmpTarget) {
					targetsToObserved.get(tmpTarget).revoke();
					shiftResult = tmpTarget;
				}

				//	update indices of the remaining items
				for (let i = 0, l = target.length, item, tmpObserved; i < l; i++) {
					item = target[i];
					if (item && typeof item === 'object') {
						tmpObserved = targetsToObserved.get(proxiesToTargetsMap.get(item));
						if (tmpObserved) {
							tmpObserved.ownKey = i;
						} else {
							console.error('unexpectedly failed to resolve proxy -> target -> observed');
						}
					}
				}
				observable.notify([{
					type: 'delete',
					path: observed.path.concat(0),
					oldValue: shiftResult
				}]);
				return shiftResult;
			};
		} else if (key === 'unshift') {
			result = function proxiedUnshift() {
				let unshiftContent, unshiftResult, changes = [], tmpObserved;
				unshiftContent = Array.from(arguments);
				unshiftContent.forEach((item, index) => {
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
					changes.push({type: 'insert', path: observed.path.concat(i), value: target[i]});
				}
				observable.notify(changes);
				return unshiftResult;
			};
		} else if (key === 'reverse') {
			result = function proxiedReverse() {
				let tmpObserved;
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
				observable.notify([{type: 'reverse', path: observed.path}]);
				return this;
			};
		} else if (key === 'sort') {
			result = function proxiedSort() {
				let tmpObserved;
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
				observable.notify([{type: 'shuffle', path: observed.path}]);
				return this;
			};
		} else if (key === 'fill') {
			result = function proxiedFill() {
				let start, end, changes = [], prev, argLen = arguments.length, tarLen = target.length;
				start = argLen < 2 ? 0 : (arguments[1] < 0 ? tarLen + arguments[1] : arguments[1]);
				end = argLen < 3 ? tarLen : (arguments[2] < 0 ? tarLen + arguments[2] : arguments[2]);
				prev = target.slice();
				Reflect.apply(target[key], target, arguments);
				for (let i = start, item, tmpTarget; i < end; i++) {
					item = target[i];
					if (item && typeof item === 'object') {
						target[i] = new Observed(item, i, observed).proxy;
					}
					if (prev.hasOwnProperty(i)) {
						tmpTarget = proxiesToTargetsMap.get(prev[i]);
						if (tmpTarget) {
							targetsToObserved.get(tmpTarget).revoke();
						}

						changes.push({
							type: 'update',
							path: observed.path.concat(i),
							value: target[i],
							oldValue: tmpTarget || prev[i]
						});
					} else {
						changes.push({type: 'insert', path: observed.path.concat(i), value: target[i]});
					}
				}
				observable.notify(changes);
				return this;
			};
		} else if (key === 'splice') {
			result = function proxiedSplice() {
				let spliceContent, spliceResult, changes = [], tmpObserved,
					startIndex, removed, inserted, splLen, tarLen = target.length;

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
				tarLen = target.length;

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
				for (let i = 0, l = spliceResult.length, item, tmpTarget; i < l; i++) {
					item = spliceResult[i];
					tmpTarget = proxiesToTargetsMap.get(item);
					if (tmpTarget) {
						targetsToObserved.get(tmpTarget).revoke();
						spliceResult[i] = tmpTarget;
					}
				}

				//	publish changes
				let index;
				for (index = 0; index < removed; index++) {
					if (index < inserted) {
						changes.push({
							type: 'update',
							path: observed.path.concat(startIndex + index),
							value: target[startIndex + index],
							oldValue: spliceResult[index]
						});
					} else {
						changes.push({
							type: 'delete',
							path: observed.path.concat(startIndex + index),
							oldValue: spliceResult[index]
						});
					}
				}
				for (; index < inserted; index++) {
					changes.push({
						type: 'insert',
						path: observed.path.concat(startIndex + index),
						value: target[startIndex + index]
					});
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
		let oldValue = target[key],
			newValue,
			observed = targetsToObserved.get(target),
			observable = observedToObservable.get(observed.root);

		if (value && typeof value === 'object' && !isNonObservable(value)) {
			newValue = new Observed(value, key, observed).proxy;
		} else {
			newValue = value;
		}

		target[key] = newValue;

		if (oldValue) {
			let oldTarget = proxiesToTargetsMap.get(oldValue);
			if (oldTarget) {
				targetsToObserved.get(oldTarget).revoke();
				oldValue = oldTarget;
			}
		}

		if (observable.hasListeners() && !observed.preventCallbacks) {
			let i, p = observed.path, l = p.length, path = new Array(l + 1);
			for (i = 0; i < l; i++) path[i] = p[i];
			path[l] = key;
			observable.notify([typeof oldValue !== 'undefined'
				? {type: 'update', path: path, value: value, oldValue: oldValue}
				: {type: 'insert', path: path, value: value}
			]);
		}
		return true;
	}

	function proxiedDelete(target, key) {
		let oldValue = target[key],
			result,
			observed = targetsToObserved.get(target),
			observable = observedToObservable.get(observed.root);

		result = delete target[key];

		if (result) {
			if (oldValue) {
				let oldTarget = proxiesToTargetsMap.get(oldValue);
				if (oldTarget) {
					targetsToObserved.get(oldTarget).revoke();
					oldValue = oldTarget;
				}
			}

			if (observable.hasListeners() && !observed.preventCallbacks) {
				let i, p = observed.path, l = p.length, path = new Array(l + 1);
				for (i = 0; i < l; i++) path[i] = p[i];
				path[l] = key;
				observable.notify([{type: 'delete', path: path, oldValue: oldValue}]);
			}
		}
		return result;
	}

	function processArraySubgraph(graph, parentObserved) {
		let i = 0, l = graph.length, item;
		for (; i < l; i++) {
			item = graph[i];
			if (item && typeof item === 'object' && !isNonObservable(item)) {
				graph[i] = new Observed(item, i, parentObserved).proxy;
			}
		}
	}

	function processObjectSubgraph(graph, parentObserved) {
		let keys = Object.keys(graph), l = keys.length, key, item;
		while (l--) {
			key = keys[l];
			item = graph[key];
			if (item && typeof item === 'object' && !isNonObservable(item)) {
				graph[key] = new Observed(item, key, parentObserved).proxy;
			}
		}
	}

	//	CLASSES
	//
	function Observed(origin, ownKey, parent) {
		let targetClone;

		if (Array.isArray(origin)) {
			targetClone = cloneArrayShallow(origin);
			processArraySubgraph(targetClone, this);
			this.revokable = Proxy.revocable(targetClone, {
				set: proxiedSet,
				get: proxiedArrayGet,
				deleteProperty: proxiedDelete
			});
		} else {
			targetClone = cloneObjectShallow(origin);
			processObjectSubgraph(targetClone, this);
			this.revokable = Proxy.revocable(targetClone, {
				set: proxiedSet,
				deleteProperty: proxiedDelete
			});
		}
		this.targetClone = targetClone;
		this.proxy = this.revokable.proxy;
		this.ownKey = ownKey;
		this.parent = parent;

		targetsToObserved.set(targetClone, this);
		proxiesToTargetsMap.set(this.proxy, targetClone);
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
			let tmp = [], result = [], l1 = 0, l2 = 0, pointer = this;
			while (typeof pointer.ownKey !== 'undefined') {
				tmp[l1++] = pointer.ownKey;
				pointer = pointer.parent;
			}
			while (l1--) result[l2++] = tmp[l1];
			return result;
		}
	});
	Object.defineProperty(Observed.prototype, 'revoke', {
		value: function() {
			let target = proxiesToTargetsMap.get(this.proxy),
				keys = Object.keys(target);

			//	revoke native proxy
			this.revokable.revoke();

			//	roll back observed graph to unobserved one
			for (let i = 0, l = keys.length, key, tmpTarget; i < l; i++) {
				key = keys[i];
				tmpTarget = proxiesToTargetsMap.get(target[key]);
				if (tmpTarget) {
					target[key] = targetsToObserved.get(tmpTarget).revoke();
				}
			}

			//	clean revoked Observed from the maps
			proxiesToTargetsMap.delete(this.proxy);
			targetsToObserved.delete(target);

			//	return an unobserved graph (effectively this is an opposite of an Observed constructor logic)
			return target;
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
			if (isRevoked) { throw new TypeError('revoked Observable MAY NOT be unobserved anymore'); }
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
				console.log('revoking of Observable effective only once');
			}
		}

		function hasListeners() {
			return callbacks.length > 0;
		}

		function notify(changes) {
			let l = callbacks.length;
			while (l--) {
				try {
					callbacks[l](changes);
				} catch (e) {
					console.error('one/some of the observing callbacks failed with ', e);
				}
			}
		}

		Object.defineProperties(observed.targetClone, {
			observe: {value: observe},
			unobserve: {value: unobserve},
			revoke: {value: revoke}
		});

		this.hasListeners = hasListeners;
		this.notify = notify;
	}

	Object.defineProperty(Observable, 'from', {
		value: function(target) {
			if (target && typeof target === 'object' && !isNonObservable(target) && !('observe' in target) && !('unobserve' in target) && !('revoke' in target)) {
				let observed = new Observed(target), observable = new Observable(observed);
				observedToObservable.set(observed, observable);
				return observed.proxy;
			} else {
				if (!target || typeof target !== 'object') {
					throw new Error('observable MAY ONLY be created from non-null object only');
				} else if ('observe' in target || 'unobserve' in target || 'revoke' in target) {
					throw new Error('target object MUST NOT have nor own neither inherited properties from the following list: "observe", "unobserve", "revoke"');
				} else if (isNonObservable(target)) {
					throw new Error(target + ' found to be one of non-observable object types: ' + nonObservables);
				}
			}
		}
	});

	Object.defineProperty(scope, 'Observable', {value: Observable});
})();