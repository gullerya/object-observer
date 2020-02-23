const
	INSERT = 'insert',
	UPDATE = 'update',
	DELETE = 'delete',
	REVERSE = 'reverse',
	SHUFFLE = 'shuffle',
	sysObsKey = Symbol('system-observer-key'),
	validOptionsKeys = ['path', 'pathsFrom'],
	processObserveOptions = function (options) {
		const result = {};
		if (options.path && typeof options.path !== 'string') {
			console.error('"path" option, if/when provided, MUST be a non-empty string');
		} else {
			result.path = options.path;
		}
		if (options.pathsFrom) {
			if (options.path) {
				console.error('"pathsFrom" option MAY NOT be specified together with "path" option');
			} else if (typeof options.pathsFrom !== 'string') {
				console.error('"pathsFrom" option, if/when provided, MUST be a non-empty string');
			} else {
				result.pathsFrom = options.pathsFrom;
			}
		}
		const invalidOptions = Object.keys(options).filter(option => validOptionsKeys.indexOf(option) < 0);
		if (invalidOptions.length) {
			console.error(`'${invalidOptions.join(', ')}' is/are not a valid option/s`);
		}
		return result;
	},
	unobserve = function () {
		const
			systemObserver = this[sysObsKey],
			observers = systemObserver.observers;
		if (observers.size) {
			let l = arguments.length;
			if (l) {
				while (l) {
					observers.delete(arguments[--l]);
				}
			} else {
				observers.clear();
			}
		}
	},
	rootObsDefs = {
		revoke: {
			value: function () {
				this[sysObsKey].revoke();
			}
		},
		observe: {
			value: function (observer, options) {
				if (typeof observer !== 'function') {
					throw new Error('observer parameter MUST be a function');
				}

				const
					systemObserver = this[sysObsKey],
					observers = systemObserver.observers;
				if (!observers.has(observer)) {
					let opts;
					if (options) {
						opts = processObserveOptions(options);
					} else {
						opts = {};
					}
					observers.set(observer, opts);
				} else {
					console.info('observer may be bound to an observable only once');
				}
			}
		},
		unobserve: {
			value: unobserve
		}
	},
	innerObsDefs = {
		observe: {
			value: function (observer, options) {
				if (typeof observer !== 'function') {
					throw new Error('observer parameter MUST be a function');
				}

				const
					systemObserver = this[sysObsKey],
					observers = systemObserver.observers;
				if (!observers.has(observer)) {
					let opts;
					if (options) {
						opts = processObserveOptions(options);
					} else {
						opts = {};
					}
					observers.set(observer, opts);
				} else {
					console.info('observer may be bound to an observable only once');
				}
			}
		},
		unobserve: {
			value: unobserve
		}
	},
	prepareArray = function (source, observer) {
		let l = source.length, item;
		const target = new Array(l);
		Object.defineProperty(target, sysObsKey, { value: observer });
		while (l) {
			l--;
			item = source[l];
			if (!item || typeof item !== 'object') {
				target[l] = item;
			} else {
				target[l] = getObservedOf(item, l, observer);
			}
		}
		return target;
	},
	prepareObject = function (source, observer) {
		const
			keys = Object.keys(source),
			target = {};
		Object.defineProperty(target, sysObsKey, { value: observer });
		let l = keys.length, key, item;
		while (l) {
			l--;
			key = keys[l];
			item = source[key];
			if (!item || typeof item !== 'object') {
				target[key] = item;
			} else {
				target[key] = getObservedOf(item, key, observer);
			}
		}
		return target;
	},
	callObservers = function (observers, changes) {
		let target, options, relevantChanges, oPath, oPaths;
		for (target of observers.keys()) {
			try {
				options = observers.get(target);
				relevantChanges = changes;

				if (options.path) {
					oPath = options.path;
					relevantChanges = changes.filter(change => change.path.join('.') === oPath);
				} else if (options.pathsFrom) {
					oPaths = options.pathsFrom;
					relevantChanges = changes.filter(change => change.path.join('.').startsWith(oPaths));
				}
				if (relevantChanges.length) {
					target(relevantChanges);
				}
			} catch (e) {
				console.error(`failed to deliver changes to listener ${target}`, e);
			}
		}
	},
	getAncestorInfo = function (self) {
		const tmp = [];
		let l1 = 0, l2 = 0;
		while (self.parent) {
			tmp[l1++] = self.ownKey;
			self = self.parent;
		}
		const result = new Array(l1);
		while (l1) result[l2++] = tmp[--l1];
		return { observers: self.observers, path: result };
	},
	getObservedOf = function (item, key, parent) {
		if (!item || typeof item !== 'object') {
			return item;
		} else if (Array.isArray(item)) {
			return new ArrayObserver({ target: item, ownKey: key, parent: parent }).proxy;
		} else if (!(item instanceof Date || item instanceof Blob || item instanceof Error)) {
			return new ObjectObserver({ target: item, ownKey: key, parent: parent }).proxy;
		} else {
			return item;
		}
	};

