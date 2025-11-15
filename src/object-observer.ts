import { Change } from './structs/change.js';
import { ObservableArray } from './observables/array.js';
import { ObservableTypedArray } from './observables/typed-array.js';
import { ObservableObject } from './observables/object.js';
import { REVERSE, SHUFFLE } from './constants.js';
import { oMetaKey } from './constants.js';
import { ObservableBase } from './observables/abstract-base.js';

const
	processObserveOptions = options => {
		if (!options || typeof options !== 'object') {
			return null;
		}

		const result = {};
		const invalidOptions = [];
		for (const [optName, optVal] of Object.entries(options)) {
			if (optName === 'path') {
				if (typeof optVal !== 'string' || optVal === '') {
					throw new Error('"path" option, if/when provided, MUST be a non-empty string');
				}
				result[optName] = optVal;
			} else if (optName === 'pathsOf') {
				if (options.path) {
					throw new Error('"pathsOf" option MAY NOT be specified together with "path" option');
				}
				if (typeof optVal !== 'string') {
					throw new Error('"pathsOf" option, if/when provided, MUST be a string (MAY be empty)');
				}
				result[optName] = options.pathsOf.split('.').filter(Boolean);
			} else if (optName === 'pathsFrom') {
				if (options.path || options.pathsOf) {
					throw new Error('"pathsFrom" option MAY NOT be specified together with "path"/"pathsOf" option/s');
				}
				if (typeof optVal !== 'string' || optVal === '') {
					throw new Error('"pathsFrom" option, if/when provided, MUST be a non-empty string');
				}
				result[optName] = optVal;
			} else {
				invalidOptions.push(optName);
			}
		}
		if (invalidOptions.length) {
			throw new Error(`'${invalidOptions.join(', ')}' is/are not a valid observer option/s`);
		}
		return result;
	},
	filterChanges = (options, changes) => {
		if (options === null) {
			return changes;
		}

		let result = changes;
		if (options.path) {
			const oPath = options.path;
			result = changes.filter(change =>
				change.path.join('.') === oPath
			);
		} else if (options.pathsOf) {
			const oPathsOf = options.pathsOf;
			const oPathsOfStr = oPathsOf.join('.');
			result = changes.filter(change =>
				(change.path.length === oPathsOf.length + 1 ||
					(change.path.length === oPathsOf.length && (change.type === REVERSE || change.type === SHUFFLE))) &&
				change.path.join('.').startsWith(oPathsOfStr)
			);
		} else if (options.pathsFrom) {
			const oPathsFrom = options.pathsFrom;
			result = changes.filter(change =>
				change.path.join('.').startsWith(oPathsFrom)
			);
		}
		return result;
	},
	callObserverSafe = (listener, changes) => {
		try {
			listener(changes);
		} catch (e) {
			console.error(`failed to notify listener ${listener} with ${changes}`, e);
		}
	},
	callObserversFromMT = function callObserversFromMT() {
		const batches = this.batches;
		this.batches = [];
		for (const [listener, changes] of batches) {
			callObserverSafe(listener, changes);
		}
	};

export function callObservers(oMeta: ObservableBase, changes: Change[]) {
	let currentObservable: ObservableBase = oMeta;
	let isAsync, observers, target, options, relevantChanges, i;
	const l = changes.length;
	do {
		isAsync = currentObservable.async;
		observers = currentObservable.observers;
		i = observers.length;
		while (i--) {
			[target, options] = observers[i];
			relevantChanges = filterChanges(options, changes);

			if (relevantChanges.length) {
				if (isAsync) {
					//	this is the async dispatch handling
					if (currentObservable.batches.length === 0) {
						queueMicrotask(callObserversFromMT.bind(currentObservable));
					}
					let rb;
					for (const b of currentObservable.batches) {
						if (b[0] === target) {
							rb = b;
							break;
						}
					}
					if (!rb) {
						rb = [target, []];
						currentObservable.batches.push(rb);
					}
					Array.prototype.push.apply(rb[1], relevantChanges);
				} else {
					//	this is the naive straight forward synchronous dispatch
					callObserverSafe(target, relevantChanges);
				}
			}
		}

		//	cloning all the changes and notifying in context of parent
		const parent = currentObservable.parent;
		if (parent) {
			for (let j = 0; j < l; j++) {
				const change = changes[j];
				changes[j] = new Change(
					change.type,
					[currentObservable.ownKey, ...change.path],
					change.value,
					change.oldValue,
					change.object
				);
			}
			currentObservable = parent;
		} else {
			break;
		}
	} while (currentObservable);
};

export function getObservedOf(item: unknown, key: string | symbol | number, parent: object, visited?: Set<unknown>) {
	if (visited !== undefined && visited.has(item)) {
		return null;
	} else if (typeof item !== 'object' || item === null) {
		return item;
	} else if (Array.isArray(item)) {
		return new ObservableArray({ target: item, ownKey: key, parent: parent, visited }).proxy;
	} else if (ArrayBuffer.isView(item)) {
		return new ObservableTypedArray({ target: item, ownKey: key, parent: parent }).proxy;
	} else if (item instanceof Date) {
		return item;
	} else {
		return new ObservableObject({ target: item, ownKey: key, parent: parent, visited }).proxy;
	}
};

export const Observable = Object.freeze({
	from: (target, options = undefined) => {
		if (!target || typeof target !== 'object') {
			throw new Error('observable MAY ONLY be created from a non-null object');
		} else if (target[oMetaKey]) {
			return target;
		} else if (Array.isArray(target)) {
			return new ObservableArray({ target: target, ownKey: null, parent: null, options: options }).proxy;
		} else if (ArrayBuffer.isView(target)) {
			return new ObservableTypedArray({ target: target, ownKey: null, parent: null, options: options }).proxy;
		} else if (target instanceof Date) {
			throw new Error(`${target} found to be one of a non-observable types`);
		} else {
			return new ObservableObject({ target: target, ownKey: null, parent: null, options: options }).proxy;
		}
	},
	isObservable: input => {
		return !!(input && input[oMetaKey]);
	},
	observe: (observable, observer, options) => {
		if (!Observable.isObservable(observable)) {
			throw new Error(`invalid observable parameter`);
		}
		if (typeof observer !== 'function') {
			throw new Error(`observer MUST be a function, got '${observer}'`);
		}

		const observers = observable[oMetaKey].observers;
		if (!observers.some(o => o[0] === observer)) {
			observers.push([observer, processObserveOptions(options)]);
		} else {
			console.warn('observer may be bound to an observable only once; will NOT rebind');
		}
	},
	unobserve: (observable, ...observers) => {
		if (!Observable.isObservable(observable)) {
			throw new Error(`invalid observable parameter`);
		}

		const existingObs = observable[oMetaKey].observers;
		let el = existingObs.length;
		if (!el) {
			return;
		}

		if (!observers.length) {
			existingObs.splice(0);
			return;
		}

		while (el) {
			const i = observers.indexOf(existingObs[--el][0]);
			if (i >= 0) {
				existingObs.splice(el, 1);
			}
		}
	}
});

export class ObjectObserver {
	#observer;
	#targets;

	constructor(observer) {
		this.#observer = observer;
		this.#targets = new Set();
		Object.freeze(this);
	}

	observe(target, options) {
		const r = Observable.from(target);
		Observable.observe(r, this.#observer, options);
		this.#targets.add(r);
		return r;
	}

	unobserve(target) {
		Observable.unobserve(target, this.#observer);
		this.#targets.delete(target);
	}

	disconnect() {
		for (const t of this.#targets) {
			Observable.unobserve(t, this.#observer);
		}
		this.#targets.clear();
	}
}
