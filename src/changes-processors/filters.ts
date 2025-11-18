import { Change } from '../model/change.ts';

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

    static exactPaths(paths: string[]): Filter {
        if (!Array.isArray(paths) || paths.length === 0) {
            throw new Error('exactPaths Filter requires a non-empty array as argument');
        }

        const pathsSet = new Set(paths);
        return new Filter(
            Filter.#privateCtorKey,
            changes => changes.filter(change => pathsSet.has(change.pathAsString))
        );
    }

    static pathsStartWith(prefix: string): Filter {
        if (typeof prefix !== 'string' || prefix === '') {
            throw new Error('pathsStartWith Filter requires a non-empty string as argument');
        }
        return new Filter(
            Filter.#privateCtorKey,
            changes => changes.filter(change => change.pathAsString.startsWith(prefix))
        );
    }
}