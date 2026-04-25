import { Change } from '../../model/change.ts';
import { UPDATE, oMetaKey } from '../../constants.ts';
import { callObservers } from '../processors/proc-utils.ts';

export default function proxiedTypedArraySet(source, offset) {
	const oMeta = this[oMetaKey];
	const target = oMeta.target;
	const souLen = source.length;
	offset = offset || 0;

	if (souLen > 0) {
		const prev = target.slice(offset, offset + souLen);
		target.set(source, offset);

		const changes = new Array(souLen);
		for (let i = 0; i < souLen; i++) {
			changes[i] = new Change(UPDATE, [offset + i], target[offset + i], prev[i], this);
		}
		callObservers(oMeta, changes);
	}
};
