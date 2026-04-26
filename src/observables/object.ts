import { ObservableBase } from './abstract-base.ts';
import { getObservedOf } from './processors/proc-utils.ts';
import { oMetaKey } from '../constants.ts';

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