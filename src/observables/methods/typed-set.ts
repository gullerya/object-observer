import { Change } from '../../structs/change.ts';
import { UPDATE, oMetaKey } from '../../constants.ts';
import { callObservers } from '../../object-observer.ts';

export default function proxiedTypedArraySet(source, offset) {
    const oMeta = this[oMetaKey];
    const target = oMeta.target;
    const souLen = source.length;
    const prev = target.slice(0);
    offset = offset || 0;

    target.set(source, offset);
    const changes = new Array(souLen);
    for (let i = offset; i < (souLen + offset); i++) {
        changes[i - offset] = new Change(UPDATE, [i], target[i], prev[i], this);
    }

    callObservers(oMeta, changes);
};