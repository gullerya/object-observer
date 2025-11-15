import { ObservableBase } from './abstract-base.js';
import { getObservedOf } from '../object-observer.js';
import { oMetaKey } from '../constants.js';

export class ObservableObject extends ObservableBase {

    observedGraphProcessor(source: object, observableWrapper: ObservableBase, visited: Set<unknown>): object {
        const target = {};
        target[oMetaKey] = observableWrapper;
        for (const key in source) {
            target[key] = getObservedOf(source[key], key, observableWrapper, visited);
        }
        return target;
    }
}