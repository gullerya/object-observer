import { Change } from '../model/change.ts';
import { Validator } from '../changes-processors/validators.ts';
import { proxiedDeleteProperty } from './methods/delete-property.ts';
import { proxiedSet } from './methods/set.ts';

const validObservableOptionKeys = { async: 1, validators: 1 };

export interface ObservableOptions {
    async?: boolean;
    validators?: Array<Validator>;
}
export type ChangesProcessor = (changes: Change[]) => void;

export abstract class ObservableBase implements ProxyHandler<object> {
    #parent: ObservableBase | null;
    ownKey: string | null;
    #target: object;
    #proxy: unknown;
    // eslint-disable-next-line no-unused-private-class-members
    #revoke: () => void;
    #async: boolean = false;
    batches = new Map<ChangesProcessor, Change[]>();

    set;
    deleteProperty;

    #validators: Array<Validator> = [];
    #observers: Array<ChangesProcessor> = [];

    constructor(properties) {
        this.set = proxiedSet;
        this.deleteProperty = proxiedDeleteProperty;

        const { target, parent, ownKey, options, visited = new Set() } = properties;
        if (parent && ownKey !== undefined) {
            this.#parent = parent;
            this.ownKey = ownKey;
        } else {
            this.#parent = null;
            this.ownKey = null;
        }
        visited.add(target);
        this.#target = this.observedGraphProcessor(target, this, visited);
        visited.delete(target);

        const revocableProxy = Proxy.revocable(this.#target, this);
        this.#proxy = revocableProxy.proxy;
        this.#revoke = revocableProxy.revoke;
        this.#processOptions(options);
    }

    detach() {
        this.#parent = null;
        return this.#target;
    }

    get parent(): ObservableBase | null { return this.#parent; }
    get target(): object { return this.#target; }
    get proxy(): unknown { return this.#proxy; }
    get async(): boolean { return this.#async; }
    get validators(): Array<Validator> { return this.#validators; }
    get observers(): Array<ChangesProcessor> { return this.#observers; }

    abstract observedGraphProcessor(source: object, observableWrapper: ObservableBase, visited: Set<unknown>): object;

    #processOptions(options: ObservableOptions | undefined): void {
        if (!options) {
            return;
        }

        if (typeof options !== 'object') {
            throw new Error(`Observable options if/when provided, MAY only be an object, got '${options}'`);
        }
        const invalidOptions = Object.keys(options).filter(option => !(option in validObservableOptionKeys));
        if (invalidOptions.length) {
            throw new Error(`'${invalidOptions.join(', ')}' is/are not a valid Observable option/s`);
        }

        this.#async = Boolean(options.async);

        if (options.validators !== undefined) {
            if (!Array.isArray(options.validators) || options.validators.length === 0) {
                throw new Error('"validators" option, if/when provided, MUST be a non-empty array of Validator instances');
            }
            for (const v of options.validators) {
                if (!(v instanceof Validator)) {
                    throw new Error('"validators" option, if/when provided, MUST be a non-empty array of Validator instances');
                }
            }
            this.#validators.push(...options.validators);
        }
    }
}