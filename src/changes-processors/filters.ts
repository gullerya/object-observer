import { REVERSE, SHUFFLE } from '../constants';
import type { Change } from '../structs/change.ts';

export class Filter {
    static #privateCtorKey = Symbol('FilterPrivateConstructorKey');
    #fn: (changes: Change[]) => void;

    constructor(privateCtorKey, fn: (changes: Change[]) => void) {
        if (privateCtorKey !== Filter.#privateCtorKey) {
            throw new Error('Filter class cannot be instantiated directly; use provided factory methods');
        }

        this.#fn = fn;
    }

    get fn(): (changes: Change[]) => void { return this.#fn; }

    static custom(fn: (changes: Change[]) => void): Filter {
        if (typeof fn !== 'function') {
            throw new Error('custom Filter requires a function as argument');
        }
        return new Filter(Filter.#privateCtorKey, fn);
    }

    static byExactPath(path: string): Filter {
        if (typeof path !== 'string' || path === '') {
            throw new Error('byExactPath Filter requires a non-empty string as argument');
        }
        return new Filter(
            Filter.#privateCtorKey,
            changes => changes.filter(change => change.path.join('.') === path)
        );
    }

    static includeChildrenOfPath(parentPath: Array<string | number>): Filter {
        if (!Array.isArray(parentPath) || parentPath.length === 0) {
            throw new Error('includeChildrenOfPath Filter requires a non-empty array as argument');
        }
        const pathsOfStr = parentPath.join('.');
        const pathsOfLength = parentPath.length;
        return new Filter(
            Filter.#privateCtorKey,
            changes => changes.filter(change =>
                (change.path.length === pathsOfLength + 1 ||
                    (change.path.length === pathsOfLength && (change.type === REVERSE || change.type === SHUFFLE))) &&
                change.path.join('.').startsWith(pathsOfStr)
            )
        );
    }

    static includePathsStartingFrom(prefix: string): Filter {
        if (typeof prefix !== 'string' || prefix === '') {
            throw new Error('includePathsStartingFrom Filter requires a non-empty string as argument');
        }
        return new Filter(
            Filter.#privateCtorKey,
            changes => changes.filter(change => change.path.join('.').startsWith(prefix))
        );
    }
}