import { oMetaKey } from './constants.ts';
import { getObservableFromRoot } from './observables/processors/proc-utils.ts';

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
	};

export const Observable = Object.freeze({
	from: getObservableFromRoot,
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
