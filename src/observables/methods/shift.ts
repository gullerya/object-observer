import { Change } from '../../model/change.ts';
import { DELETE, oMetaKey } from '../../constants.ts';
import { callObservers, detachIfObservable, reindexObservableChildren } from '../processors/proc-utils.ts';

export default function proxiedShift() {
	const oMeta = this[oMetaKey];
	const target = oMeta.target;

	const shiftResult = detachIfObservable(target.shift());
	reindexObservableChildren(target);

	const changes = [new Change(DELETE, [0], undefined, shiftResult, this)];
	callObservers(oMeta, changes);

	return shiftResult;
};
