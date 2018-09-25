const
	sysObsKey = Symbol('system-observer-key'),
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
	callListeners = function(listeners, changes) {
		let l = listeners.length;
		while (l--) {
			try {
				listeners[l](changes);
			} catch (e) {
				console.error('failed to deliver changes to listener' + listeners[l], e);
			}
		}
	},
	INSERT = 'insert',
	UPDATE = 'update',
	DELETE = 'delete',
	REVERSE = 'reverse',
	SHUFFLE = 'shuffle';

class ObservableArray extends Array {
	constructor(origin, observed) {
		super(origin.length);
		let l = origin.length, item;
		this[sysObsKey] = observed;
		while (l--) {
			item = origin[l];
			if (item && typeof item === 'object' && !nonObservables.hasOwnProperty(item.constructor.name)) {
				this[l] = new Observed({target: item, ownKey: l, parent: observed}).proxy;
			} else {
				this[l] = item;
			}
		}
	}

	revoke() {
		this[sysObsKey].revoke();
	}

	observe(callback) {
		let observedRoot = this[sysObsKey],
			callbacks = observedRoot.callbacks;
		if (observedRoot.isRevoked) { throw new TypeError('revoked Observable MAY NOT be observed anymore'); }
		if (typeof callback !== 'function') { throw new Error('observer (callback) parameter MUST be a function'); }

		if (callbacks.indexOf(callback) < 0) {
			callbacks.push(callback);
		} else {
			console.info('observer (callback) may be bound to an observable only once');
		}
	}

	unobserve() {
		let observed = this[sysObsKey],
			callbacks = observed.callbacks,
			l, idx;
		if (observed.isRevoked) { throw new TypeError('revoked Observable MAY NOT be unobserved anymore'); }
		l = arguments.length;
		if (l) {
			while (l--) {
				idx = callbacks.indexOf(arguments[l]);
				if (idx >= 0) callbacks.splice(idx, 1);
			}
		} else {
			callbacks.splice(0);
		}
	}
}

class ObservableObject {
	constructor(origin, observed) {
		let keys = Object.getOwnPropertyNames(origin), l = keys.length, key, item;
		this[sysObsKey] = observed;
		while (l--) {
			key = keys[l];
			item = origin[key];
			if (item && typeof item === 'object' && !nonObservables.hasOwnProperty(item.constructor.name)) {
				this[key] = new Observed({target: item, ownKey: key, parent: observed}).proxy;
			} else {
				this[key] = item;
			}
		}
	}

	revoke() {
		this[sysObsKey].revoke();
	}

	observe(callback) {
		let observedRoot = this[sysObsKey],
			callbacks = observedRoot.callbacks;
		if (observedRoot.isRevoked) { throw new TypeError('revoked Observable MAY NOT be observed anymore'); }
		if (typeof callback !== 'function') { throw new Error('observer (callback) parameter MUST be a function'); }

		if (callbacks.indexOf(callback) < 0) {
			callbacks.push(callback);
		} else {
			console.info('observer (callback) may be bound to an observable only once');
		}
	}

	unobserve() {
		let observed = this[sysObsKey],
			callbacks = observed.callbacks,
			l, idx;
		if (observed.isRevoked) { throw new TypeError('revoked Observable MAY NOT be unobserved anymore'); }
		l = arguments.length;
		if (l) {
			while (l--) {
				idx = callbacks.indexOf(arguments[l]);
				if (idx >= 0) callbacks.splice(idx, 1);
			}
		} else {
			callbacks.splice(0);
		}
	}
}

class Observed {
	constructor(properties) {
		if (properties.parent === null) {
			this.isRevoked = false;
			this.callbacks = [];
		}
		this.parent = properties.parent;
		this.ownKey = properties.ownKey;

		let target = properties.target, clone, op = Observed.prototype;
		if (Array.isArray(target)) {
			clone = new ObservableArray(target, this);
			this.revokable = Proxy.revocable(clone, {
				deleteProperty: op.proxiedDelete.bind(this),
				set: op.proxiedSet.bind(this),
				get: op.proxiedArrayGet.bind(this)
			});
		} else {
			clone = new ObservableObject(target, this);
			this.revokable = Proxy.revocable(clone, {
				deleteProperty: op.proxiedDelete.bind(this),
				set: op.proxiedSet.bind(this)
			});
		}

		this.proxy = this.revokable.proxy;
		this.target = clone;
	}

