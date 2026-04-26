import { Change } from '../../model/change.ts';
import { INSERT, DELETE, UPDATE, oMetaKey } from '../../constants.ts';
import { callObservers, detachIfObservable, getObservedOf, reindexObservableChildren } from '../processors/proc-utils.ts';

export default function proxiedSplice(...spliceItems: unknown[]) {
	const oMeta = this[oMetaKey];
	const target = oMeta.target;
	const splLen = spliceItems.length;
	const spliceContent = new Array(splLen);
	const tarLen = target.length;

	//	observify the newcomers
	for (let i = 0; i < splLen; i++) {
		spliceContent[i] = getObservedOf(spliceItems[i], i, oMeta);
	}

	//	calculate pointers
	const startIndex = splLen === 0 ? 0 : (spliceContent[0] < 0 ? tarLen + spliceContent[0] : spliceContent[0]);
	const removed = splLen < 2 ? tarLen - startIndex : spliceContent[1];
	const inserted = Math.max(splLen - 2, 0);
	const spliceResult: unknown[] = Reflect.apply(target.splice, target, spliceContent);

	reindexObservableChildren(target);

	//	detach removed objects
	for (let i = 0, l = spliceResult.length; i < l; i++) {
		spliceResult[i] = detachIfObservable(spliceResult[i]);
	}

	const changes = [];
	let index;
	for (index = 0; index < removed; index++) {
		if (index < inserted) {
			changes.push(new Change(UPDATE, [startIndex + index], target[startIndex + index], spliceResult[index], this));
		} else {
			changes.push(new Change(DELETE, [startIndex + index], undefined, spliceResult[index], this));
		}
	}
	for (; index < inserted; index++) {
		changes.push(new Change(INSERT, [startIndex + index], target[startIndex + index], undefined, this));
	}
	callObservers(oMeta, changes);

	return spliceResult;
};