class ObserverBase {
	constructor(properties, cloningFunction) {
		const
			source = properties.target,
			targetClone = cloningFunction(source, this);
		if (properties.parent === null) {
			this.isRevoked = false;
			Object.defineProperty(this, 'observers', { value: new Map() });
			Object.defineProperties(targetClone, rootObsDefs);
		} else {
			this.parent = properties.parent;
			this.ownKey = properties.ownKey;
			Object.defineProperties(targetClone, innerObsDefs);
		}
		this.revokable = Proxy.revocable(targetClone, this);
		this.proxy = this.revokable.proxy;
		this.target = targetClone;
	}

	set(target, key, value) {
		let oldValue = target[key], changes;

		if (value === oldValue) {
			return true;
		}

		const newValue = getObservedOf(value, key, this);
		target[key] = newValue;

		if (oldValue && typeof oldValue === 'object') {
			const tmpObserved = oldValue[sysObsKey];
			if (tmpObserved) {
				oldValue = tmpObserved.revoke();
			}
		}

		//	publish changes
		const ad = getAncestorInfo(this);
		if (ad.observers.size) {
			ad.path.push(key);
			changes = typeof oldValue === 'undefined'
				? [{ type: INSERT, path: ad.path, value: newValue, object: this.proxy }]
				: [{ type: UPDATE, path: ad.path, value: newValue, oldValue: oldValue, object: this.proxy }];
			callObservers(ad.observers, changes);
		}
		return true;
	}

	deleteProperty(target, key) {
		let oldValue = target[key], changes;

		delete target[key];

		if (oldValue && typeof oldValue === 'object') {
			const tmpObserved = oldValue[sysObsKey];
			if (tmpObserved) {
				oldValue = tmpObserved.revoke();
			}
		}

		//	publish changes
		const ad = getAncestorInfo(this);
		if (ad.observers.size) {
			ad.path.push(key);
			changes = [{ type: DELETE, path: ad.path, oldValue: oldValue, object: this.proxy }];
			callObservers(ad.observers, changes);
		}

		return true;
	}
}

class ArrayObserver extends ObserverBase {
	constructor(properties) {
		super(properties, prepareArray);
	}

	//	returns an unobserved graph (effectively this is an opposite of an ArrayObserver constructor logic)
	revoke() {
		//	revoke native proxy
		this.revokable.revoke();

		//	roll back observed array to an unobserved one
		const target = this.target;
		let l = target.length, item, tmpObserved;
		while (l) {
			l--;
			item = target[l];
			if (item && typeof item === 'object') {
				tmpObserved = item[sysObsKey];
				if (tmpObserved) {
					target[l] = tmpObserved.revoke();
				}
			}
		}
		return target;
	}

