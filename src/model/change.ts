export class Change {
    #type: string;
    #path: Array<string | symbol | number>;
    #value: unknown;
    #oldValue: unknown;
    #object: object;

    #pathAsString: string;

    constructor(type: string, path: Array<string | symbol | number>, value: unknown, oldValue: unknown, object: object) {
        if (typeof type !== 'string' || type === '') {
            throw new Error('Change type must be a non-empty string');
        }
        if (!Array.isArray(path)) {
            throw new Error('Change path must be an array');
        }

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

    /**
     * lazily computed string representation of the path
     */
    get pathAsString(): string {
        if (this.#pathAsString === undefined && Array.isArray(this.#path)) {
            this.#pathAsString = this.#path.join('.');
        }
        return this.#pathAsString;
    }
}