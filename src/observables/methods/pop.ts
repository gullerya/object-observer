import { Change } from '../../model/change.ts';
import { DELETE, oMetaKey } from '../../constants.ts';
import { callObservers, detachIfObservable, runValidators } from '../processors/proc-utils.ts';

export default function proxiedPop() {
	const oMeta = this[oMetaKey];
	const target = oMeta.target;
	const poppedIndex = target.length - 1;
	const prevValue = target[poppedIndex];

	const prospective = [new Change(DELETE, [poppedIndex], undefined, prevValue, this)];
	runValidators(oMeta, prospective);

	const popResult = detachIfObservable(target.pop());

	const changes = [new Change(DELETE, [poppedIndex], undefined, popResult, this)];
	callObservers(oMeta, changes);

	return popResult;
}
