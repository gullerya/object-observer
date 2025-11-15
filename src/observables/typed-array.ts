import { ObservableBase } from './abstract-base.js';
import { oMetaKey } from '../constants.js';
import proxiedCopyWithin from './methods/copy-within.js';
import proxiedFill from './methods/fill.js';
import proxiedReverse from './methods/reverse.js';
import proxiedSort from './methods/sort.js';
import proxiedTypedArraySet from './methods/typed-set.js';

const proxiedTypedArrayMethods = {
    copyWithin: proxiedCopyWithin,
    fill: proxiedFill,
    reverse: proxiedReverse,
    sort: proxiedSort,
    set: proxiedTypedArraySet
};

export class ObservableTypedArray extends ObservableBase {

    get(target, key) {
        return proxiedTypedArrayMethods[key] || target[key];
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    observedGraphProcessor(source: Array<unknown>, observableWrapper: ObservableBase, visited: Set<unknown>): Array<unknown> {
        source[oMetaKey] = observableWrapper;
        return source;
    }
}