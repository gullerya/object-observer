export type ChangeType = 'insert' | 'update' | 'delete' | 'reverse' | 'shuffle';

/**
 * `Observable` allows to observe any (deep) changes on its underlying object graph
 * 
 * - created by `from` static method, via cloning the target
 * - important: the type `T` is not preserved, beside its shape
 */
export abstract class Observable {

	/**
	 * create Observable from the target
	 * - target is cloned, remaining unchanged in itself
	 * - important: the type `T` is NOT preserved, beside its shape
	 *
	 * @param target source, to create `Observable` from
	 * @param options observable options
	 */
	static from<T>(target: T, options?: ObservableOptions): Observable & T;

	/**
	 * check input for being `Observable`
	 * 
	 * @param input any object to be checked as `Observable`
	 */
	static isObservable(input: unknown): boolean;

	/**
	 * add observer to handle the observable's changes
	 * 
	 * @param observable observable to set observer on
	 * @param observer observer function / logic
	 * @param options observation options
	 */
	static observe(observable: Observable, observer: Observer, options?: ObserverOptions): void;

	/**
	 * remove observer/s from observable
	 * 
	 * @param observable observable to remove observer/s from
	 * @param observers 0 to many observers to remove; if none supplied, ALL observers will be removed
	 */
	static unobserve(observable: Observable, ...observers: Observer[]): void;
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
