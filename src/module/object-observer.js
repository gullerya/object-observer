const proxiesToObserved = new Map(),
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

class ObservableArray extends Array {
	constructor(origin, observed) {
		super(origin.length);
		let l = origin.length, item;
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
		proxiesToObserved.get(this).revoke();
	}

	observe(callback) {
		proxiesToObserved.get(this).observe(callback);
	}

	unobserve() {
		let observed = proxiesToObserved.get(this);
		observed.unobserve.apply(observed, arguments);
	}
}

class ObservableObject {
	constructor(origin, observed) {
		let keys = Object.getOwnPropertyNames(origin), l = keys.length, key, item;
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
		proxiesToObserved.get(this).revoke();
	}

	observe(callback) {
		proxiesToObserved.get(this).observe(callback);
	}

	unobserve() {
		let observed = proxiesToObserved.get(this);
		observed.unobserve.apply(observed, arguments);
	}
}

class Observed {
	constructor(properties) {
		this.parent = properties.parent;
		this.ownKey = properties.ownKey;

		let target = properties.target, clone;
		if (Array.isArray(target)) {
			clone = new ObservableArray(target, this);
			this.revokable = Proxy.revocable(clone, {
				deleteProperty: this.proxiedDelete.bind(this),
				set: this.proxiedSet.bind(this),
				get: this.proxiedArrayGet.bind(this)
			});
		} else {
			clone = new ObservableObject(target, this);
			this.revokable = Proxy.revocable(clone, {
				deleteProperty: this.proxiedDelete.bind(this),
				set: this.proxiedSet.bind(this)
			});
		}

		if (this.parent === null) {
			this.isRevoked = false;
			this.callbacks = [];
		}

		this.proxy = this.revokable.proxy;
		this.target = clone;

		proxiesToObserved.set(this.proxy, this);
	}

	revoke() {
		let target = this.target, keys = Object.keys(target), l = keys.length, key, item, tmpObserved;

		//	revoke native proxy
		this.revokable.revoke();

		//	roll back observed graph to unobserved one
		while (l--) {
			key = keys[l];
			item = target[key];
			if (item && typeof item === 'object') {
				tmpObserved = proxiesToObserved.get(item);
				if (tmpObserved) {
					target[key] = tmpObserved.revoke();
				}
			}
		}

		//	clean revoked Observed from the maps
		proxiesToObserved.delete(this.proxy);

		//	return an unobserved graph (effectively this is an opposite of an Observed constructor logic)
		return target;
	}

	observe(callback) {
		if (this.isRevoked) { throw new TypeError('revoked Observable MAY NOT be observed anymore'); }
		if (typeof callback !== 'function') { throw new Error('observer (callback) parameter MUST be a function'); }

		if (this.callbacks.indexOf(callback) < 0) {
			this.callbacks.push(callback);
		} else {
			console.info('observer (callback) may be bound to an observable only once');
		}
	}

	unobserve() {
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
	}

	getPath() {
		let tmp = [], result = [], l1 = 0, l2 = 0, pointer = this;
		while (pointer.ownKey !== null) {
			tmp[l1++] = pointer.ownKey;
			pointer = pointer.parent;
		}
		while (l1--) result[l2++] = tmp[l1];
		return result;
	}

	getListeners() {
		let pointer = this;
		while (pointer.parent) pointer = pointer.parent;
		return pointer.callbacks;
	}

	static callListeners(listeners, changes) {
		let l = listeners.length;
		while (l--) {
			try {
				listeners[l](changes);
			} catch (e) {
				console.error(e);
			}
		}
	}

	proxiedDelete(target, key) {
		let oldValue = target[key];

		if (delete target[key]) {
			if (oldValue && typeof oldValue === 'object') {
				let tmpObserved = proxiesToObserved.get(oldValue);
				if (tmpObserved) {
					tmpObserved.revoke();
					oldValue = tmpObserved.target;
				}
			}

			//	publish changes
			let listeners = this.getListeners();
			if (listeners.length) {
				let path = this.getPath();
				path.push(key);
				Observed.callListeners(listeners, [{type: 'delete', path: path, oldValue: oldValue}]);
			}
			return true;
		} else {
			return false;
		}
	}

	proxiedSet(target, key, value) {
		let oldValue = target[key];

		if (value && typeof value === 'object' && !nonObservables.hasOwnProperty(value.constructor.name)) {
			target[key] = new Observed({target: value, ownKey: key, parent: this}).proxy;
		} else {
			target[key] = value;
		}

		if (oldValue && typeof oldValue === 'object') {
			let tmpObserved = proxiesToObserved.get(oldValue);
			if (tmpObserved) {
				tmpObserved.revoke();
				oldValue = tmpObserved.target;
			}
		}

		//	publish changes
		let listeners = this.getListeners();
		if (listeners.length) {
			let path = this.getPath();
			path.push(key);
			Observed.callListeners(listeners, typeof oldValue !== 'undefined'
				? [{type: 'update', path: path, value: value, oldValue: oldValue}]
				: [{type: 'insert', path: path, value: value}]
			);
		}
		return true;
	}

