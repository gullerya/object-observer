import { Change } from '../../model/change.ts';
import { INSERT, UPDATE, oMetaKey } from '../../constants.ts';
import { callObservers, getObservedOf } from '../../object-observer.ts';

export default function proxiedFill(filVal, start, end) {
    const oMeta = this[oMetaKey];
    const target = oMeta.target;
    const changes = [];
    const tarLen = target.length;
    const prev = target.slice(0);
    start = start === undefined ? 0 : (start < 0 ? Math.max(tarLen + start, 0) : Math.min(start, tarLen));
    end = end === undefined ? tarLen : (end < 0 ? Math.max(tarLen + end, 0) : Math.min(end, tarLen));

    if (start < tarLen && end > start) {
        target.fill(filVal, start, end);

        let tmpObserved;
        for (let i = start, item, tmpTarget; i < end; i++) {
            item = target[i];
            target[i] = getObservedOf(item, i, oMeta);
            if (i in prev) {
                tmpTarget = prev[i];
                if (tmpTarget && typeof tmpTarget === 'object') {
                    tmpObserved = tmpTarget[oMetaKey];
                    if (tmpObserved) {
                        tmpTarget = tmpObserved.detach();
                    }
                }

                changes.push(new Change(UPDATE, [i], target[i], tmpTarget, this));
            } else {
                changes.push(new Change(INSERT, [i], target[i], undefined, this));
            }
        }

        callObservers(oMeta, changes);
    }

    return this;
};