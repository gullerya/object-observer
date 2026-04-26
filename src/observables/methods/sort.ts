import { Change } from '../../model/change.ts';
import { SHUFFLE, oMetaKey } from '../../constants.ts';
import { callObservers, reindexObservableChildren, runValidators } from '../processors/proc-utils.ts';

export default function proxiedSort(comparator) {
	const oMeta = this[oMetaKey];
	const target = oMeta.target;

	const changes = [new Change(SHUFFLE, [], undefined, undefined, this)];
	runValidators(oMeta, changes);

	target.sort(comparator);
	reindexObservableChildren(target);

	callObservers(oMeta, changes);

	return this;
};
