export class Change {
    #type: string;
    #path: Array<string | symbol | number>;
    #value: unknown;
    #oldValue: unknown;
    #object: object;

    constructor(type: string, path: Array<string | symbol | number>, value: unknown, oldValue: unknown, object: object) {
        this.#type = type;
        this.#path = path;
        this.#value = value;
        this.#oldValue = oldValue;
        this.#object = object;
    }

    get type() {
        return this.#type;
    }

    get path() {
        return this.#path;
    }

    get value() {
        return this.#value;
    }

    get oldValue() {
        return this.#oldValue;
    }

    get object() {
        return this.#object;
    }
}