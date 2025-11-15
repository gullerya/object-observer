import { Change } from '../../structs/change.js';
import { DELETE } from '../../constants.js';
import { oMetaKey } from '../../constants.js';
import { callObservers } from '../../object-observer.js';

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