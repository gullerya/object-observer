import { ObservableBase } from './abstract-base.js';
import { getObservedOf } from '../object-observer.js';
import { oMetaKey } from '../constants.js';
import proxiedCopyWithin from './methods/copy-within.js';
import proxiedFill from './methods/fill.js';
import proxiedPop from './methods/pop.js';
import proxiedPush from './methods/push.js';
import proxiedReverse from './methods/reverse.js';
import proxiedShift from './methods/shift.js';
import proxiedSort from './methods/sort.js';
import proxiedSplice from './methods/splice.js';
import proxiedUnshift from './methods/unshift.js';

const proxiedArrayMethods = {
    copyWithin: proxiedCopyWithin,
    fill: proxiedFill,
    pop: proxiedPop,
    push: proxiedPush,
    reverse: proxiedReverse,
    shift: proxiedShift,
    sort: proxiedSort,
    splice: proxiedSplice,
    unshift: proxiedUnshift
};

export class ObservableArray extends ObservableBase {

    get(target: object, key: string): unknown {
        return proxiedArrayMethods[key] || target[key];
    }

    observedGraphProcessor(source: Array<unknown>, observableWrapper: ObservableBase, visited: Set<unknown>): Array<unknown> {
        const arrayLength = source.length;
        const target = new Array(arrayLength);
        target[oMetaKey] = observableWrapper;
        for (let i = 0; i < arrayLength; i++) {
            target[i] = getObservedOf(source[i], i, observableWrapper, visited);
        }
        return target;
    }
}