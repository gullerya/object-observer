export enum ChangeType {
	INSERT = 'insert',
	UPDATE = 'update',
	DELETE = 'delete',
	REVERSE = 'reverse',
	SHUFFLE = 'shuffle'
}

/**
 * Observable allows to observe any (deep) changes on it's underlying object graph
 */
export abstract class Observable {

	/**
	 * create Observable from the target
	 * - target is cloned, remaining unchange on itself
	 */
	static from: (target: object, options?: ObservableOptions) => Observable;

	static isObservable: (input: object) => boolean;

	observe: (observer: Observer, options?: ObserverOptions) => void;

	unobserve: (...observer: Observer[]) => void;
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
 * ObjectObserver provides observation functionality in a WebAPI-like flavor
 */
export class ObjectObserver {

	constructor(observer: Observer);

	observe(target: object, options: ObserverOptions): Observable;

	unobserve(target: object): void;

	disconnect(): void;
}
