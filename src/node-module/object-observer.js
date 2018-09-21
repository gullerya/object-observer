const proxiesToTargetsMap = new WeakMap(),
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

module.exports = Observable;

function copyShallow(target) {
	return Array.isArray(target) ? target.slice() : Object.assign({}, target);
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
			}
			observable.notify([new DeleteChange(observed.path.concat(poppedIndex), tmpTarget || popResult)]);
			return tmpTarget || popResult;
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
			let shiftResult, tmpTarget;
			shiftResult = Reflect.apply(target[key], target, arguments);
			tmpTarget = proxiesToTargetsMap.get(shiftResult);
			if (tmpTarget) {
				targetsToObserved.get(tmpTarget).revoke();
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
			observable.notify([new DeleteChange(observed.path.concat(0), tmpTarget || shiftResult)]);
			return tmpTarget || shiftResult;
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
				changes.push(new InsertChange(observed.path.concat(i), target[i]));
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
			observable.notify([new ReverseChange()]);
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
			observable.notify([new ShuffleChange()]);
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

					changes.push(new UpdateChange(observed.path.concat(i), target[i], tmpTarget || prev[i]));
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
		oldTarget,
		observed = targetsToObserved.get(target),
		observable = observedToObservable.get(observed.root);

	if (value && typeof value === 'object' && !isNonObservable(value)) {
		result = Reflect.set(target, key, new Observed(value, key, observed).proxy);
	} else {
		result = Reflect.set(target, key, value);
	}

	if (result) {
		oldTarget = proxiesToTargetsMap.get(oldValue);
		if (oldTarget) {
			targetsToObserved.get(oldTarget).revoke();
		}

		if (observable.hasListeners() && !observed.preventCallbacks) {
			let path = observed.path.concat(key);
			observable.notify([oldValuePresent ? new UpdateChange(path, value, oldTarget || oldValue) : new InsertChange(path, value)]);
		}
	}
	return result;
}

function proxiedDelete(target, key) {
	let oldValue = target[key],
		result,
		oldTarget,
		observed = targetsToObserved.get(target),
		observable = observedToObservable.get(observed.root);

	result = Reflect.deleteProperty(target, key);

	if (result) {
		oldTarget = proxiesToTargetsMap.get(oldValue);
		if (oldTarget) {
			targetsToObserved.get(oldTarget).revoke();
		}

		if (observable.hasListeners() && !observed.preventCallbacks) {
			let path = observed.path.concat(key);
			observable.notify([new DeleteChange(path, oldTarget || oldValue)]);
		}
	}
	return result;
}

function processArraySubgraph(graph, parentObserved) {
	let l = graph.length, item;
	while (l--) {
		item = graph[l];
		if (item && typeof item === 'object' && !isNonObservable(item)) {
			graph[l] = new Observed(item, l, parentObserved).proxy;
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

function Observed(origin, ownKey, parent) {
	let targetClone = copyShallow(origin);

	if (Array.isArray(targetClone)) {
		processArraySubgraph(targetClone, this);
		this.revokable = Proxy.revocable(targetClone, {
			set: proxiedSet,
			get: proxiedArrayGet,
			deleteProperty: proxiedDelete
		});
	} else {
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
		let result = [], pointer = this;
		while (typeof pointer.ownKey !== 'undefined') {
			result.unshift(pointer.ownKey);
			pointer = pointer.parent;
		}
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

	this.hasListeners = function hasListeners() {
		return callbacks.length > 0;
	};

	this.notify = function notify(changes) {
		for (let i = 0, l = callbacks.length, callback; i < l; i++) {
			callback = callbacks[i];
			try {
				callback(changes);
			} catch (e) {
				console.error('one/some of the observing callbacks failed with ', e);
			}
		}
	};

	observed.targetClone.observe = observe;
	observed.targetClone.unobserve = unobserve;
	observed.targetClone.revoke = revoke;
}

function InsertChange(path, value) {
	this.type = 'insert';
	this.path = path;
	this.value = value;
}

function UpdateChange(path, value, oldValue) {
	this.type = 'update';
	this.path = path;
	this.value = value;
	this.oldValue = oldValue;
}

function DeleteChange(path, oldValue) {
	this.type = 'delete';
	this.path = path;
	this.oldValue = oldValue;
}

function ReverseChange() {
	this.type = 'reverse';
}

function ShuffleChange() {
	this.type = 'shuffle';
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
Object.freeze(Observable);
