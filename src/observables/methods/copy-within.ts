import { Change } from '../../structs/change.ts';
import { UPDATE, oMetaKey } from '../../constants.ts';
import { callObservers, getObservedOf } from '../../object-observer.ts';

export default function proxiedCopyWithin(dest, start, end) {
    const oMeta = this[oMetaKey];
    const target = oMeta.target;
    const tarLen = target.length;
    dest = dest < 0 ? Math.max(tarLen + dest, 0) : dest;
    start = start === undefined ? 0 : (start < 0 ? Math.max(tarLen + start, 0) : Math.min(start, tarLen));
    end = end === undefined ? tarLen : (end < 0 ? Math.max(tarLen + end, 0) : Math.min(end, tarLen));
    const len = Math.min(end - start, tarLen - dest);

    if (dest < tarLen && dest !== start && len > 0) {
        const
            prev = target.slice(0),
            changes = [];

        target.copyWithin(dest, start, end);

        for (let i = dest, nItem, oItem, tmpObserved; i < dest + len; i++) {
            //	update newly placed observables, if any
            nItem = target[i];
            if (nItem && typeof nItem === 'object') {
                nItem = getObservedOf(nItem, i, oMeta);
                target[i] = nItem;
            }

            //	detach overridden observables, if any
            oItem = prev[i];
            if (oItem && typeof oItem === 'object') {
                tmpObserved = oItem[oMetaKey];
                if (tmpObserved) {
                    oItem = tmpObserved.detach();
                }
            }

            if (typeof nItem !== 'object' && nItem === oItem) {
                continue;
            }
            changes.push(new Change(UPDATE, [i], nItem, oItem, this));
        }

        callObservers(oMeta, changes);
    }

    return this;
};