	revoke() {
		let target = this.target, keys = Object.keys(target), l = keys.length, key, item;

		//	revoke native proxy
		this.revokable.revoke();

		//	roll back observed graph to unobserved one
		while (l--) {
			key = keys[l];
			item = target[key];
			if (item && typeof item === 'object') {
				let tmpObserved = item[sysObsKey];
				if (tmpObserved) {
					target[key] = tmpObserved.revoke();
				}
			}
		}

		//	return an unobserved graph (effectively this is an opposite of an Observed constructor logic)
		return target;
	}

	getPath() {
		let tmpKey, tmp = [], result, l1 = 0, l2 = 0, pointer = this;
		while ((tmpKey = pointer.ownKey) !== null) {
			tmp[l1++] = tmpKey;
			pointer = pointer.parent;
		}
		result = new Array(l1);
		while (l1--) result[l2++] = tmp[l1];
		return result;
	}

	getListeners() {
		let pointer = this;
		while (pointer.parent) pointer = pointer.parent;
		return pointer.callbacks;
	}

	proxiedSet(target, key, value) {
		let oldValue = target[key], listeners, path, changes;

		if (value && typeof value === 'object' && !nonObservables.hasOwnProperty(value.constructor.name)) {
			target[key] = new Observed({target: value, ownKey: key, parent: this}).proxy;
		} else {
			target[key] = value;
		}

		if (oldValue && typeof oldValue === 'object') {
			let tmpObserved = oldValue[sysObsKey];
			if (tmpObserved) {
				oldValue = tmpObserved.revoke();
			}
		}

		//	publish changes
		listeners = this.getListeners();
		if (listeners.length) {
			path = this.getPath();
			path.push(key);
			changes = typeof oldValue === 'undefined'
				? [{type: INSERT, path: path, value: value}]
				: [{type: UPDATE, path: path, value: value, oldValue: oldValue}];
			callListeners(listeners, changes);
		}
		return true;
	}

	proxiedDelete(target, key) {
		let oldValue = target[key], listeners, path, changes;

		if (delete target[key]) {
			if (oldValue && typeof oldValue === 'object') {
				let tmpObserved = oldValue[sysObsKey];
				if (tmpObserved) {
					oldValue = tmpObserved.revoke();
				}
			}

			//	publish changes
			listeners = this.getListeners();
			if (listeners.length) {
				path = this.getPath();
				path.push(key);
				changes = [{type: DELETE, path: path, oldValue: oldValue}];
				callListeners(listeners, changes);
			}
			return true;
		} else {
			return false;
		}
	}

