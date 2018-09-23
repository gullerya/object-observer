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
	},
	proxiedArrayMethods = {
		pop: function proxiedPop(target) {
			let observed = targetsToObserved.get(target),
				listeners = observed.getListeners(),
				poppedIndex, popResult, tmpTarget;
			poppedIndex = target.length - 1;
			popResult = Reflect.apply(target.pop, target, arguments);
			tmpTarget = proxiesToTargetsMap.get(popResult);
			if (tmpTarget) {
				targetsToObserved.get(tmpTarget).revoke();
				popResult = tmpTarget;
			}

			//	publish changes
			if (listeners.length) {
				let path = observed.getPath();
				path.push(poppedIndex);
				callListeners(listeners, [{type: 'delete', path: path, oldValue: popResult}]);
			}
			return popResult;
		},
		push: function proxiedPush(target) {
			let observed = targetsToObserved.get(target),
				listeners = observed.getListeners(),
				l = arguments.length - 1, pushContent = new Array(l), pushResult, changes = [],
				startingLength, basePath;
			startingLength = target.length;

			if (listeners.length) {
				basePath = observed.getPath();
			}
			for (let i = 0, item; i < l; i++) {
				item = arguments[i + 1];
				if (isObservable(item)) {
					item = new Observable({
						target: item, ownKey: startingLength + i, parent: observed
					}).proxy;
				}
				pushContent[i] = item;

				if (listeners.length) {
					let path = basePath.slice(0);
					path.push(startingLength + i);
					changes[i] = {type: 'insert', path: path, value: item};
				}
			}
			pushResult = Reflect.apply(target.push, target, pushContent);

			//	publish changes
			if (listeners.length) {
				callListeners(listeners, changes);
			}
			return pushResult;
		},
		shift: function proxiedShift(target) {
			let observed = targetsToObserved.get(target),
				listeners = observed.getListeners(),
				shiftResult, tmpTarget;
			shiftResult = Reflect.apply(target.shift, target, arguments);
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

			//	publish changes
			if (listeners.length) {
				let path = observed.getPath();
				path.push(0);
				callListeners(listeners, [{type: 'delete', path: path, oldValue: shiftResult}]);
			}
			return shiftResult;
		},
		unshift: function proxiedUnshift(target) {
			let observed = targetsToObserved.get(target),
				listeners = observed.getListeners(),
				unshiftContent, unshiftResult, changes = [], tmpObserved;
			unshiftContent = Array.from(arguments);
			unshiftContent.shift();
			unshiftContent.forEach((item, index) => {
				if (isObservable(item)) {
					unshiftContent[index] = new Observable({
						target: item, ownKey: index, parent: observed
					}).proxy;
				}
			});
			unshiftResult = Reflect.apply(target.unshift, target, unshiftContent);
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

			//	publish changes
			if (listeners.length) {
				let basePath = observed.getPath(), path;
				for (let i = 0, l = unshiftContent.length; i < l; i++) {
					path = basePath.slice(0);
					path.push(i);
					changes.push({type: 'insert', path: path, value: target[i]});
				}
				callListeners(listeners, changes);
			}
			return unshiftResult;
		},
		reverse: function proxiedReverse(target) {
			let observed = targetsToObserved.get(target),
				listeners = observed.getListeners(),
				tmpObserved;
			target.reverse();
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

			//	publish changes
			if (listeners.length) {
				callListeners(listeners, [{type: 'reverse'}]);
			}
			return observed.proxy;
		},
		sort: function proxiedSort(target) {
			let observed = targetsToObserved.get(target),
				listeners = observed.getListeners(),
				tmpObserved;
			Reflect.apply(target.sort, target, [arguments[1]]);
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

			//	publish changes
			if (listeners.length) {
				callListeners(listeners, [{type: 'shuffle'}]);
			}
			return observed.proxy;
		},
		fill: function proxiedFill(target) {
			let observed = targetsToObserved.get(target),
				listeners = observed.getListeners(),
				normArgs, argLen,
				start, end, changes = [], prev, tarLen = target.length, basePath, path;
			normArgs = Array.from(arguments);
			normArgs.shift();
			argLen = normArgs.length;
			start = argLen < 2 ? 0 : (normArgs[1] < 0 ? tarLen + normArgs[1] : normArgs[1]);
			end = argLen < 3 ? tarLen : (normArgs[2] < 0 ? tarLen + normArgs[2] : normArgs[2]);
			prev = target.slice(0);
			Reflect.apply(target.fill, target, normArgs);

			if (listeners.length) {
				basePath = observed.getPath();
			}
			for (let i = start, item, tmpTarget; i < end; i++) {
				item = target[i];
				if (isObservable(item)) {
					target[i] = new Observable({
						target: item, ownKey: i, parent: observed
					}).proxy;
				}
				if (prev.hasOwnProperty(i)) {
					tmpTarget = proxiesToTargetsMap.get(prev[i]);
					if (tmpTarget) {
						targetsToObserved.get(tmpTarget).revoke();
					}

					path = basePath.slice(0);
					path.push(i);
					changes.push({type: 'update', path: path, value: target[i], oldValue: tmpTarget || prev[i]});
				} else {
					path = basePath.slice(0);
					path.push(i);
					changes.push({type: 'insert', path: path, value: target[i]});
				}
			}

			//	publish changes
			if (listeners.length) {
				callListeners(listeners, changes);
			}
			return observed.proxy;
		},
		splice: function proxiedSplice(target) {
			let observed = targetsToObserved.get(target),
				listeners = observed.getListeners(),
				spliceContent, spliceResult, changes = [], tmpObserved,
				startIndex, removed, inserted, splLen, tarLen = target.length;

			spliceContent = Array.from(arguments);
			spliceContent.shift();
			splLen = spliceContent.length;

			//	observify the newcomers
			for (let i = 0, item; i < splLen; i++) {
				item = spliceContent[i];
				if (i > 1 && isObservable(item)) {
					spliceContent[i] = new Observable({
						target: item, ownKey: i, parent: observed
					}).proxy;
				}
			}

			//	calculate pointers
			startIndex = splLen === 0 ? 0 : (spliceContent[0] < 0 ? tarLen + spliceContent[0] : spliceContent[0]);
			removed = splLen < 2 ? tarLen - startIndex : spliceContent[1];
			inserted = Math.max(splLen - 2, 0);
			spliceResult = Reflect.apply(target.splice, target, spliceContent);
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
			if (listeners.length) {
				let index, basePath = observed.getPath(), path;
				for (index = 0; index < removed; index++) {
					path = basePath.slice(0);
					path.push(startIndex + index);
					if (index < inserted) {
						changes.push({
							type: 'update', path: path, value: target[startIndex + index], oldValue: spliceResult[index]
						});
					} else {
						changes.push({type: 'delete', path: path, oldValue: spliceResult[index]});
					}
				}
				for (; index < inserted; index++) {
					path = basePath.slice(0);
					path.push(startIndex + index);
					changes.push({type: 'insert', path: path, value: target[startIndex + index]});
				}
				callListeners(listeners, changes);
			}
			return spliceResult;
		}
	};

