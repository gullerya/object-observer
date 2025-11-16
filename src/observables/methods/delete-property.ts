import { Change } from '../../structs/change.ts';
import { DELETE } from '../../constants.ts';
import { oMetaKey } from '../../constants.ts';
import { callObservers } from '../../object-observer.ts';

export function proxiedDeleteProperty(target: object, key: string | symbol): boolean {
    let oldValue = target[key];

    delete target[key];

    if (oldValue && typeof oldValue === 'object') {
        const tmpObserved = oldValue[oMetaKey];
        if (tmpObserved) {
            oldValue = tmpObserved.detach();
        }
    }

    const changes = [new Change(DELETE, [key], undefined, oldValue, this.proxy)];
    callObservers(this, changes);

    return true;
};