	proxiedArrayGet(target, key) {
		const proxiedArrayMethods = {
			pop: function proxiedPop(target, observed) {
				let poppedIndex, popResult;
				poppedIndex = target.length - 1;
				popResult = target.pop();
				if (popResult && typeof popResult === 'object') {
					let tmpObserved = popResult[sysObsKey];
					if (tmpObserved) {
						popResult = tmpObserved.revoke();
					}
				}

				//	publish changes
				let listeners = observed.getListeners();
				if (listeners.length) {
					let path = observed.getPath();
					path.push(poppedIndex);
					callListeners(listeners, [{type: DELETE, path: path, oldValue: popResult}]);
				}
				return popResult;
			},
			push: function proxiedPush(target, observed) {
				let i, l = arguments.length - 2, item, pushContent = new Array(l), pushResult, changes,
					initialLength, basePath, listeners = observed.getListeners();
				initialLength = target.length;

				if (listeners.length) {
					basePath = observed.getPath();
				}
				for (i = 0; i < l; i++) {
					item = arguments[i + 2];
					if (item && typeof item === 'object' && !nonObservables.hasOwnProperty(item.constructor.name)) {
						item = new Observed({target: item, ownKey: initialLength + i, parent: observed}).proxy;
					}
					pushContent[i] = item;
				}
				pushResult = Reflect.apply(target.push, target, pushContent);

				//	publish changes
				if (listeners.length) {
					changes = [];
					for (i = initialLength, l = target.length; i < l; i++) {
						let path = basePath.slice(0);
						path.push(i);
						changes[i - initialLength] = {type: INSERT, path: path, value: target[i]};
					}
					callListeners(listeners, changes);
				}
				return pushResult;
			},
			shift: function proxiedShift(target, observed) {
				let shiftResult, i, l, item, listeners, path, changes;

				shiftResult = target.shift();
				if (shiftResult && typeof shiftResult === 'object') {
					let tmpObserved = shiftResult[sysObsKey];
					if (tmpObserved) {
						shiftResult = tmpObserved.revoke();
					}
				}

				//	update indices of the remaining items
				for (i = 0, l = target.length; i < l; i++) {
					item = target[i];
					if (item && typeof item === 'object') {
						let tmpObserved = item[sysObsKey];
						if (tmpObserved) {
							tmpObserved.ownKey = i;
						}
					}
				}

				//	publish changes
				listeners = observed.getListeners();
				if (listeners.length) {
					path = observed.getPath();
					path.push(0);
					changes = [{type: DELETE, path: path, oldValue: shiftResult}];
					callListeners(listeners, changes);
				}
				return shiftResult;
			},
			unshift: function proxiedUnshift(target, observed) {
				let listeners = observed.getListeners(), unshiftContent, unshiftResult, changes;
				unshiftContent = Array.from(arguments);
				unshiftContent.splice(0, 2);
				unshiftContent.forEach((item, index) => {
					if (item && typeof item === 'object' && !nonObservables.hasOwnProperty(item.constructor.name)) {
						unshiftContent[index] = new Observed({target: item, ownKey: index, parent: observed}).proxy;
					}
				});
				unshiftResult = Reflect.apply(target.unshift, target, unshiftContent);
				for (let i = 0, l = target.length, item; i < l; i++) {
					item = target[i];
					if (item && typeof item === 'object') {
						let tmpObserved = item[sysObsKey];
						if (tmpObserved) {
							tmpObserved.ownKey = i;
						}
					}
				}

				//	publish changes
				if (listeners.length) {
					let basePath = observed.getPath(), l = unshiftContent.length, path;
					changes = new Array(l);
					for (let i = 0; i < l; i++) {
						path = basePath.slice(0);
						path.push(i);
						changes[i] = {type: INSERT, path: path, value: target[i]};
					}
					callListeners(listeners, changes);
				}
				return unshiftResult;
			},
			reverse: function proxiedReverse(target, observed) {
				let i, l, item, listeners, changes;
				target.reverse();
				for (i = 0, l = target.length; i < l; i++) {
					item = target[i];
					if (item && typeof item === 'object') {
						let tmpObserved = item[sysObsKey];
						if (tmpObserved) {
							tmpObserved.ownKey = i;
						}
					}
				}

				//	publish changes
				listeners = observed.getListeners();
				if (listeners.length) {
					changes = [{type: REVERSE, path: observed.getPath()}];
					callListeners(listeners, changes);
				}
				return observed.proxy;
			},
			sort: function proxiedSort(target, observed, comparator) {
				let i, l, item, listeners, changes;
				target.sort(comparator);
				for (i = 0, l = target.length; i < l; i++) {
					item = target[i];
					if (item && typeof item === 'object') {
						let tmpObserved = item[sysObsKey];
						if (tmpObserved) {
							tmpObserved.ownKey = i;
						}
					}
				}

				//	publish changes
				listeners = observed.getListeners();
				if (listeners.length) {
					changes = [{type: SHUFFLE, path: observed.getPath()}];
					callListeners(listeners, changes);
				}
				return observed.proxy;
			},
			fill: function proxiedFill(target, observed) {
				let listeners = observed.getListeners(), normArgs, argLen,
					start, end, changes = [], prev, tarLen = target.length, basePath, path;
				normArgs = Array.from(arguments);
				normArgs.splice(0, 2);
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
					if (item && typeof item === 'object' && !nonObservables.hasOwnProperty(item.constructor.name)) {
						target[i] = new Observed({target: item, ownKey: i, parent: observed}).proxy;
					}
					if (prev.hasOwnProperty(i)) {
						tmpTarget = prev[i];
						if (tmpTarget && typeof tmpTarget === 'object') {
							let tmpObserved = tmpTarget[sysObsKey];
							if (tmpObserved) {
								tmpTarget = tmpObserved.revoke();
							}
						}

						path = basePath.slice(0);
						path.push(i);
						changes.push({type: UPDATE, path: path, value: target[i], oldValue: tmpTarget});
					} else {
						path = basePath.slice(0);
						path.push(i);
						changes.push({type: INSERT, path: path, value: target[i]});
					}
				}

				//	publish changes
				if (listeners.length) {
					callListeners(listeners, changes);
				}
				return observed.proxy;
			},
			splice: function proxiedSplice(target, observed) {
				let listeners = observed.getListeners(),
					spliceContent, spliceResult, changes = [], tmpObserved,
					startIndex, removed, inserted, splLen, tarLen = target.length;

				spliceContent = Array.from(arguments);
				spliceContent.splice(0, 2);
				splLen = spliceContent.length;

				//	observify the newcomers
				for (let i = 2, item; i < splLen; i++) {
					item = spliceContent[i];
					if (item && typeof item === 'object' && !nonObservables.hasOwnProperty(item.constructor.name)) {
						spliceContent[i] = new Observed({target: item, ownKey: i, parent: observed}).proxy;
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
						tmpObserved = item[sysObsKey];
						if (tmpObserved) {
							tmpObserved.ownKey = i;
						}
					}
				}

				//	revoke removed Observed
				let i, l, item;
				for (i = 0, l = spliceResult.length; i < l; i++) {
					item = spliceResult[i];
					if (item && typeof item === 'object') {
						tmpObserved = item[sysObsKey];
						if (tmpObserved) {
							spliceResult[i] = tmpObserved.revoke();
						}
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
								type: UPDATE,
								path: path,
								value: target[startIndex + index],
								oldValue: spliceResult[index]
							});
						} else {
							changes.push({type: DELETE, path: path, oldValue: spliceResult[index]});
						}
					}
					for (; index < inserted; index++) {
						path = basePath.slice(0);
						path.push(startIndex + index);
						changes.push({type: INSERT, path: path, value: target[startIndex + index]});
					}
					callListeners(listeners, changes);
				}
				return spliceResult;
			}
		};
		if (proxiedArrayMethods.hasOwnProperty(key)) {
			return proxiedArrayMethods[key].bind(undefined, target, this);
		} else {
			return target[key];
		}
	}
}

class Observable {
	static from(target) {
		if (target && typeof target === 'object' && !nonObservables.hasOwnProperty(target.constructor.name) && !('observe' in target) && !('unobserve' in target) && !('revoke' in target)) {
			let observed = new Observed({target: target, ownKey: null, parent: null});
			return observed.proxy;
		} else {
			if (!target || typeof target !== 'object') {
				throw new Error('observable MAY ONLY be created from non-null object only');
			} else if ('observe' in target || 'unobserve' in target || 'revoke' in target) {
				throw new Error('target object MUST NOT have nor own neither inherited properties from the following list: "observe", "unobserve", "revoke"');
			} else if (nonObservables.hasOwnProperty(target.constructor.name)) {
				throw new Error(target + ' found to be one of non-observable object types: ' + nonObservables);
			}
		}
	}
}

Object.freeze(Observable);