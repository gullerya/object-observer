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
		const systemObserver = this[sysObsKey];
		const observers = getRootInfo(systemObserver).observers;
		let ol = observers.length;
		if (ol) {
			let al = arguments.length;
			if (al) {
				while (al--) {
					let i = ol;
					while (i--) {
						if (observers[i][0] === arguments[al]) {
							observers.splice(i, 1);
							ol--;
						}
					}
				}
			} else {
				while (ol--) {
					if (observers[ol][1].context === systemObserver) {
						observers.splice(ol, 1);
					}
				}
			}
		}
	},
	rootObsDefs = {
		[sysObsKey]: {
			writable: true
		},
		observe: {
			value: function (observer, options) {
				if (typeof observer !== 'function') {
					throw new Error('observer parameter MUST be a function');
				}

				const
					systemObserver = this[sysObsKey],
					observers = systemObserver.observers;
				if (!observers.some(o => o[0] === observer)) {
					let opts;
					if (options) {
						opts = processObserveOptions(options);
					} else {
						opts = {};
					}
					opts.context = systemObserver;
					observers.push([observer, opts]);
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
		[sysObsKey]: {
			writable: true
		},
		observe: {
			value: function (observer, options) {
				if (typeof observer !== 'function') {
					throw new Error('observer parameter MUST be a function');
				}

				const
					systemObserver = this[sysObsKey],
					ancInfo = getRootInfo(systemObserver),
					basePath = ancInfo.path.join('.'),
					observers = ancInfo.observers;
				if (!observers.some(o => o[0] === observer)) {
					let opts;
					if (options) {
						opts = processObserveOptions(options);
					} else {
						opts = {};
					}
					if (opts.path) {
						opts.path = basePath + '.' + opts.path;
					} else {
						opts.pathsFrom = basePath + '.' + (opts.pathsFrom ? opts.pathsFrom : '');
					}
					opts.context = systemObserver;
					observers.push([observer, opts]);
				} else {
					console.info('observer may be bound to an observable only once');
				}
			}
		},
		unobserve: {
			value: unobserve
		}
	},
	prepareArray = function (source, extDefs, observer) {
		let l = source.length, item;
		const target = Object.defineProperties(new Array(l), extDefs);
		target[sysObsKey] = observer;
		while (l--) {
			item = source[l];
			if (!item || typeof item !== 'object') {
				target[l] = item;
			} else {
				target[l] = getObservedOf(item, l, observer);
			}
		}
		return target;
	},
	prepareObject = function (source, extDefs, observer) {
		const
			keys = Object.keys(source),
			target = Object.defineProperties({}, extDefs);
		target[sysObsKey] = observer;
		let l = keys.length, key, item;
		while (l--) {
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
		let pair, target, options, relevantChanges, oPath, oPaths;
		let i = observers.length;
		while (i--) {
			try {
				pair = observers[i];
				target = pair[0];
				options = pair[1];
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
	getRootInfo = function (self) {
		const tmp = [];
		let l1 = 0, l2 = 0;
		while (self.parent) {
			tmp[l1++] = self.ownKey;
			self = self.parent;
		}
		const result = new Array(l1);
		while (l1--) result[l2++] = tmp[l1];
		return { observers: self.observers, path: result };
	},
	getObservedOf = function (item, key, parent) {
		if (!item || typeof item !== 'object') {
			return item;
		} else if (Array.isArray(item)) {
			return new ArrayObserver({ target: item, ownKey: key, parent: parent }).proxy;
		} else if (item instanceof Date || item instanceof Blob || item instanceof Error) {
			return item;
		} else {
			return new ObjectObserver({ target: item, ownKey: key, parent: parent }).proxy;
		}
	},
	proxiedArrayMethods = {
		pop: function proxiedPop(target, observed) {
			const poppedIndex = target.length - 1;
			let popResult = target.pop();
			if (popResult && typeof popResult === 'object') {
				const tmpObserved = popResult[sysObsKey];
				if (tmpObserved) {
					popResult = tmpObserved.detach();
				}
			}

			//	publish changes
			const as = getRootInfo(observed);
			if (as.observers.length) {
				as.path.push(poppedIndex);
				callObservers(as.observers, [{
					type: DELETE,
					path: as.path,
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
			const as = getRootInfo(observed);
			if (as.observers.length) {
				changes = [];
				for (i = initialLength, l = target.length; i < l; i++) {
					path = as.path.slice(0);
					path.push(i);
					changes[i - initialLength] = {
						type: INSERT,
						path: path,
						value: target[i],
						object: observed.proxy
					};
				}
				callObservers(as.observers, changes);
			}
			return pushResult;
		},
		shift: function proxiedShift(target, observed) {
			let shiftResult, i, l, item, tmpObserved;

			shiftResult = target.shift();
			if (shiftResult && typeof shiftResult === 'object') {
				tmpObserved = shiftResult[sysObsKey];
				if (tmpObserved) {
					shiftResult = tmpObserved.detach();
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
			const as = getRootInfo(observed);
			if (as.observers.length) {
				as.path.push(0);
				callObservers(as.observers, [{ type: DELETE, path: as.path, oldValue: shiftResult, object: observed.proxy }]);
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
			const as = getRootInfo(observed);
			if (as.observers.length) {
				const l = unshiftContent.length;
				let path;
				changes = new Array(l);
				for (let i = 0; i < l; i++) {
					path = as.path.slice(0);
					path.push(i);
					changes[i] = { type: INSERT, path: path, value: target[i], object: observed.proxy };
				}
				callObservers(as.observers, changes);
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
			const as = getRootInfo(observed);
			if (as.observers.length) {
				changes = [{ type: REVERSE, path: as.path, object: observed.proxy }];
				callObservers(as.observers, changes);
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
			const as = getRootInfo(observed);
			if (as.observers.length) {
				changes = [{ type: SHUFFLE, path: as.path, object: observed.proxy }];
				callObservers(as.observers, changes);
			}
			return observed.proxy;
		},
		fill: function proxiedFill(target, observed) {
			const
				as = getRootInfo(observed),
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
							tmpTarget = tmpObserved.detach();
						}
					}

					path = as.path.slice(0);
					path.push(i);
					changes.push({
						type: UPDATE,
						path: path,
						value: target[i],
						oldValue: tmpTarget,
						object: observed.proxy
					});
				} else {
					path = as.path.slice(0);
					path.push(i);
					changes.push({ type: INSERT, path: path, value: target[i], object: observed.proxy });
				}
			}

			//	publish changes
			if (as.observers.length) {
				callObservers(as.observers, changes);
			}
			return observed.proxy;
		},
		splice: function proxiedSplice(target, observed) {
			const
				as = getRootInfo(observed),
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

			//	detach removed objects
			let i, l, item;
			for (i = 0, l = spliceResult.length; i < l; i++) {
				item = spliceResult[i];
				if (item && typeof item === 'object') {
					tmpObserved = item[sysObsKey];
					if (tmpObserved) {
						spliceResult[i] = tmpObserved.detach();
					}
				}
			}

			//	publish changes
			if (as.observers.length) {
				let index, path;
				for (index = 0; index < removed; index++) {
					path = as.path.slice(0);
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
					path = as.path.slice(0);
					path.push(startIndex + index);
					changes.push({
						type: INSERT,
						path: path,
						value: target[startIndex + index],
						object: observed.proxy
					});
				}
				callObservers(as.observers, changes);
			}
			return spliceResult;
		}
	};

class ObserverBase {
	constructor(properties, cloningFunction) {
		const
			source = properties.target,
			parent = properties.parent,
			ownKey = properties.ownKey;
		let extDefs;
		if (parent && ownKey !== undefined) {
			this.parent = parent;
			this.ownKey = ownKey;
			extDefs = innerObsDefs;
		} else {
			this.isRevoked = false;
			this.observers = [];
			extDefs = rootObsDefs;
		}
		const targetClone = cloningFunction(source, extDefs, this);
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
				oldValue = tmpObserved.detach();
			}
		}

		//	publish changes
		const as = getRootInfo(this);
		if (as.observers.length) {
			as.path.push(key);
			changes = typeof oldValue === 'undefined'
				? [{ type: INSERT, path: as.path, value: newValue, object: this.proxy }]
				: [{ type: UPDATE, path: as.path, value: newValue, oldValue: oldValue, object: this.proxy }];
			callObservers(as.observers, changes);
		}
		return true;
	}

	deleteProperty(target, key) {
		let oldValue = target[key], changes;

		delete target[key];

		if (oldValue && typeof oldValue === 'object') {
			const tmpObserved = oldValue[sysObsKey];
			if (tmpObserved) {
				oldValue = tmpObserved.detach();
			}
		}

		//	publish changes
		const as = getRootInfo(this);
		if (as.observers.length) {
			as.path.push(key);
			changes = [{ type: DELETE, path: as.path, oldValue: oldValue, object: this.proxy }];
			callObservers(as.observers, changes);
		}

		return true;
	}
}

class ArrayObserver extends ObserverBase {
	constructor(properties) {
		super(properties, prepareArray);
	}

	detach() {
		// this.revokable.revoke();

		const target = this.target;
		let l = target.length, item, tmpObserved;
		while (l--) {
			item = target[l];
			if (item && typeof item === 'object') {
				tmpObserved = item[sysObsKey];
				if (tmpObserved) {
					target[l] = tmpObserved.detach();
				}
			}
		}
		return target;
	}

	get(target, key) {
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

	detach() {
		// this.revokable.revoke();

		const
			target = this.target,
			keys = Object.keys(target);
		let l = keys.length, key, item, tmpObserved;
		while (l--) {
			key = keys[l];
			item = target[key];
			if (item && typeof item === 'object') {
				tmpObserved = item[sysObsKey];
				if (tmpObserved) {
					target[key] = tmpObserved.detach();
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