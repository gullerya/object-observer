import { Change } from '../../model/change.ts';
import { INSERT, oMetaKey } from '../../constants.ts';
import { callObservers, getObservedOf, reindexObservableChildren } from '../processors/proc-utils.ts';

export default function proxiedUnshift(...unshiftItems: unknown[]) {
	const oMeta = this[oMetaKey];
	const target = oMeta.target;
	const unshiftLen = unshiftItems.length;
	const unshiftContent = new Array(unshiftLen);

	for (let i = 0; i < unshiftLen; i++) {
		unshiftContent[i] = getObservedOf(unshiftItems[i], i, oMeta);
	}
	const unshiftResult = Reflect.apply(target.unshift, target, unshiftContent);

	reindexObservableChildren(target);

	//	publish changes
	const changes = new Array(unshiftLen);
	for (let i = 0; i < unshiftLen; i++) {
		changes[i] = new Change(INSERT, [i], target[i], undefined, this);
	}
	callObservers(oMeta, changes);

	return unshiftResult;
};