	proxiedArrayGet(target, key) {
		const proxiedArrayMethods = {
			pop: function proxiedPop(target, observed) {
				let poppedIndex, popResult, tmpObserved;
				poppedIndex = target.length - 1;
				popResult = target.pop();
				if (popResult && typeof popResult === 'object') {
					tmpObserved = proxiesToObserved.get(popResult);
					if (tmpObserved) {
						tmpObserved.revoke();
						popResult = tmpObserved.target;
					}
				}

				//	publish changes
				let listeners = observed.getListeners();
				if (listeners.length) {
					let path = observed.getPath();
					path.push(poppedIndex);
					Observed.callListeners(listeners, [{type: 'delete', path: path, oldValue: popResult}]);
				}
				return popResult;
			},
			push: function proxiedPush(target, observed) {
				let l = arguments.length - 2, pushContent = new Array(l), pushResult, changes = [],
					initialLength, basePath, listeners = observed.getListeners();
				initialLength = target.length;

				if (listeners.length) {
					basePath = observed.getPath();
				}
				for (let i = 0, item; i < l; i++) {
					item = arguments[i + 2];
					if (item && typeof item === 'object' && !nonObservables.hasOwnProperty(item.constructor.name)) {
						item = new Observed({target: item, ownKey: initialLength + i, parent: observed}).proxy;
					}
					pushContent[i] = item;
				}
				pushResult = Reflect.apply(target.push, target, pushContent);

				//	publish changes
				if (listeners.length) {
					for (let i = initialLength, l = target.length; i < l; i++) {
						let path = basePath.slice(0);
						path.push(i);
						changes[i - initialLength] = {type: 'insert', path: path, value: target[i]};
					}
					Observed.callListeners(listeners, changes);
				}
				return pushResult;
			},
			shift: function proxiedShift(target, observed) {
				let listeners = observed.getListeners(), shiftResult, tmpObserved;
				shiftResult = target.shift();
				if (shiftResult && typeof shiftResult === 'object') {
					tmpObserved = proxiesToObserved.get(shiftResult);
					if (tmpObserved) {
						tmpObserved.revoke();
						shiftResult = tmpObserved.target;
					}
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
					Observed.callListeners(listeners, [{type: 'delete', path: path, oldValue: shiftResult}]);
				}
				return shiftResult;
			},
			unshift: function proxiedUnshift(target, observed) {
				let listeners = observed.getListeners(), unshiftContent, unshiftResult, changes = [], tmpObserved;
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
					Observed.callListeners(listeners, changes);
				}
				return unshiftResult;
			},
			reverse: function proxiedReverse(target, observed) {
				let listeners = observed.getListeners(), tmpObserved;
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
					Observed.callListeners(listeners, [{type: 'reverse', path: observed.getPath()}]);
				}
				return observed.proxy;
			},
			sort: function proxiedSort(target, observed, comparator) {
				let listeners = observed.getListeners(), tmpObserved;
				target.sort(comparator);
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
					Observed.callListeners(listeners, [{type: 'shuffle', path: observed.getPath()}]);
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
				for (let i = start, item, tmpObserved, tmpTarget; i < end; i++) {
					item = target[i];
					if (item && typeof item === 'object' && !nonObservables.hasOwnProperty(item.constructor.name)) {
						target[i] = new Observed({
							target: item, ownKey: i, parent: observed
						}).proxy;
					}
					if (prev.hasOwnProperty(i)) {
						tmpTarget = prev[i];
						if (tmpTarget && typeof tmpTarget === 'object') {
							tmpObserved = proxiesToObserved.get(tmpTarget);
							if (tmpObserved) {
								tmpObserved.revoke();
								tmpTarget = tmpObserved.target;
							}
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
					Observed.callListeners(listeners, changes);
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
					if (item && typeof item === 'object') {
						tmpObserved = proxiesToObserved.get(item);
						if (tmpObserved) {
							tmpObserved.revoke();
							spliceResult[i] = tmpObserved.target;
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
								type: 'update',
								path: path,
								value: target[startIndex + index],
								oldValue: spliceResult[index]
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
					Observed.callListeners(listeners, changes);
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
			let observable = new Observed({target: target, ownKey: null, parent: null});
			return observable.proxy;
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