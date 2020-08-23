const
	INSERT = 'insert',
	UPDATE = 'update',
	DELETE = 'delete',
	REVERSE = 'reverse',
	SHUFFLE = 'shuffle',
	oMetaKey = Symbol('observable-meta-key'),
	validOptionsKeys = { path: 1, pathsOf: 1, pathsFrom: 1 },
	processObserveOptions = function processObserveOptions(options) {
		const result = {};
		if (options.path !== undefined) {
			if (typeof options.path !== 'string' || options.path === '') {
				throw new Error('"path" option, if/when provided, MUST be a non-empty string');
			}
			result.path = options.path;
		}
		if (options.pathsOf !== undefined) {
			if (options.path) {
				throw new Error('"pathsOf" option MAY NOT be specified together with "path" option');
			}
			if (typeof options.pathsOf !== 'string') {
				throw new Error('"pathsOf" option, if/when provided, MUST be a string (MAY be empty)');
			}
			result.pathsOf = options.pathsOf.split('.').filter(n => n);
		}
		if (options.pathsFrom !== undefined) {
			if (options.path || options.pathsOf) {
				throw new Error('"pathsFrom" option MAY NOT be specified together with "path"/"pathsOf"  option/s');
			}
			if (typeof options.pathsFrom !== 'string' || options.pathsFrom === '') {
				throw new Error('"pathsFrom" option, if/when provided, MUST be a non-empty string');
			}
			result.pathsFrom = options.pathsFrom;
		}
		const invalidOptions = Object.keys(options).filter(option => !validOptionsKeys.hasOwnProperty(option));
		if (invalidOptions.length) {
			throw new Error(`'${invalidOptions.join(', ')}' is/are not a valid option/s`);
		}
		return result;
	},
	observe = function observe(observer, options) {
		if (typeof observer !== 'function') {
			throw new Error(`observer MUST be a function, got '${observer}'`);
		}

		const
			oMeta = this[oMetaKey],
			observers = oMeta.observers;
		if (!observers.some(o => o[0] === observer)) {
			let opts;
			if (options) {
				opts = processObserveOptions(options);
			} else {
				opts = {};
			}
			observers.push([observer, opts]);
		} else {
			console.warn('observer may be bound to an observable only once; will NOT rebind');
		}
	},
	unobserve = function unobserve() {
		const oMeta = this[oMetaKey];
		const observers = oMeta.observers;
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
				observers.splice(0);
			}
		}
	},
	propertiesBluePrint = { [oMetaKey]: { value: null }, observe: { value: observe }, unobserve: { value: unobserve } },
	prepareObject = function prepareObject(source, oMeta) {
		propertiesBluePrint[oMetaKey].value = oMeta;
		const
			keys = Object.keys(source),
			target = Object.defineProperties({}, propertiesBluePrint);
		let l = keys.length, key;
		while (l--) {
			key = keys[l];
			target[key] = getObservedOf(source[key], key, oMeta);
		}
		return target;
	},
	prepareArray = function prepareArray(source, oMeta) {
		let l = source.length;
		propertiesBluePrint[oMetaKey].value = oMeta;
		const target = Object.defineProperties(new Array(l), propertiesBluePrint);
		while (l--) {
			target[l] = getObservedOf(source[l], l, oMeta);
		}
		return target;
	},
	prepareTypedArray = function prepareTypedArray(source, oMeta) {
		propertiesBluePrint[oMetaKey].value = oMeta;
		Object.defineProperties(source, propertiesBluePrint);
		return source;
	},
	callObservers = function callObservers(oMeta, changes) {
		let observers, pair, target, options, relevantChanges, oPath, oPaths, i, newPath, tmp;
		const l = changes.length;
		do {
			observers = oMeta.observers;
			i = observers.length;
			while (i--) {
				try {
					pair = observers[i];
					target = pair[0];
					options = pair[1];
					relevantChanges = changes;

					if (options.path) {
						oPath = options.path;
						relevantChanges = changes.filter(change => change.path.join('.') === oPath);
					} else if (options.pathsOf) {
						relevantChanges = changes.filter(change => change.path.length === options.pathsOf.length + 1 || change.type === REVERSE || change.type === SHUFFLE);
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

			let tmpa;
			if (oMeta.parent) {
				tmpa = new Array(l);
				for (let i = 0; i < l; i++) {
					tmp = changes[i];
					newPath = [oMeta.ownKey, ...tmp.path];
					tmpa[i] = {
						type: tmp.type,
						path: newPath,
						value: tmp.value,
						oldValue: tmp.oldValue,
						object: tmp.object
					};
				}
				changes = tmpa;
				oMeta = oMeta.parent;
			} else {
				break;
			}
		} while (true);
	},
	getObservedOf = function getObservedOf(item, key, parent) {
		if (!item || typeof item !== 'object') {
			return item;
		} else if (Array.isArray(item)) {
			return new ArrayOMeta({ target: item, ownKey: key, parent: parent }).proxy;
		} else if (ArrayBuffer.isView(item)) {
			return new TypedArrayOMeta({ target: item, ownKey: key, parent: parent }).proxy;
		} else if (item instanceof Date || item instanceof Blob || item instanceof Error) {
			return item;
		} else {
			return new ObjectOMeta({ target: item, ownKey: key, parent: parent }).proxy;
		}
	},
	proxiedPop = function proxiedPop() {
		const oMeta = this[oMetaKey],
			target = oMeta.target,
			poppedIndex = target.length - 1;

		let popResult = target.pop();
		if (popResult && typeof popResult === 'object') {
			const tmpObserved = popResult[oMetaKey];
			if (tmpObserved) {
				popResult = tmpObserved.detach();
			}
		}

		const changes = [{ type: DELETE, path: [poppedIndex], oldValue: popResult, object: this }];
		callObservers(oMeta, changes);

		return popResult;
	},
	proxiedPush = function proxiedPush() {
		const
			oMeta = this[oMetaKey],
			target = oMeta.target,
			l = arguments.length,
			pushContent = new Array(l),
			initialLength = target.length;

		for (let i = 0; i < l; i++) {
			pushContent[i] = getObservedOf(arguments[i], initialLength + i, oMeta);
		}
		const pushResult = Reflect.apply(target.push, target, pushContent);

		const changes = [];
		for (let i = initialLength, l = target.length; i < l; i++) {
			changes[i - initialLength] = { type: INSERT, path: [i], value: target[i], object: this };
		}
		callObservers(oMeta, changes);

		return pushResult;
	},
	proxiedShift = function proxiedShift() {
		const
			oMeta = this[oMetaKey],
			target = oMeta.target;
		let shiftResult, i, l, item, tmpObserved;

		shiftResult = target.shift();
		if (shiftResult && typeof shiftResult === 'object') {
			tmpObserved = shiftResult[oMetaKey];
			if (tmpObserved) {
				shiftResult = tmpObserved.detach();
			}
		}

		//	update indices of the remaining items
		for (i = 0, l = target.length; i < l; i++) {
			item = target[i];
			if (item && typeof item === 'object') {
				tmpObserved = item[oMetaKey];
				if (tmpObserved) {
					tmpObserved.ownKey = i;
				}
			}
		}

		const changes = [{ type: DELETE, path: [0], oldValue: shiftResult, object: this }];
		callObservers(oMeta, changes);

		return shiftResult;
	},
	proxiedUnshift = function proxiedUnshift() {
		const
			oMeta = this[oMetaKey],
			target = oMeta.target,
			al = arguments.length,
			unshiftContent = new Array(al);

		for (let i = 0; i < al; i++) {
			unshiftContent[i] = getObservedOf(arguments[i], i, oMeta);
		}
		const unshiftResult = Reflect.apply(target.unshift, target, unshiftContent);

		for (let i = 0, l = target.length, item; i < l; i++) {
			item = target[i];
			if (item && typeof item === 'object') {
				const tmpObserved = item[oMetaKey];
				if (tmpObserved) {
					tmpObserved.ownKey = i;
				}
			}
		}

		//	publish changes
		const l = unshiftContent.length;
		const changes = new Array(l);
		for (let i = 0; i < l; i++) {
			changes[i] = { type: INSERT, path: [i], value: target[i], object: this };
		}
		callObservers(oMeta, changes);

		return unshiftResult;
	},
	proxiedReverse = function proxiedReverse() {
		const
			oMeta = this[oMetaKey],
			target = oMeta.target;
		let i, l, item;

		target.reverse();
		for (i = 0, l = target.length; i < l; i++) {
			item = target[i];
			if (item && typeof item === 'object') {
				const tmpObserved = item[oMetaKey];
				if (tmpObserved) {
					tmpObserved.ownKey = i;
				}
			}
		}

		const changes = [{ type: REVERSE, path: [], object: this }];
		callObservers(oMeta, changes);

		return this;
	},
	proxiedSort = function proxiedSort(comparator) {
		const
			oMeta = this[oMetaKey],
			target = oMeta.target;
		let i, l, item;

		target.sort(comparator);
		for (i = 0, l = target.length; i < l; i++) {
			item = target[i];
			if (item && typeof item === 'object') {
				const tmpObserved = item[oMetaKey];
				if (tmpObserved) {
					tmpObserved.ownKey = i;
				}
			}
		}

		const changes = [{ type: SHUFFLE, path: [], object: this }];
		callObservers(oMeta, changes);

		return this;
	},
	proxiedFill = function proxiedFill(filVal, start, end) {
		const
			oMeta = this[oMetaKey],
			target = oMeta.target,
			changes = [],
			tarLen = target.length,
			prev = target.slice(0);
		start = start === undefined ? 0 : (start < 0 ? Math.max(tarLen + start, 0) : Math.min(start, tarLen));
		end = end === undefined ? tarLen : (end < 0 ? Math.max(tarLen + end, 0) : Math.min(end, tarLen));

		if (start < tarLen && end > start) {
			target.fill(filVal, start, end);

			let tmpObserved;
			for (let i = start, item, tmpTarget; i < end; i++) {
				item = target[i];
				target[i] = getObservedOf(item, i, oMeta);
				if (prev.hasOwnProperty(i)) {
					tmpTarget = prev[i];
					if (tmpTarget && typeof tmpTarget === 'object') {
						tmpObserved = tmpTarget[oMetaKey];
						if (tmpObserved) {
							tmpTarget = tmpObserved.detach();
						}
					}

					changes.push({ type: UPDATE, path: [i], value: target[i], oldValue: tmpTarget, object: this });
				} else {
					changes.push({ type: INSERT, path: [i], value: target[i], object: this });
				}
			}

			callObservers(oMeta, changes);
		}

		return this;
	},
	proxiedCopyWithin = function proxiedCopyWithin(dest, start, end) {
		const
			oMeta = this[oMetaKey],
			target = oMeta.target,
			tarLen = target.length;
		dest = dest < 0 ? Math.max(tarLen + dest, 0) : dest;
		start = start === undefined ? 0 : (start < 0 ? Math.max(tarLen + start, 0) : Math.min(start, tarLen));
		end = end === undefined ? tarLen : (end < 0 ? Math.max(tarLen + end, 0) : Math.min(end, tarLen));
		const len = Math.min(end - start, tarLen - dest);

		if (dest < tarLen && dest !== start && len > 0) {
			const
				prev = target.slice(0),
				changes = [];

			target.copyWithin(dest, start, end);

			for (let i = dest, nItem, oItem, tmpObserved; i < dest + len; i++) {
				//	update newly placed observables, if any
				nItem = target[i];
				if (nItem && typeof nItem === 'object') {
					nItem = getObservedOf(nItem, i, oMeta);
					target[i] = nItem;
				}

				//	detach overridden observables, if any
				oItem = prev[i];
				if (oItem && typeof oItem === 'object') {
					tmpObserved = oItem[oMetaKey];
					if (tmpObserved) {
						oItem = tmpObserved.detach();
					}
				}

				if (typeof nItem !== 'object' && nItem === oItem) {
					continue;
				}
				changes.push({ type: UPDATE, path: [i], value: nItem, oldValue: oItem, object: this });
			}

			callObservers(oMeta, changes);
		}

		return this;
	},
	proxiedSplice = function proxiedSplice() {
		const
			oMeta = this[oMetaKey],
			target = oMeta.target,
			splLen = arguments.length,
			spliceContent = new Array(splLen),
			tarLen = target.length;

		//	observify the newcomers
		for (let i = 0; i < splLen; i++) {
			spliceContent[i] = getObservedOf(arguments[i], i, oMeta);
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
				tmpObserved = item[oMetaKey];
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
				tmpObserved = item[oMetaKey];
				if (tmpObserved) {
					spliceResult[i] = tmpObserved.detach();
				}
			}
		}

		const changes = [];
		let index;
		for (index = 0; index < removed; index++) {
			if (index < inserted) {
				changes.push({ type: UPDATE, path: [startIndex + index], value: target[startIndex + index], oldValue: spliceResult[index], object: this });
			} else {
				changes.push({ type: DELETE, path: [startIndex + index], oldValue: spliceResult[index], object: this });
			}
		}
		for (; index < inserted; index++) {
			changes.push({ type: INSERT, path: [startIndex + index], value: target[startIndex + index], object: this });
		}
		callObservers(oMeta, changes);

		return spliceResult;
	},
	proxiedTypedArraySet = function proxiedTypedArraySet(source, offset) {
		const
			oMeta = this[oMetaKey],
			target = oMeta.target,
			souLen = source.length,
			prev = target.slice(0);
		offset = offset || 0;

		target.set(source, offset);
		const changes = new Array(souLen);
		for (let i = offset; i < (souLen + offset); i++) {
			changes[i - offset] = { type: UPDATE, path: [i], value: target[i], oldValue: prev[i], object: this };
		}

		callObservers(oMeta, changes);
	},
	proxiedArrayMethods = {
		pop: proxiedPop,
		push: proxiedPush,
		shift: proxiedShift,
		unshift: proxiedUnshift,
		reverse: proxiedReverse,
		sort: proxiedSort,
		fill: proxiedFill,
		copyWithin: proxiedCopyWithin,
		splice: proxiedSplice
	},
	proxiedTypedArrayMethods = {
		reverse: proxiedReverse,
		sort: proxiedSort,
		fill: proxiedFill,
		copyWithin: proxiedCopyWithin,
		set: proxiedTypedArraySet
	};

class OMetaBase {
	constructor(properties, cloningFunction) {
		const
			source = properties.target,
			parent = properties.parent,
			ownKey = properties.ownKey;
		if (parent && ownKey !== undefined) {
			this.parent = parent;
			this.ownKey = ownKey;
		} else {
			this.parent = null;
			this.ownKey = null;
		}
		const targetClone = cloningFunction(source, this);
		this.observers = [];
		this.revokable = Proxy.revocable(targetClone, this);
		this.proxy = this.revokable.proxy;
		this.target = targetClone;
	}

	detach() {
		this.parent = null;
		return this.target;
	}

	set(target, key, value) {
		let oldValue = target[key];

		if (value !== oldValue) {
			const newValue = getObservedOf(value, key, this);
			target[key] = newValue;

			if (oldValue && typeof oldValue === 'object') {
				const tmpObserved = oldValue[oMetaKey];
				if (tmpObserved) {
					oldValue = tmpObserved.detach();
				}
			}

			const changes = oldValue === undefined
				? [{ type: INSERT, path: [key], value: newValue, object: this.proxy }]
				: [{ type: UPDATE, path: [key], value: newValue, oldValue: oldValue, object: this.proxy }];
			callObservers(this, changes);
		}

		return true;
	}

	deleteProperty(target, key) {
		let oldValue = target[key];

		delete target[key];

		if (oldValue && typeof oldValue === 'object') {
			const tmpObserved = oldValue[oMetaKey];
			if (tmpObserved) {
				oldValue = tmpObserved.detach();
			}
		}

		const changes = [{ type: DELETE, path: [key], oldValue: oldValue, object: this.proxy }];
		callObservers(this, changes);

		return true;
	}
}

class ObjectOMeta extends OMetaBase {
	constructor(properties) {
		super(properties, prepareObject);
	}
}

class ArrayOMeta extends OMetaBase {
	constructor(properties) {
		super(properties, prepareArray);
	}

	get(target, key) {
		if (proxiedArrayMethods.hasOwnProperty(key)) {
			return proxiedArrayMethods[key];
		} else {
			return target[key];
		}
	}
}

class TypedArrayOMeta extends OMetaBase {
	constructor(properties) {
		super(properties, prepareTypedArray);
	}

	get(target, key) {
		if (proxiedTypedArrayMethods.hasOwnProperty(key)) {
			return proxiedTypedArrayMethods[key];
		} else {
			return target[key];
		}
	}
}

class Observable {
	constructor() {
		throw new Error('Observable MAY NOT be created via constructor, see "Observable.from" API');
	}

	static from(target) {
		if (!target || typeof target !== 'object') {
			throw new Error('observable MAY ONLY be created from a non-null object');
		} else if (target[oMetaKey]) {
			return target;
		} else if (Array.isArray(target)) {
			return new ArrayOMeta({ target: target, ownKey: null, parent: null }).proxy;
		} else if (ArrayBuffer.isView(target)) {
			return new TypedArrayOMeta({ target: target, ownKey: null, parent: null }).proxy;
		} else if (target instanceof Date || target instanceof Blob || target instanceof Error) {
			throw new Error(`${target} found to be one of a on-observable types`);
		} else {
			return new ObjectOMeta({ target: target, ownKey: null, parent: null }).proxy;
		}
	}

	static isObservable(input) {
		return !!(input && input[oMetaKey]);
	}
}

Object.freeze(Observable);

export { Observable };