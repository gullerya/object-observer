import { Change } from '../../model/change.ts';
import { REVERSE, oMetaKey } from '../../constants.ts';
import { callObservers, reindexObservableChildren } from '../processors/proc-utils.ts';

export default function proxiedReverse() {
	const oMeta = this[oMetaKey];
	const target = oMeta.target;

	target.reverse();
	reindexObservableChildren(target);

	const changes = [new Change(REVERSE, [], undefined, undefined, this)];
	callObservers(oMeta, changes);

	return this;
};
