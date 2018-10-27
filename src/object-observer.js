(() => {
	'use strict';

	console.warn('You are using script-flavor distribution of "object-observer". It is HIGHLY recommended to switch to ES6-module-flavor distribution, since this version is not developed anymore, apart from critical defect fixes.');

	const
		scope = this || window,
		INSERT = 'insert',
		UPDATE = 'update',
		DELETE = 'delete',
		REVERSE = 'reverse',
		SHUFFLE = 'shuffle',
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
		observableDefinition = {
			revoke: {
				value: function() {
					this[sysObsKey].revoke();
				}
			},
			observe: {
				value: function(observer) {
					let systemObserver = this[sysObsKey],
						observers = systemObserver.observers;
					if (systemObserver.isRevoked) { throw new TypeError('revoked Observable MAY NOT be observed anymore'); }
					if (typeof observer !== 'function') { throw new Error('observer parameter MUST be a function'); }

					if (observers.indexOf(observer) < 0) {
						observers.push(observer);
					} else {
						console.info('observer may be bound to an observable only once');
					}
				}
			},
			unobserve: {
				value: function() {
					let systemObserver = this[sysObsKey],
						observers = systemObserver.observers,
						l, idx;
					if (systemObserver.isRevoked) { throw new TypeError('revoked Observable MAY NOT be unobserved anymore'); }
					l = arguments.length;
					if (l) {
						while (l--) {
							idx = observers.indexOf(arguments[l]);
							if (idx >= 0) observers.splice(idx, 1);
						}
					} else {
						observers.splice(0);
					}
				}
			}
		},
		prepareArray = function(origin, destination, observer) {
			let l = origin.length, item;
			destination[sysObsKey] = observer;
			while (l--) {
				item = origin[l];
				if (item && typeof item === 'object' && !nonObservables.hasOwnProperty(item.constructor.name)) {
					destination[l] = Array.isArray(item)
						? new ArrayObserver({target: item, ownKey: l, parent: observer}).proxy
						: new ObjectObserver({target: item, ownKey: l, parent: observer}).proxy;
				} else {
					destination[l] = item;
				}
			}
		},
		prepareObject = function(origin, destination, observer) {
			let keys = Object.keys(origin), l = keys.length, key, item;
			destination[sysObsKey] = observer;
			while (l--) {
				key = keys[l];
				item = origin[key];
				if (item && typeof item === 'object' && !nonObservables.hasOwnProperty(item.constructor.name)) {
					destination[key] = Array.isArray(item)
						? new ArrayObserver({target: item, ownKey: key, parent: observer}).proxy
						: new ObjectObserver({target: item, ownKey: key, parent: observer}).proxy;
				} else {
					destination[key] = item;
				}
			}
		},
		callObservers = function(observers, changes) {
			let l = observers.length;
			while (l--) {
				try {
					observers[l](changes);
				} catch (e) {
					console.error('failed to deliver changes to listener' + observers[l], e);
				}
			}
		},
		getAncestorInfo = function(self) {
			let tmp = [], result, l1 = 0, l2 = 0;
			while (self.parent) {
				tmp[l1++] = self.ownKey;
				self = self.parent;
			}
			result = new Array(l1);
			while (l1--) result[l2++] = tmp[l1];
			return {observers: self.observers, path: result};
		};

	class ArrayObserver {
		constructor(properties) {
			let origin = properties.target, clone = new Array(origin.length);
			if (properties.parent === null) {
				this.isRevoked = false;
				this.observers = [];
				Object.defineProperties(clone, observableDefinition);
			} else {
				this.parent = properties.parent;
				this.ownKey = properties.ownKey;
			}
			prepareArray(origin, clone, this);
			this.revokable = Proxy.revocable(clone, this);
			this.proxy = this.revokable.proxy;
			this.target = clone;
		}

		//	returns an unobserved graph (effectively this is an opposite of an ArrayObserver constructor logic)
		revoke() {
			//	revoke native proxy
			this.revokable.revoke();

			//	roll back observed array to an unobserved one
			let target = this.target, l = target.length, item;
			while (l--) {
				item = target[l];
				if (item && typeof item === 'object') {
					let tmpObserved = item[sysObsKey];
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
					let ad = getAncestorInfo(observed);
					if (ad.observers.length) {
						ad.path.push(poppedIndex);
						callObservers(ad.observers, [{type: DELETE, path: ad.path, oldValue: popResult}]);
					}
					return popResult;
				},
				push: function proxiedPush(target, observed) {
					let i, l = arguments.length - 2, item, pushContent = new Array(l), pushResult, changes,
						initialLength, ad = getAncestorInfo(observed);
					initialLength = target.length;

					for (i = 0; i < l; i++) {
						item = arguments[i + 2];
						if (item && typeof item === 'object' && !nonObservables.hasOwnProperty(item.constructor.name)) {
							item = Array.isArray(item)
								? new ArrayObserver({target: item, ownKey: initialLength + i, parent: observed}).proxy
								: new ObjectObserver({target: item, ownKey: initialLength + i, parent: observed}).proxy;
						}
						pushContent[i] = item;
					}
					pushResult = Reflect.apply(target.push, target, pushContent);

					//	publish changes
					if (ad.observers.length) {
						changes = [];
						for (i = initialLength, l = target.length; i < l; i++) {
							let path = ad.path.slice(0);
							path.push(i);
							changes[i - initialLength] = {type: INSERT, path: path, value: target[i]};
						}
						callObservers(ad.observers, changes);
					}
					return pushResult;
				},
				shift: function proxiedShift(target, observed) {
					let shiftResult, i, l, item, ad, changes;

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
					ad = getAncestorInfo(observed);
					if (ad.observers.length) {
						ad.path.push(0);
						changes = [{type: DELETE, path: ad.path, oldValue: shiftResult}];
						callObservers(ad.observers, changes);
					}
					return shiftResult;
				},
				unshift: function proxiedUnshift(target, observed) {
					let unshiftContent, unshiftResult, ad, changes;
					unshiftContent = Array.from(arguments);
					unshiftContent.splice(0, 2);
					unshiftContent.forEach((item, index) => {
						if (item && typeof item === 'object' && !nonObservables.hasOwnProperty(item.constructor.name)) {
							unshiftContent[index] = Array.isArray(item)
								? new ArrayObserver({target: item, ownKey: index, parent: observed}).proxy
								: new ObjectObserver({target: item, ownKey: index, parent: observed}).proxy;
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
					ad = getAncestorInfo(observed);
					if (ad.observers.length) {
						let l = unshiftContent.length, path;
						changes = new Array(l);
						for (let i = 0; i < l; i++) {
							path = ad.path.slice(0);
							path.push(i);
							changes[i] = {type: INSERT, path: path, value: target[i]};
						}
						callObservers(ad.observers, changes);
					}
					return unshiftResult;
				},
				reverse: function proxiedReverse(target, observed) {
					let i, l, item, ad, changes;
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
					ad = getAncestorInfo(observed);
					if (ad.observers.length) {
						changes = [{type: REVERSE, path: ad.path}];
						callObservers(ad.observers, changes);
					}
					return observed.proxy;
				},
				sort: function proxiedSort(target, observed, comparator) {
					let i, l, item, ad, changes;
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
					ad = getAncestorInfo(observed);
					if (ad.observers.length) {
						changes = [{type: SHUFFLE, path: ad.path}];
						callObservers(ad.observers, changes);
					}
					return observed.proxy;
				},
				fill: function proxiedFill(target, observed) {
					let ad = getAncestorInfo(observed), normArgs, argLen,
						start, end, changes = [], prev, tarLen = target.length, path;
					normArgs = Array.from(arguments);
					normArgs.splice(0, 2);
					argLen = normArgs.length;
					start = argLen < 2 ? 0 : (normArgs[1] < 0 ? tarLen + normArgs[1] : normArgs[1]);
					end = argLen < 3 ? tarLen : (normArgs[2] < 0 ? tarLen + normArgs[2] : normArgs[2]);
					prev = target.slice(0);
					Reflect.apply(target.fill, target, normArgs);

					for (let i = start, item, tmpTarget; i < end; i++) {
						item = target[i];
						if (item && typeof item === 'object' && !nonObservables.hasOwnProperty(item.constructor.name)) {
							target[i] = Array.isArray(item)
								? new ArrayObserver({target: item, ownKey: i, parent: observed}).proxy
								: new ObjectObserver({target: item, ownKey: i, parent: observed}).proxy;
						}
						if (prev.hasOwnProperty(i)) {
							tmpTarget = prev[i];
							if (tmpTarget && typeof tmpTarget === 'object') {
								let tmpObserved = tmpTarget[sysObsKey];
								if (tmpObserved) {
									tmpTarget = tmpObserved.revoke();
								}
							}

							path = ad.path.slice(0);
							path.push(i);
							changes.push({type: UPDATE, path: path, value: target[i], oldValue: tmpTarget});
						} else {
							path = ad.path.slice(0);
							path.push(i);
							changes.push({type: INSERT, path: path, value: target[i]});
						}
					}

					//	publish changes
					if (ad.observers.length) {
						callObservers(ad.observers, changes);
					}
					return observed.proxy;
				},
				splice: function proxiedSplice(target, observed) {
					let ad = getAncestorInfo(observed),
						spliceContent, spliceResult, changes = [], tmpObserved,
						startIndex, removed, inserted, splLen, tarLen = target.length;

					spliceContent = Array.from(arguments);
					spliceContent.splice(0, 2);
					splLen = spliceContent.length;

					//	observify the newcomers
					for (let i = 2, item; i < splLen; i++) {
						item = spliceContent[i];
						if (item && typeof item === 'object' && !nonObservables.hasOwnProperty(item.constructor.name)) {
							spliceContent[i] = Array.isArray(item)
								? new ArrayObserver({target: item, ownKey: i, parent: observed}).proxy
								: new ObjectObserver({target: item, ownKey: i, parent: observed}).proxy;
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
					if (ad.observers.length) {
						let index, path;
						for (index = 0; index < removed; index++) {
							path = ad.path.slice(0);
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
							path = ad.path.slice(0);
							path.push(startIndex + index);
							changes.push({type: INSERT, path: path, value: target[startIndex + index]});
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

		set(target, key, value) {
			let oldValue = target[key], ad, changes;

			if (value && typeof value === 'object' && !nonObservables.hasOwnProperty(value.constructor.name)) {
				target[key] = Array.isArray(value)
					? new ArrayObserver({target: value, ownKey: key, parent: this}).proxy
					: new ObjectObserver({target: value, ownKey: key, parent: this}).proxy;
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
			ad = getAncestorInfo(this);
			if (ad.observers.length) {
				ad.path.push(key);
				changes = typeof oldValue === 'undefined'
					? [{type: INSERT, path: ad.path, value: value}]
					: [{type: UPDATE, path: ad.path, value: value, oldValue: oldValue}];
				callObservers(ad.observers, changes);
			}
			return true;
		}

		deleteProperty(target, key) {
			let oldValue = target[key], ad, changes;

			if (delete target[key]) {
				if (oldValue && typeof oldValue === 'object') {
					let tmpObserved = oldValue[sysObsKey];
					if (tmpObserved) {
						oldValue = tmpObserved.revoke();
					}
				}

				//	publish changes
				ad = getAncestorInfo(this);
				if (ad.observers.length) {
					ad.path.push(key);
					changes = [{type: DELETE, path: ad.path, oldValue: oldValue}];
					callObservers(ad.observers, changes);
				}
				return true;
			} else {
				return false;
			}
		}
	}

	class ObjectObserver {
		constructor(properties) {
			let origin = properties.target, clone = {};
			if (properties.parent === null) {
				this.isRevoked = false;
				this.observers = [];
				Object.defineProperties(clone, observableDefinition);
			} else {
				this.parent = properties.parent;
				this.ownKey = properties.ownKey;
			}
			prepareObject(origin, clone, this);
			this.revokable = Proxy.revocable(clone, this);
			this.proxy = this.revokable.proxy;
			this.target = clone;
		}

		//	returns an unobserved graph (effectively this is an opposite of an ObjectObserver constructor logic)
		revoke() {
			//	revoke native proxy
			this.revokable.revoke();

			//	roll back observed graph to an unobserved one
			let target = this.target, keys = Object.keys(target), l = keys.length, key, item;
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
			return target;
		}

		set(target, key, value) {
			let oldValue = target[key], ad, changes;

			if (value && typeof value === 'object' && !nonObservables.hasOwnProperty(value.constructor.name)) {
				target[key] = Array.isArray(value)
					? new ArrayObserver({target: value, ownKey: key, parent: this}).proxy
					: new ObjectObserver({target: value, ownKey: key, parent: this}).proxy;
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
			ad = getAncestorInfo(this);
			if (ad.observers.length) {
				ad.path.push(key);
				changes = typeof oldValue === 'undefined'
					? [{type: INSERT, path: ad.path, value: value}]
					: [{type: UPDATE, path: ad.path, value: value, oldValue: oldValue}];
				callObservers(ad.observers, changes);
			}
			return true;
		}

		deleteProperty(target, key) {
			let oldValue = target[key], ad, changes;

			if (delete target[key]) {
				if (oldValue && typeof oldValue === 'object') {
					let tmpObserved = oldValue[sysObsKey];
					if (tmpObserved) {
						oldValue = tmpObserved.revoke();
					}
				}

				//	publish changes
				ad = getAncestorInfo(this);
				if (ad.observers.length) {
					ad.path.push(key);
					changes = [{type: DELETE, path: ad.path, oldValue: oldValue}];
					callObservers(ad.observers, changes);
				}
				return true;
			} else {
				return false;
			}
		}
	}

	class Observable {
		constructor() {
			throw new Error('Observable MAY NOT be created via constructor, see "Observable.from" API');
		}

		static from(target) {
			if (target && typeof target === 'object' && !nonObservables.hasOwnProperty(target.constructor.name) && !('observe' in target) && !('unobserve' in target) && !('revoke' in target)) {
				let observed = Array.isArray(target)
					? new ArrayObserver({target: target, ownKey: null, parent: null})
					: new ObjectObserver({target: target, ownKey: null, parent: null});
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

		static isObservable(input) {
			return typeof input === 'object' && input !== null &&
				typeof input.revoke === 'function' &&
				typeof input.observe === 'function' &&
				typeof input.unobserve === 'function';
		}
	}

	Object.freeze(Observable);
	Object.defineProperty(scope, 'Observable', {value: Observable});
})();