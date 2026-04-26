import { Change } from '../../model/change.ts';
import { DELETE, oMetaKey } from '../../constants.ts';
import { callObservers, detachIfObservable, reindexObservableChildren, runValidators } from '../processors/proc-utils.ts';

export default function proxiedShift() {
	const oMeta = this[oMetaKey];
	const target = oMeta.target;
	const prevValue = target[0];

	const prospective = [new Change(DELETE, [0], undefined, prevValue, this)];
	runValidators(oMeta, prospective);

	const shiftResult = detachIfObservable(target.shift());
	reindexObservableChildren(target);

	const changes = [new Change(DELETE, [0], undefined, shiftResult, this)];
	callObservers(oMeta, changes);

	return shiftResult;
};
