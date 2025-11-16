import { Change } from '../../structs/change.ts';
import { REVERSE, oMetaKey } from '../../constants.ts';
import { callObservers } from '../../object-observer.ts';

export default function proxiedReverse() {
    const oMeta = this[oMetaKey];
    const target = oMeta.target;
    let i, l, item;

    target.reverse();
    for (i = 0, l = target.length; i < l; i++) {
        item = target[i];
        if (item && typeof item === 'object') {
            const tmpObserved = item[oMetaKey];
            if (tmpObserved) {
                tmpObserved.ownKey = i;
            }
        }
    }

    const changes = [new Change(REVERSE, [], undefined, undefined, this)];
    callObservers(oMeta, changes);

    return this;
};