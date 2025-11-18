import { Change } from '../model/change.ts';
import { proxiedDeleteProperty } from './methods/delete-property.ts';
import { proxiedSet } from './methods/set.ts';

const validObservableOptionKeys = { async: 1, verifiers: 1 };

export interface ObservableOptions {
    async?: boolean;
    verifiers?: Array<ChangesProcessor>;
}
export type ChangesProcessor = (changes: Change[]) => void;

export class ObservableBase implements ProxyHandler<object> {
    #parent: ObservableBase | null;
    ownKey: string | null;
    #target: object;
    #proxy: unknown;
    // eslint-disable-next-line no-unused-private-class-members
    #revoke: () => void;
    #async: boolean = false;
    batches = [];

    set;
    deleteProperty;

    #verifiers: Array<ChangesProcessor> = [];
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
        // this.#revoke();
        return this.#target;
    }

    get parent(): ObservableBase | null { return this.#parent; }
    get target(): object { return this.#target; }
    get proxy(): unknown { return this.#proxy; }
    get async(): boolean { return this.#async; }
    get verifiers(): Array<ChangesProcessor> { return this.#verifiers; }
    get observers(): Array<ChangesProcessor> { return this.#observers; }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    observedGraphProcessor(source: object, observableWrapper: ObservableBase, visited: Set<unknown>): object {
        throw new Error('observedGraphProcessor MUST be implemented in derived classes');
    }

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

        if (Array.isArray(options.verifiers)) {
            this.#verifiers.push(...options.verifiers);
        }
    }
}