import { oMetaKey } from '../../constants.ts';
import { Change } from '../../model/change.ts';
import { ObservableBase } from '../abstract-base.ts';
import { ObservableArray } from '../array.ts';
import { ObservableObject } from '../object.ts';
import { ObservableTypedArray } from '../typed-array.ts';

export function getObservedOf(item: unknown, key: string | symbol | number, parent: object, visited?: Set<unknown>): unknown {
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

export function getObservableFromRoot(target: unknown, options = undefined): unknown {
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
}

//	re-assign ownKey for every observable child of target whose position has changed
export function reindexObservableChildren(target: ArrayLike<unknown>, from = 0): void {
	for (let i = from, l = target.length; i < l; i++) {
		const item = target[i];
		if (item && typeof item === 'object') {
			const childMeta = item[oMetaKey];
			if (childMeta) {
				childMeta.ownKey = i;
			}
		}
	}
}

//	if value is an observable, detach it and return the unwrapped target; otherwise return value as-is
export function detachIfObservable(value: unknown): unknown {
	if (value && typeof value === 'object') {
		const childMeta = value[oMetaKey];
		if (childMeta) {
			return childMeta.detach();
		}
	}
	return value;
}

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
					if (currentObservable.batches.size === 0) {
						queueMicrotask(callObserversFromMT.bind(currentObservable));
					}
					let batch = currentObservable.batches.get(target);
					if (!batch) {
						batch = [];
						currentObservable.batches.set(target, batch);
					}
					batch.push(...relevantChanges);
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

function filterChanges(options, changes) {
	if (options === null || !options.filters) {
		return changes;
	}
	let result = changes;
	const filters = options.filters;
	for (let i = 0, l = filters.length; i < l && result.length; i++) {
		result = filters[i](result);
	}
	return result;
}

function callObserverSafe(listener, changes) {
	try {
		listener(changes);
	} catch (e) {
		console.error(`failed to notify listener ${listener} with ${changes}`, e);
	}
}

function callObserversFromMT() {
	const batches = this.batches;
	this.batches = new Map();
	for (const [listener, changes] of batches) {
		callObserverSafe(listener, changes);
	}
};
