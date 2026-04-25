import { Change } from '../../model/change.ts';
import { SHUFFLE, oMetaKey } from '../../constants.ts';
import { callObservers, reindexObservableChildren } from '../processors/proc-utils.ts';

export default function proxiedSort(comparator) {
	const oMeta = this[oMetaKey];
	const target = oMeta.target;

	target.sort(comparator);
	reindexObservableChildren(target);

	const changes = [new Change(SHUFFLE, [], undefined, undefined, this)];
	callObservers(oMeta, changes);

	return this;
};
