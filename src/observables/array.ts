import { ObservableBase } from './abstract-base.ts';
import { getObservedOf } from './processors/proc-utils.ts';
import { oMetaKey } from '../constants.ts';
import proxiedCopyWithin from './methods/copy-within.ts';
import proxiedFill from './methods/fill.ts';
import proxiedPop from './methods/pop.ts';
import proxiedPush from './methods/push.ts';
import proxiedReverse from './methods/reverse.ts';
import proxiedShift from './methods/shift.ts';
import proxiedSort from './methods/sort.ts';
import proxiedSplice from './methods/splice.ts';
import proxiedUnshift from './methods/unshift.ts';

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
        for (let i = 0; i < arrayLength; i++) {
            target[i] = getObservedOf(source[i], i, observableWrapper, visited);
        }
        target[oMetaKey] = observableWrapper;
        return target;
    }
}