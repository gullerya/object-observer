import { Change } from '../../model/change.ts';
import { INSERT, oMetaKey } from '../../constants.ts';
import { callObservers, getObservedOf, reindexObservableChildren, runValidators } from '../processors/proc-utils.ts';

export default function proxiedUnshift(...unshiftItems: unknown[]) {
	const oMeta = this[oMetaKey];
	const target = oMeta.target;
	const unshiftLen = unshiftItems.length;

	const prospective = new Array(unshiftLen);
	for (let i = 0; i < unshiftLen; i++) {
		prospective[i] = new Change(INSERT, [i], unshiftItems[i], undefined, this);
	}
	runValidators(oMeta, prospective);

	const unshiftContent = new Array(unshiftLen);
	for (let i = 0; i < unshiftLen; i++) {
		unshiftContent[i] = getObservedOf(unshiftItems[i], i, oMeta);
	}
	const unshiftResult = Reflect.apply(target.unshift, target, unshiftContent);

	reindexObservableChildren(target);

	const changes = new Array(unshiftLen);
	for (let i = 0; i < unshiftLen; i++) {
		changes[i] = new Change(INSERT, [i], target[i], undefined, this);
	}
	callObservers(oMeta, changes);

	return unshiftResult;
};
