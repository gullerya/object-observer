import { Change } from '../model/change.ts';
import { REVERSE, SHUFFLE } from '../constants.ts';

export type FilterFn = (changes: Change[]) => Change[];

export class Filter {
	static #privateCtorKey = Symbol('FilterPrivateConstructorKey');
	#fn: FilterFn;

	constructor(privateCtorKey, fn: FilterFn) {
		if (privateCtorKey !== Filter.#privateCtorKey) {
			throw new Error('Filter class cannot be instantiated directly; use provided factory methods');
		}

		this.#fn = fn;
	}

	get fn(): FilterFn { return this.#fn; }

	static custom(fn: FilterFn): Filter {
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

	//	direct children of the given path; an empty string represents the root.
	//	REVERSE/SHUFFLE happening at the path itself are also included
	//	(they are semantically mutations of the container's direct children).
	static directChildrenOf(path: string): Filter {
		if (typeof path !== 'string') {
			throw new Error('directChildrenOf Filter requires a string as argument (MAY be empty)');
		}
		const segments = path.split('.').filter(Boolean);
		const depth = segments.length;
		const prefix = segments.join('.');
		//	at depth N, a direct-child path is the first N segments of change.path
		return new Filter(
			Filter.#privateCtorKey,
			changes => changes.filter(change => {
				const cp = change.path;
				const pl = cp.length;
				if (pl === depth + 1) {
					for (let i = 0; i < depth; i++) {
						if (cp[i] !== segments[i]) { return false; }
					}
					return true;
				}
				if (pl === depth && (change.type === REVERSE || change.type === SHUFFLE)) {
					return change.pathAsString === prefix;
				}
				return false;
			})
		);
	}
}