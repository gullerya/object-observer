import { Change } from '../model/change.ts';

export type ValidatorFn = (changes: Change[]) => void;

export class Validator {
	static #privateCtorKey = Symbol('ValidatorPrivateConstructorKey');

	#validate: ValidatorFn;

	constructor(privateCtorKey, fn: ValidatorFn) {
		if (privateCtorKey !== Validator.#privateCtorKey) {
			throw new Error('Validator class cannot be instantiated directly; use provided factory methods');
		}

		this.#validate = fn;
	}

	get validate(): ValidatorFn { return this.#validate; }

	static custom(fn: ValidatorFn): Validator {
		if (typeof fn !== 'function') {
			throw new Error('custom Validator requires a function as argument');
		}
		return new Validator(Validator.#privateCtorKey, fn);
	}
}