	get(target, key) {
		const proxiedArrayMethods = {
			pop: function proxiedPop(target, observed) {
				const poppedIndex = target.length - 1;
				let popResult = target.pop();
				if (popResult && typeof popResult === 'object') {
					const tmpObserved = popResult[sysObsKey];
					if (tmpObserved) {
						popResult = tmpObserved.revoke();
					}
				}

				//	publish changes
				const ad = getAncestorInfo(observed);
				if (ad.observers.size) {
					ad.path.push(poppedIndex);
					callObservers(ad.observers, [{
						type: DELETE,
						path: ad.path,
						oldValue: popResult,
						object: observed.proxy
					}]);
				}
				return popResult;
			},
			push: function proxiedPush(target, observed) {
				let i, l = arguments.length - 2, item, changes, path;
				const
					pushContent = new Array(l),
					initialLength = target.length;

				for (i = 0; i < l; i++) {
					item = arguments[i + 2];
					pushContent[i] = getObservedOf(item, initialLength + i, observed);
				}
				const pushResult = Reflect.apply(target.push, target, pushContent);

				//	publish changes
				const ad = getAncestorInfo(observed);
				if (ad.observers.size) {
					changes = [];
					for (i = initialLength, l = target.length; i < l; i++) {
						path = ad.path.slice(0);
						path.push(i);
						changes[i - initialLength] = {
							type: INSERT,
							path: path,
							value: target[i],
							object: observed.proxy
						};
					}
					callObservers(ad.observers, changes);
				}
				return pushResult;
			},
			shift: function proxiedShift(target, observed) {
				let shiftResult, i, l, item, changes, tmpObserved;

				shiftResult = target.shift();
				if (shiftResult && typeof shiftResult === 'object') {
					tmpObserved = shiftResult[sysObsKey];
					if (tmpObserved) {
						shiftResult = tmpObserved.revoke();
					}
				}

				//	update indices of the remaining items
				for (i = 0, l = target.length; i < l; i++) {
					item = target[i];
					if (item && typeof item === 'object') {
						tmpObserved = item[sysObsKey];
						if (tmpObserved) {
							tmpObserved.ownKey = i;
						}
					}
				}

				//	publish changes
				const ad = getAncestorInfo(observed);
				if (ad.observers.size) {
					ad.path.push(0);
					changes = [{ type: DELETE, path: ad.path, oldValue: shiftResult, object: observed.proxy }];
					callObservers(ad.observers, changes);
				}
				return shiftResult;
			},
			unshift: function proxiedUnshift(target, observed) {
				const unshiftContent = Array.from(arguments);
				let changes;
				unshiftContent.splice(0, 2);
				unshiftContent.forEach((item, index) => {
					unshiftContent[index] = getObservedOf(item, index, observed);
				});
				const unshiftResult = Reflect.apply(target.unshift, target, unshiftContent);
				for (let i = 0, l = target.length, item; i < l; i++) {
					item = target[i];
					if (item && typeof item === 'object') {
						const tmpObserved = item[sysObsKey];
						if (tmpObserved) {
							tmpObserved.ownKey = i;
						}
					}
				}

				//	publish changes
				const ad = getAncestorInfo(observed);
				if (ad.observers.size) {
					const l = unshiftContent.length;
					let path;
					changes = new Array(l);
					for (let i = 0; i < l; i++) {
						path = ad.path.slice(0);
						path.push(i);
						changes[i] = { type: INSERT, path: path, value: target[i], object: observed.proxy };
					}
					callObservers(ad.observers, changes);
				}
				return unshiftResult;
			},
			reverse: function proxiedReverse(target, observed) {
				let i, l, item, changes;
				target.reverse();
				for (i = 0, l = target.length; i < l; i++) {
					item = target[i];
					if (item && typeof item === 'object') {
						const tmpObserved = item[sysObsKey];
						if (tmpObserved) {
							tmpObserved.ownKey = i;
						}
					}
				}

				//	publish changes
				const ad = getAncestorInfo(observed);
				if (ad.observers.size) {
					changes = [{ type: REVERSE, path: ad.path, object: observed.proxy }];
					callObservers(ad.observers, changes);
				}
				return observed.proxy;
			},
			sort: function proxiedSort(target, observed, comparator) {
				let i, l, item, changes;
				target.sort(comparator);
				for (i = 0, l = target.length; i < l; i++) {
					item = target[i];
					if (item && typeof item === 'object') {
						const tmpObserved = item[sysObsKey];
						if (tmpObserved) {
							tmpObserved.ownKey = i;
						}
					}
				}

				//	publish changes
				const ad = getAncestorInfo(observed);
				if (ad.observers.size) {
					changes = [{ type: SHUFFLE, path: ad.path, object: observed.proxy }];
					callObservers(ad.observers, changes);
				}
				return observed.proxy;
			},
			fill: function proxiedFill(target, observed) {
				const
					ad = getAncestorInfo(observed),
					changes = [],
					tarLen = target.length,
					normArgs = Array.from(arguments);
				normArgs.splice(0, 2);
				const
					argLen = normArgs.length,
					start = argLen < 2 ? 0 : (normArgs[1] < 0 ? tarLen + normArgs[1] : normArgs[1]),
					end = argLen < 3 ? tarLen : (normArgs[2] < 0 ? tarLen + normArgs[2] : normArgs[2]),
					prev = target.slice(0);
				Reflect.apply(target.fill, target, normArgs);

				let tmpObserved, path;
				for (let i = start, item, tmpTarget; i < end; i++) {
					item = target[i];
					target[i] = getObservedOf(item, i, observed);
					if (prev.hasOwnProperty(i)) {
						tmpTarget = prev[i];
						if (tmpTarget && typeof tmpTarget === 'object') {
							tmpObserved = tmpTarget[sysObsKey];
							if (tmpObserved) {
								tmpTarget = tmpObserved.revoke();
							}
						}

						path = ad.path.slice(0);
						path.push(i);
						changes.push({
							type: UPDATE,
							path: path,
							value: target[i],
							oldValue: tmpTarget,
							object: observed.proxy
						});
					} else {
						path = ad.path.slice(0);
						path.push(i);
						changes.push({ type: INSERT, path: path, value: target[i], object: observed.proxy });
					}
				}

				//	publish changes
				if (ad.observers.size) {
					callObservers(ad.observers, changes);
				}
				return observed.proxy;
			},
			splice: function proxiedSplice(target, observed) {
				const
					ad = getAncestorInfo(observed),
					changes = [],
					spliceContent = Array.from(arguments),
					tarLen = target.length;

				spliceContent.splice(0, 2);
				const splLen = spliceContent.length;

				//	observify the newcomers
				for (let i = 2, item; i < splLen; i++) {
					item = spliceContent[i];
					spliceContent[i] = getObservedOf(item, i, observed);
				}

				//	calculate pointers
				const
					startIndex = splLen === 0 ? 0 : (spliceContent[0] < 0 ? tarLen + spliceContent[0] : spliceContent[0]),
					removed = splLen < 2 ? tarLen - startIndex : spliceContent[1],
					inserted = Math.max(splLen - 2, 0),
					spliceResult = Reflect.apply(target.splice, target, spliceContent),
					newTarLen = target.length;

				//	reindex the paths
				let tmpObserved;
				for (let i = 0, item; i < newTarLen; i++) {
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
				if (ad.observers.size) {
					let index, path;
					for (index = 0; index < removed; index++) {
						path = ad.path.slice(0);
						path.push(startIndex + index);
						if (index < inserted) {
							changes.push({
								type: UPDATE,
								path: path,
								value: target[startIndex + index],
								oldValue: spliceResult[index],
								object: observed.proxy
							});
						} else {
							changes.push({
								type: DELETE,
								path: path,
								oldValue: spliceResult[index],
								object: observed.proxy
							});
						}
					}
					for (; index < inserted; index++) {
						path = ad.path.slice(0);
						path.push(startIndex + index);
						changes.push({
							type: INSERT,
							path: path,
							value: target[startIndex + index],
							object: observed.proxy
						});
					}
					callObservers(ad.observers, changes);
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

class ObjectObserver extends ObserverBase {
	constructor(properties) {
		super(properties, prepareObject);
	}

	//	returns an unobserved graph (effectively this is an opposite of an ObjectObserver constructor logic)
	revoke() {
		//	revoke native proxy
		this.revokable.revoke();

		//	roll back observed graph to an unobserved one
		const
			target = this.target,
			keys = Object.keys(target);
		let l = keys.length, key, item, tmpObserved;
		while (l) {
			key = keys[--l];
			item = target[key];
			if (item && typeof item === 'object') {
				tmpObserved = item[sysObsKey];
				if (tmpObserved) {
					target[key] = tmpObserved.revoke();
				}
			}
		}
		return target;
	}
}

class Observable {
	constructor() {
		throw new Error('Observable MAY NOT be created via constructor, see "Observable.from" API');
	}

	static from(target) {
		if (!target || typeof target !== 'object') {
			throw new Error('observable MAY ONLY be created from a non-null object');
		} else if (target[sysObsKey]) {
			return target;
		} else if (Array.isArray(target)) {
			return new ArrayObserver({ target: target, ownKey: null, parent: null }).proxy;
		} else if (target instanceof Date || target instanceof Blob || target instanceof Error) {
			throw new Error(`${target} found to be one of non-observable types`);
		} else {
			return new ObjectObserver({ target: target, ownKey: null, parent: null }).proxy;
		}
	}

	static isObservable(input) {
		return !!(input && input[sysObsKey]);
	}
}

Object.freeze(Observable);

export { Observable };