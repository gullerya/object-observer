import { Change } from '../../model/change.ts';
import { INSERT, UPDATE } from '../../constants.ts';
import { oMetaKey } from '../../constants.ts';
import { callObservers, getObservedOf } from '../../object-observer.ts';

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