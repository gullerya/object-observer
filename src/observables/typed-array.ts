import { ObservableBase } from './abstract-base.ts';
import { oMetaKey } from '../constants.ts';
import proxiedCopyWithin from './methods/copy-within.ts';
import proxiedFill from './methods/fill.ts';
import proxiedReverse from './methods/reverse.ts';
import proxiedSort from './methods/sort.ts';
import proxiedTypedArraySet from './methods/typed-set.ts';

const proxiedTypedArrayMethods = {
    copyWithin: proxiedCopyWithin,
    fill: proxiedFill,
    reverse: proxiedReverse,
    sort: proxiedSort,
    set: proxiedTypedArraySet
};

export class ObservableTypedArray extends ObservableBase {

    get(taget: object, key: string): unknown {
        return proxiedTypedArrayMethods[key] || taget[key];
    }

    observedGraphProcessor(source: Array<unknown>, observableWrapper: ObservableBase): Array<unknown> {
        source[oMetaKey] = observableWrapper;
        return source;
    }
}