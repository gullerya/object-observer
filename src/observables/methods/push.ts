import { Change } from '../../model/change.ts';
import { INSERT, oMetaKey } from '../../constants.ts';
import { callObservers, getObservedOf, runValidators } from '../processors/proc-utils.ts';

export default function proxiedPush(...pushItems: unknown[]) {
	const oMeta = this[oMetaKey];
	const target = oMeta.target;
	const pushLen = pushItems.length;
	const initialLength = target.length;

	const prospective = new Array(pushLen);
	for (let i = 0; i < pushLen; i++) {
		prospective[i] = new Change(INSERT, [initialLength + i], pushItems[i], undefined, this);
	}
	runValidators(oMeta, prospective);

	const pushContent = new Array(pushLen);
	for (let i = 0; i < pushLen; i++) {
		pushContent[i] = getObservedOf(pushItems[i], initialLength + i, oMeta);
	}
	const pushResult = Reflect.apply(target.push, target, pushContent);

	const changes = new Array(pushLen);
	for (let i = 0; i < pushLen; i++) {
		changes[i] = new Change(INSERT, [initialLength + i], target[initialLength + i], undefined, this);
	}
	callObservers(oMeta, changes);

	return pushResult;
};