export default Observable;

function isObservable(target) {
	return target && typeof target === 'object' && !nonObservables.hasOwnProperty(target.constructor.name);
}

function proxiedArrayGet(target, key) {
	if (proxiedArrayMethods.hasOwnProperty(key)) {
		return proxiedArrayMethods[key].bind(undefined, target);
	} else {
		return target[key];
	}
}

function proxiedDelete(target, key) {
	let oldValue = target[key],
		observed = targetsToObserved.get(target);

	if (delete target[key]) {
		if (oldValue) {
			let oldTarget = proxiesToTargetsMap.get(oldValue);
			if (oldTarget) {
				targetsToObserved.get(oldTarget).revoke();
				oldValue = oldTarget;
			}
		}

		//	publish changes
		let listeners = observed.getListeners();
		if (listeners.length) {
			let path = observed.getPath();
			path.push(key);
			callListeners(listeners, [{type: 'delete', path: path, oldValue: oldValue}]);
		}
		return true;
	} else {
		return false;
	}
}

function callListeners(listeners, changes) {
	let l = listeners.length;
	while (l--) {
		try {
			listeners[l](changes);
		} catch (e) {
			console.error(e);
		}
	}
}

//	CLASSES

function Observable(properties) {
	this.ownKey = properties.ownKey;
	this.parent = properties.parent;

	let target = properties.target, clone;
	if (Array.isArray(target)) {
		let i = 0, l = target.length;
		clone = new Array(l);
		for (; i < l; i++) clone[i] = target[i];
		this.processArraySubgraph(clone);
		this.revokable = Proxy.revocable(clone, {
			set: this.proxiedSet.bind(this),
			get: proxiedArrayGet,
			deleteProperty: proxiedDelete
		});
	} else {
		clone = Object.assign({}, target);
		this.processObjectSubgraph(clone);
		this.revokable = Proxy.revocable(clone, {
			set: this.proxiedSet.bind(this),
			deleteProperty: proxiedDelete
		});
	}

	this.observe = function observe(callback) {
		if (this.isRevoked) { throw new TypeError('revoked Observable MAY NOT be observed anymore'); }
		if (typeof callback !== 'function') { throw new Error('observer (callback) parameter MUST be a function'); }

		if (this.callbacks.indexOf(callback) < 0) {
			this.callbacks.push(callback);
		} else {
			console.info('observer (callback) may be bound to an observable only once');
		}
	};

	this.unobserve = function unobserve() {
		if (this.isRevoked) { throw new TypeError('revoked Observable MAY NOT be unobserved anymore'); }
		let l = arguments.length;
		if (l) {
			while (l--) {
				let idx = this.callbacks.indexOf(arguments[l]);
				if (idx >= 0) this.callbacks.splice(idx, 1);
			}
		} else {
			this.callbacks.splice(0);
		}
	};

	if (this.parent === null) {
		this.isRevoked = false;
		this.callbacks = [];
		Object.defineProperties(clone, {
			revoke: {value: this.revoke.bind(this)},
			observe: {value: this.observe.bind(this)},
			unobserve: {value: this.unobserve.bind(this)}
		});
	}

	this.proxy = this.revokable.proxy;

	targetsToObserved.set(clone, this);
	proxiesToTargetsMap.set(this.proxy, clone);
}

