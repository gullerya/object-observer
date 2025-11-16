import { Change } from '../../structs/change.ts';
import { INSERT, oMetaKey } from '../../constants.ts';
import { callObservers, getObservedOf } from '../../object-observer.ts';

export default function proxiedUnshift(...unshiftItems: unknown[]) {
    const oMeta = this[oMetaKey];
    const target = oMeta.target;
    const unshiftLen = unshiftItems.length;
    const unshiftContent = new Array(unshiftLen);

    for (let i = 0; i < unshiftLen; i++) {
        unshiftContent[i] = getObservedOf(unshiftItems[i], i, oMeta);
    }
    const unshiftResult = Reflect.apply(target.unshift, target, unshiftContent);

    for (let i = 0, l = target.length, item; i < l; i++) {
        item = target[i];
        if (item && typeof item === 'object') {
            const tmpObserved = item[oMetaKey];
            if (tmpObserved) {
                tmpObserved.ownKey = i;
            }
        }
    }

    //	publish changes
    const l = unshiftContent.length;
    const changes = new Array(l);
    for (let i = 0; i < l; i++) {
        changes[i] = new Change(INSERT, [i], target[i], undefined, this);
    }
    callObservers(oMeta, changes);

    return unshiftResult;
};