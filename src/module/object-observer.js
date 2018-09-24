const targetsToObserved = new WeakMap(),
	proxiesToObserved = new WeakMap(),
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
				poppedIndex, popResult, tmpObserved;
			poppedIndex = target.length - 1;
			popResult = Reflect.apply(target.pop, target, arguments);
			tmpObserved = proxiesToObserved.get(popResult);
			if (tmpObserved) {
				tmpObserved.revoke();
				popResult = tmpObserved.target;
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
					item = new Observed({
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
				shiftResult, tmpObserved;
			shiftResult = Reflect.apply(target.shift, target, arguments);
			tmpObserved = proxiesToObserved.get(shiftResult);
			if (tmpObserved) {
				tmpObserved.revoke();
				shiftResult = tmpObserved.target;
			}

			//	update indices of the remaining items
			for (let i = 0, l = target.length, item, tmpObserved; i < l; i++) {
				item = target[i];
				if (item && typeof item === 'object') {
					tmpObserved = proxiesToObserved.get(item);
					if (tmpObserved) {
						tmpObserved.ownKey = i;
					} else {
						console.error('unexpectedly failed to resolve proxy -> observed');
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
					unshiftContent[index] = new Observed({
						target: item, ownKey: index, parent: observed
					}).proxy;
				}
			});
			unshiftResult = Reflect.apply(target.unshift, target, unshiftContent);
			for (let i = 0, l = target.length, item; i < l; i++) {
				item = target[i];
				if (item && typeof item === 'object') {
					tmpObserved = proxiesToObserved.get(item);
					if (tmpObserved) {
						tmpObserved.ownKey = i;
					} else {
						console.error('failed to resolve proxy -> observed');
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
					tmpObserved = proxiesToObserved.get(item);
					if (tmpObserved) {
						tmpObserved.ownKey = i;
					} else {
						console.error('failed to resolve proxy -> observed');
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
					tmpObserved = proxiesToObserved.get(item);
					if (tmpObserved) {
						tmpObserved.ownKey = i;
					} else {
						console.error('failed to resolve proxy -> observed');
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
			for (let i = start, item, tmpObserved, tmpTarget; i < end; i++) {
				item = target[i];
				if (isObservable(item)) {
					target[i] = new Observed({
						target: item, ownKey: i, parent: observed
					}).proxy;
				}
				if (prev.hasOwnProperty(i)) {
					tmpTarget = prev[i];
					tmpObserved = proxiesToObserved.get(tmpTarget);
					if (tmpObserved) {
						tmpObserved.revoke();
						tmpTarget = tmpObserved.target;
					}

					path = basePath.slice(0);
					path.push(i);
					changes.push({type: 'update', path: path, value: target[i], oldValue: tmpTarget});
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
					spliceContent[i] = new Observed({
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
					tmpObserved = proxiesToObserved.get(item);
					if (tmpObserved) {
						tmpObserved.ownKey = i;
					} else {
						console.error('failed to resolve proxy -> target -> observed');
					}
				}
			}

			//	revoke removed Observed
			for (let i = 0, l = spliceResult.length, item, tmpObserved; i < l; i++) {
				item = spliceResult[i];
				tmpObserved = proxiesToObserved.get(item);
				if (tmpObserved) {
					tmpObserved.revoke();
					spliceResult[i] = tmpObserved.target;
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

const observableOf = Base => class extends Base {
	revoke() {
		proxiesToObserved.get(this).revoke();
	}

	observe(callback) {
		proxiesToObserved.get(this).observe(callback);
	}

	unobserve() {
		let observed = proxiesToObserved.get(this);
		observed.unobserve.apply(observed, arguments);
	}
};

class ObservableArray extends observableOf(Array) {
	constructor(origin, observed) {
		super(origin.length);
		let l = origin.length, item;
		while (l--) {
			item = origin[l];
			if (isObservable(item)) {
				this[l] = new Observed({target: item, ownKey: l, parent: observed}).proxy;
			} else {
				this[l] = item;
			}
		}
	}
}

class ObservableObject extends observableOf(Object) {
	constructor(origin, observed) {
		super();
		let keys = Object.getOwnPropertyNames(origin), l = keys.length, key, item;
		while (l--) {
			key = keys[l];
			item = origin[key];
			if (isObservable(item)) {
				this[key] = new Observed({target: item, ownKey: key, parent: observed}).proxy;
			} else {
				this[key] = origin[key];
			}
		}
	}
}

function Observed(properties) {
	this.parent = properties.parent;
	this.ownKey = properties.ownKey;

	let target = properties.target, clone;
	if (Array.isArray(target)) {
		clone = new ObservableArray(target, this);
		this.revokable = Proxy.revocable(clone, {
			set: this.proxiedSet,
			get: proxiedArrayGet,
			deleteProperty: this.proxiedDelete
		});
	} else {
		clone = new ObservableObject(target, this);
		this.revokable = Proxy.revocable(clone, {
			set: this.proxiedSet,
			deleteProperty: this.proxiedDelete
		});
	}

	if (this.parent === null) {
		this.isRevoked = false;
		this.callbacks = [];
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
	}

	this.target = clone;
	this.proxy = this.revokable.proxy;

	targetsToObserved.set(clone, this);
	proxiesToObserved.set(this.proxy, this);
}

Observed.prototype.revoke = function revoke() {
	let target = this.target,
		keys = Object.keys(target),
		l = keys.length;

	//	revoke native proxy
	this.revokable.revoke();

	//	roll back observed graph to unobserved one
	while (l--) {
		let key = keys[l],
			tmpObserved = proxiesToObserved.get(target[key]);
		if (tmpObserved) {
			target[key] = tmpObserved.revoke();
		}
	}

	//	clean revoked Observed from the maps
	targetsToObserved.delete(target);
	proxiesToObserved.delete(this.proxy);

	//	return an unobserved graph (effectively this is an opposite of an Observed constructor logic)
	return target;
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
Observed.prototype.getListeners = function getListeners() {
	let pointer = this;
	while (pointer) {
		if (pointer.callbacks) return pointer.callbacks;
		else pointer = pointer.parent;
	}
	return [];
};
Observed.prototype.proxiedSet = function proxiedSet(target, key, value) {
	let observed = targetsToObserved.get(target),
		listeners = observed.getListeners(),
		oldValue = target[key];

	if (isObservable(value)) {
		target[key] = new Observed({target: value, ownKey: key, parent: observed}).proxy;
	} else {
		target[key] = value;
	}

	if (oldValue) {
		let tmpObserved = proxiesToObserved.get(oldValue);
		if (tmpObserved) {
			tmpObserved.revoke();
			oldValue = tmpObserved.target;
		}
	}

	//	publish changes
	if (listeners.length) {
		let path = observed.getPath();
		path.push(key);
		observed.callListeners(listeners, typeof oldValue !== 'undefined'
			? [{type: 'update', path: path, value: value, oldValue: oldValue}]
			: [{type: 'insert', path: path, value: value}]
		);
	}
	return true;
};
Observed.prototype.proxiedDelete = function proxiedDelete(target, key) {
	let observed = targetsToObserved.get(target),
		listeners = observed.getListeners(),
		oldValue = target[key];

	if (delete target[key]) {
		if (oldValue) {
			let tmpObserved = proxiesToObserved.get(oldValue);
			if (tmpObserved) {
				tmpObserved.revoke();
				oldValue = tmpObserved.target;
			}
		}

		//	publish changes
		if (listeners.length) {
			let path = observed.getPath();
			path.push(key);
			observed.callListeners(listeners, [{type: 'delete', path: path, oldValue: oldValue}]);
		}
		return true;
	} else {
		return false;
	}
};
Observed.prototype.callListeners = function callListeners(listeners, changes) {
	let l = listeners.length;
	while (l--) {
		try {
			listeners[l](changes);
		} catch (e) {
			console.error(e);
		}
	}
};

class Observable {
	static from(target) {
		if (isObservable(target) && !('observe' in target) && !('unobserve' in target) && !('revoke' in target)) {
			let observable = new Observed({target: target, ownKey: null, parent: null});
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
}

Object.freeze(Observable);

export default Observable;