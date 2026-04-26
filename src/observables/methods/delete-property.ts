import { Change } from '../../model/change.ts';
import { DELETE } from '../../constants.ts';
import { callObservers, detachIfObservable, runValidators } from '../processors/proc-utils.ts';

export function proxiedDeleteProperty(target: object, key: string | symbol): boolean {
	const prevValue = target[key];

	const prospective = [new Change(DELETE, [key], undefined, prevValue, this.proxy)];
	runValidators(this, prospective);

	delete target[key];
	const oldValue = detachIfObservable(prevValue);

	const changes = [new Change(DELETE, [key], undefined, oldValue, this.proxy)];
	callObservers(this, changes);

	return true;
};
