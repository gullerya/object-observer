import { Change } from '../../model/change.ts';
import { INSERT, UPDATE } from '../../constants.ts';
import { callObservers, detachIfObservable, getObservedOf, runValidators } from '../processors/proc-utils.ts';

export function proxiedSet(target: object, key: string | symbol, value: unknown): boolean {
	const prevValue = target[key];

	if (value !== prevValue) {
		//	build prospective change with raw (un-observified) new value so validators see what the caller wrote
		const prospective = prevValue === undefined
			? [new Change(INSERT, [key], value, undefined, this.proxy)]
			: [new Change(UPDATE, [key], value, prevValue, this.proxy)];
		runValidators(this, prospective);

		const newValue = getObservedOf(value, key, this);
		target[key] = newValue;

		const oldValue = detachIfObservable(prevValue);

		const changes = oldValue === undefined
			? [new Change(INSERT, [key], newValue, undefined, this.proxy)]
			: [new Change(UPDATE, [key], newValue, oldValue, this.proxy)];
		callObservers(this, changes);
	}

	return true;
};
