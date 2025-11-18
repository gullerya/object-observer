import { Change } from '../../model/change.ts';
import { DELETE, oMetaKey } from '../../constants.ts';
import { callObservers } from '../processors/proc-utils.ts';

export default function proxiedShift() {
    const
        oMeta = this[oMetaKey],
        target = oMeta.target;
    let shiftResult, i, l, item, tmpObserved;

    shiftResult = target.shift();
    if (shiftResult && typeof shiftResult === 'object') {
        tmpObserved = shiftResult[oMetaKey];
        if (tmpObserved) {
            shiftResult = tmpObserved.detach();
        }
    }

    //	update indices of the remaining items
    for (i = 0, l = target.length; i < l; i++) {
        item = target[i];
        if (item && typeof item === 'object') {
            tmpObserved = item[oMetaKey];
            if (tmpObserved) {
                tmpObserved.ownKey = i;
            }
        }
    }

    const changes = [new Change(DELETE, [0], undefined, shiftResult, this)];
    callObservers(oMeta, changes);

    return shiftResult;
};