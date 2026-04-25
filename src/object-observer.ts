import { oMetaKey } from './constants.ts';
import { getObservableFromRoot } from './observables/processors/proc-utils.ts';
import { Filter, type FilterFn } from './changes-processors/filters.ts';

export { Filter };

const
	processObserveOptions = options => {
		if (!options || typeof options !== 'object') {
			return null;
		}

		const result: { filters?: FilterFn[] } = {};
		const invalidOptions = [];
		for (const [optName, optVal] of Object.entries(options)) {
			if (optName === 'filters') {
				if (!Array.isArray(optVal) || optVal.length === 0) {
					throw new Error('"filters" option, if/when provided, MUST be a non-empty array of Filter instances');
				}
				const fns: FilterFn[] = new Array(optVal.length);
				for (let i = 0; i < optVal.length; i++) {
					const f = optVal[i];
					if (!(f instanceof Filter)) {
						throw new Error('"filters" option, if/when provided, MUST be a non-empty array of Filter instances');
					}
					fns[i] = f.fn;
				}
				result.filters = fns;
			} else {
				invalidOptions.push(optName);
			}
		}
		if (invalidOptions.length) {
			throw new Error(`'${invalidOptions.join(', ')}' is/are not a valid observer option/s`);
		}
		return Object.keys(result).length === 0 ? null : result;
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