Observable.prototype.processObjectSubgraph = function processObjectSubgraph(graph) {
	let keys = Object.keys(graph), l = keys.length, key, item;
	while (l--) {
		key = keys[l];
		item = graph[key];
		if (isObservable(item)) {
			graph[key] = new Observable({
				target: item, ownKey: key, parent: this
			}).proxy;
		}
	}
};
Observable.prototype.processArraySubgraph = function processArraySubgraph(graph) {
	let i = 0, l = graph.length, item;
	for (; i < l; i++) {
		item = graph[i];
		if (isObservable(item)) {
			graph[i] = new Observable({
				target: item, ownKey: i, parent: this
			}).proxy;
		}
	}
};
Observable.prototype.getPath = function getPath() {
	let tmp = [], result = [], l1 = 0, l2 = 0, pointer = this;
	while (pointer.ownKey !== null) {
		tmp[l1++] = pointer.ownKey;
		pointer = pointer.parent;
	}
	while (l1--) result[l2++] = tmp[l1];
	return result;
};
Observable.prototype.getListeners = function getListeners() {
	let pointer = this;
	while (pointer) {
		if (pointer.callbacks) return pointer.callbacks;
		else pointer = pointer.parent;
	}
	return [];
};
Observable.prototype.revoke = function revoke() {
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
Observable.prototype.proxiedSet = function proxiedSet(target, key, value) {
	let oldValue = target[key];

	if (isObservable(value)) {
		target[key] = new Observable({
			target: value, ownKey: key, parent: this
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

	//	publish changes
	let listeners = this.getListeners();
	if (listeners.length) {
		let path = this.getPath();
		path.push(key);
		callListeners(listeners, typeof oldValue !== 'undefined'
			? [{type: 'update', path: path, value: value, oldValue: oldValue}]
			: [{type: 'insert', path: path, value: value}]
		);
	}
	return true;
};

Object.defineProperty(Observable, 'from', {
	value: function(target) {
		if (isObservable(target) && !('observe' in target) && !('unobserve' in target) && !('revoke' in target)) {
			let observable = new Observable({target: target, ownKey: null, parent: null});
			return observable.proxy;
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
