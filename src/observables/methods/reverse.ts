import { Change } from '../../model/change.ts';
import { REVERSE, oMetaKey } from '../../constants.ts';
import { callObservers, reindexObservableChildren, runValidators } from '../processors/proc-utils.ts';

export default function proxiedReverse() {
	const oMeta = this[oMetaKey];
	const target = oMeta.target;

	const changes = [new Change(REVERSE, [], undefined, undefined, this)];
	runValidators(oMeta, changes);

	target.reverse();
	reindexObservableChildren(target);

	callObservers(oMeta, changes);

	return this;
};
