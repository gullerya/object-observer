import { Change } from '../../model/change.ts';
import { DELETE, oMetaKey } from '../../constants.ts';
import { callObservers } from '../processors/proc-utils.ts';

export default function proxiedPop() {
    const oMeta = this[oMetaKey];
    const target = oMeta.target;
    const poppedIndex = target.length - 1;

    let popResult = target.pop();
    if (popResult && typeof popResult === 'object') {
        const tmpObserved = popResult[oMetaKey];
        if (tmpObserved) {
            popResult = tmpObserved.detach();
        }
    }

    const changes = [new Change(DELETE, [poppedIndex], undefined, popResult, this)];
    callObservers(oMeta, changes);

    return popResult;
}