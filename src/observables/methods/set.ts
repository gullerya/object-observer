import { Change } from '../../structs/change.js';
import { INSERT, UPDATE } from '../../constants.js';
import { oMetaKey } from '../../constants.js';
import { callObservers, getObservedOf } from '../../object-observer.js';

export function proxiedSet(target: object, key: string | symbol, value: unknown): boolean {
    let oldValue = target[key];

    if (value !== oldValue) {
        const newValue = getObservedOf(value, key, this);
        target[key] = newValue;

        if (oldValue && typeof oldValue === 'object') {
            const tmpObserved = oldValue[oMetaKey];
            if (tmpObserved) {
                oldValue = tmpObserved.detach();
            }
        }

        const changes = oldValue === undefined
            ? [new Change(INSERT, [key], newValue, undefined, this.proxy)]
            : [new Change(UPDATE, [key], newValue, oldValue, this.proxy)];
        callObservers(this, changes);
    }

    return true;
};