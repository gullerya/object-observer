import { Change } from '../../model/change.ts';
import { DELETE, oMetaKey } from '../../constants.ts';
import { callObservers, detachIfObservable } from '../processors/proc-utils.ts';

export default function proxiedPop() {
	const oMeta = this[oMetaKey];
	const target = oMeta.target;
	const poppedIndex = target.length - 1;

	const popResult = detachIfObservable(target.pop());

	const changes = [new Change(DELETE, [poppedIndex], undefined, popResult, this)];
	callObservers(oMeta, changes);

	return popResult;
}
