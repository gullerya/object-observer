export type ChangeType = 'insert' | 'update' | 'delete' | 'reverse' | 'shuffle';

/**
 * `Observable` allows to observe any (deep) changes on its underlying object graph
 * - created by `from` static method, via cloning the target and enhancing it with own methods
 * - important: the type `T` is not preserved, beside its shape
 */
export abstract class Observable {

	/**
	 * create Observable from the target
	 * - target is cloned, remaining unchanged in itself
	 * - important: the type `T` is NOT preserved, beside its shape
	 */
	static from<T>(target: T, options?: ObservableOptions): Observable & T;

	/**
	 * test an input for being `Observable`
	 * @param input any object to be verified as `Observable`
	 */
	static isObservable(input: unknown): boolean;

	abstract observe(observer: Observer, options?: ObserverOptions): void;

	abstract unobserve(...observer: Observer[]): void;
}

export interface ObservableOptions {
	async: boolean;
}

export interface Observer {
	(changes: Change[]): void;
}

export interface ObserverOptions {
	path?: string,
	pathsOf?: string,
	pathsFrom?: string
}

export interface Change {
	type: ChangeType;
	path: string[];
	value?: any;
	oldValue?: any;
	object: object;
}

/**
 * `ObjectObserver` provides observation functionality in a WebAPI-like flavor
 * - `observer` created first, with the provided observer function
 * - `observer` may then be used to observe different targets
 */
export class ObjectObserver {

	/**
	 * sets up observer function and options
	 * @param observer observation logic (function)
	 * @param options  `ObservableOptions` will be applied to any `Observable` down the road
	 */
	constructor(observer: Observer, options?: ObservableOptions);

	/**
	 * create `Observable` from the target and starts observation
	 * - important: the type `T` is NOT preserved, beside its shape
	 * @param target  target to be observed, turned into `Observable` via cloning
	 * @param options `ObserverOptions` options
	 */
	observe<T>(target: T, options?: ObserverOptions): Observable & T;

	/**
	 * un-observes the `Observable`, returning the original undelying plain object
	 * @param target target to be un-observed
	 */
	unobserve(target: Observable): void;

	disconnect(): void;
}
