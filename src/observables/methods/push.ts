import { Change } from '../../structs/change.ts';
import { INSERT, oMetaKey } from '../../constants.ts';
import { callObservers, getObservedOf } from '../../object-observer.ts';

export default function proxiedPush(...pushItems: unknown[]) {
    const oMeta = this[oMetaKey];
    const target = oMeta.target;
    const pushLen = pushItems.length;
    const pushContent = new Array(pushLen);
    const initialLength = target.length;

    for (let i = 0; i < pushLen; i++) {
        pushContent[i] = getObservedOf(pushItems[i], initialLength + i, oMeta);
    }
    const pushResult = Reflect.apply(target.push, target, pushContent);

    const changes = [];
    for (let i = initialLength, j = target.length; i < j; i++) {
        changes[i - initialLength] = new Change(INSERT, [i], target[i], undefined, this);
    }
    callObservers(oMeta, changes);

    return pushResult;
};