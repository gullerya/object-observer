const proxiesToTargetsMap = new WeakMap(),
	targetsToObserved = new WeakMap(),
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

export default Observable;

function isObservable(target) {
	return target && typeof target === 'object' && !nonObservables.hasOwnProperty(target.constructor.name);
}

function proxiedArrayGet(target, key) {
	let result,
		observed = targetsToObserved.get(target),
		basePath = observed.getPath(),
		observable = observed.observable;
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

			let i, l = basePath.length, changePath = new Array(l + 1);
			for (i = 0; i < l; i++) changePath[i] = basePath[i];
			changePath[l] = poppedIndex;

			observable.notify([{type: 'delete', path: changePath, oldValue: popResult}]);
			return popResult;
		};
	} else if (key === 'push') {
		result = function proxiedPush() {
			let l = arguments.length, pushContent = new Array(l), pushResult, changes = [],
				startingLength, i1, l1 = basePath.length, changePath;
			startingLength = target.length;
			for (let i = 0, item; i < l; i++) {
				item = arguments[i];
				if (isObservable(item)) {
					item = new Observed({
						target: item, ownKey: startingLength + i, parent: observed, observable: observable
					}).proxy;
				}
				pushContent[i] = item;
				changePath = new Array(l1 + 1);
				for (i1 = 0; i1 < l1; i1++) changePath[i] = basePath[i1];
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
				path: basePath.concat(0),
				oldValue: shiftResult
			}]);
			return shiftResult;
		};
	} else if (key === 'unshift') {
		result = function proxiedUnshift() {
			let unshiftContent, unshiftResult, changes = [], tmpObserved;
			unshiftContent = Array.from(arguments);
			unshiftContent.forEach((item, index) => {
				if (isObservable(item)) {
					unshiftContent[index] = new Observed({
						target: item, ownKey: index, parent: observed, observable: observable
					}).proxy;
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
				changes.push({type: 'insert', path: basePath.concat(i), value: target[i]});
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
			observable.notify([{type: 'reverse'}]);
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
			observable.notify([{type: 'shuffle'}]);
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
				if (isObservable(item)) {
					target[i] = new Observed({
						target: item, ownKey: i, parent: observed, observable: observable
					}).proxy;
				}
				if (prev.hasOwnProperty(i)) {
					tmpTarget = proxiesToTargetsMap.get(prev[i]);
					if (tmpTarget) {
						targetsToObserved.get(tmpTarget).revoke();
					}

					changes.push({
						type: 'update',
						path: basePath.concat(i),
						value: target[i],
						oldValue: tmpTarget || prev[i]
					});
				} else {
					changes.push({type: 'insert', path: basePath.concat(i), value: target[i]});
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
				if (i > 1 && isObservable(item)) {
					spliceContent[i] = new Observed({
						target: item, ownKey: i, parent: observed, observable: observable
					}).proxy;
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
						path: basePath.concat(startIndex + index),
						value: target[startIndex + index],
						oldValue: spliceResult[index]
					});
				} else {
					changes.push({
						type: 'delete',
						path: basePath.concat(startIndex + index),
						oldValue: spliceResult[index]
					});
				}
			}
			for (; index < inserted; index++) {
				changes.push({
					type: 'insert',
					path: basePath.concat(startIndex + index),
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
		observed = targetsToObserved.get(target),
		observable = observed.observable;

	if (isObservable(value)) {
		target[key] = new Observed({
			target: value, ownKey: key, parent: observed, observable: observable
		}).proxy;
	} else {
		target[key] = value;
	}

	if (oldValue) {
		let oldTarget = proxiesToTargetsMap.get(oldValue);
		if (oldTarget) {
			targetsToObserved.get(oldTarget).revoke();
			oldValue = oldTarget;
		}
	}

	if (observable.hasListeners()) {
		let i,
			p = observed.getPath(),
			l = p.length,
			path = new Array(l + 1);
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
		observed = targetsToObserved.get(target),
		observable = observed.observable;

	if (delete target[key]) {
		if (oldValue) {
			let oldTarget = proxiesToTargetsMap.get(oldValue);
			if (oldTarget) {
				targetsToObserved.get(oldTarget).revoke();
				oldValue = oldTarget;
			}
		}

		if (observable.hasListeners()) {
			let i, p = observed.getPath(), l = p.length, path = new Array(l + 1);
			for (i = 0; i < l; i++) path[i] = p[i];
			path[l] = key;
			observable.notify([{type: 'delete', path: path, oldValue: oldValue}]);
		}
		return true;
	} else {
		return false;
	}
}

//	CLASSES

function Observed(properties) {
	this.ownKey = properties.ownKey;
	this.parent = properties.parent;
	this.observable = properties.observable;

	let target = properties.target, clone;
	if (Array.isArray(target)) {
		let i = 0, l = target.length;
		clone = new Array(l);
		for (; i < l; i++) clone[i] = target[i];
		this.processArraySubgraph(clone);
		this.revokable = Proxy.revocable(clone, {
			set: proxiedSet,
			get: proxiedArrayGet,
			deleteProperty: proxiedDelete
		});
	} else {
		clone = Object.assign({}, target);
		this.processObjectSubgraph(clone);
		this.revokable = Proxy.revocable(clone, {
			set: proxiedSet,
			deleteProperty: proxiedDelete
		});
	}

	this.proxy = this.revokable.proxy;
	this.targetClone = clone;

	targetsToObserved.set(clone, this);
	proxiesToTargetsMap.set(this.proxy, clone);
}

Observed.prototype.processObjectSubgraph = function processObjectSubgraph(graph) {
	let keys = Object.keys(graph), l = keys.length, key, item, observable = this.observable;
	while (l--) {
		key = keys[l];
		item = graph[key];
		if (isObservable(item)) {
			graph[key] = new Observed({
				target: item, ownKey: key, parent: this, observable: observable
			}).proxy;
		}
	}
};
Observed.prototype.processArraySubgraph = function processArraySubgraph(graph) {
	let i = 0, l = graph.length, item, observable = this.observable;
	for (; i < l; i++) {
		item = graph[i];
		if (isObservable(item)) {
			graph[i] = new Observed({
				target: item, ownKey: i, parent: this, observable: observable
			}).proxy;
		}
	}
};
Observed.prototype.getPath = function getPath() {
	let tmp = [], result = [], l1 = 0, l2 = 0, pointer = this;
	while (pointer.ownKey !== null) {
		tmp[l1++] = pointer.ownKey;
		pointer = pointer.parent;
	}
	while (l1--) result[l2++] = tmp[l1];
	return result;
};
Observed.prototype.revoke = function revoke() {
	let target = proxiesToTargetsMap.get(this.proxy),
		keys = Object.keys(target),
		l = keys.length;

	//	revoke native proxy
	this.revokable.revoke();

	//	roll back observed graph to unobserved one
	while (l--) {
		let key = keys[l],
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
};

function Observable(target) {
	let rootObserved,
		isRevoked = false,
		callbacks = [];

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
			rootObserved.revoke();
		} else {
			console.log('revoking of Observable effective only once');
		}
	}

	this.getRootProxy = function getRootProxy() {
		return rootObserved.proxy;
	};

	this.hasListeners = function hasListeners() {
		return callbacks.length > 0;
	};

	this.getListeners = function getListeners() {
		return callbacks;
	};

	this.notify = function notify(changes) {
		let l = callbacks.length;
		while (l--) {
			try {
				callbacks[l](changes);
			} catch (e) {
				console.error('one/some of the observing callbacks failed with ', e);
			}
		}
	};

	rootObserved = new Observed({
		target: target,
		ownKey: null,
		parent: null,
		observable: this
	});
	Object.defineProperties(rootObserved.targetClone, {
		observe: {value: observe},
		unobserve: {value: unobserve},
		revoke: {value: revoke}
	});
}

Object.defineProperty(Observable, 'from', {
	value: function(target) {
		if (isObservable(target) && !('observe' in target) && !('unobserve' in target) && !('revoke' in target)) {
			let observable = new Observable(target);
			return observable.getRootProxy();
		} else {
			if (!target || typeof target !== 'object') {
				throw new Error('observable MAY ONLY be created from non-null object only');
			} else if ('observe' in target || 'unobserve' in target || 'revoke' in target) {
				throw new Error('target object MUST NOT have nor own neither inherited properties from the following list: "observe", "unobserve", "revoke"');
			} else if (!isObservable(target)) {
				throw new Error(target + ' found to be one of non-observable object types: ' + nonObservables);
			}
		}
	}
});
Object.freeze(Observable);
