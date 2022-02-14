# `Observable` API

`Observable` API provides the whole life cycle of object observation functionality.

Additionally, this API defines the `Change` object, list of which being a parameter of an observer callback function.

> `object-observer` provides `Observable` top level object as a named import:
	```
	import { Observable } from 'object-observer.js'
	```

## Static methods

### `Observable.`__`from(input[, options])`__

- input is a _non-null object_; returns input's __clone__, decorated with an __`Observable`__ interface
    - clone is deep
    - nested objects are turned into `Observable` instances too
    - cloning performed only on __own enumerable__ properties, leaving a possibility to 'hide' some data from observation

- options is an _object_, optional; may include any of these:
	- `async`: _boolean_, defaults to `false`, controls the sync/async fashion of changes delivery; [details here](sync-async.md)
		> This flag will affect all observers of this `Observable`

```javascript
let person = {
        name: 'Aya',
        age: '1',
        address: {
            city: 'city',
            street: 'street'
        }
    },
    observablePerson;

observablePerson = Observable.from(person);
```

### `Observable.`__`isObservable(input)`__

- input is a _non-null object_; returns `true` if it stands for implementation of `Observable` API as it is defined here

```javascript
Observable.isObservable({});                            //  false
Observable.isObservable(observablePerson);              //  true
Observable.isObservable(observablePerson.address);      //  true
```

### `Observable.`__`observe(observable, callback[, options])`__
- `observable` MUST be an instance of `Observable` (see `from`)
- callback is a _function_, which will be added to the list of observers subscribed for a changes of this observable; changes delivered always as a never-null-nor-empty array of [__`Change`__](#change-instance-properties) objects; each change is a defined, non-null object, see `Change` definition below
- options is an _object_, optional

```javascript
function personUIObserver(changes) {
    changes.forEach(change => {
        console.log(change.type);
        console.log(change.path);
        console.log(change.value);
        console.log(change.oldValue);
    });
}
...
//  following the observablePerson example from above
Observable.observe(observablePerson, personUIObserver, options);    //  options is optional

const observableAddress = observablePerson.address;
Observable.observe(observableAddress, personUIObserver);            //  nested objects are observables too

observablePerson.address = {};                          			//  see below
```

> Attention! Observation set on the nested objects, like `address` in the example above, 'sticks' to that object. So if one replaces the nested object of the observable graph (see the last line of code above), observer callbacks __are NOT__ moved to the new object, they stick to the old one and continue to live there - think of detaching/replacing a sub-graph from the parent.

### `Observable.`__`unobserve([callback[, callback]+])`__
- `observable` MUST be an instance of `Observable` (see `from`)
- receives a _function/s_ which previously was/were registered as an observer/s and removes it/them. If _no arguments_ passed, all observers will be removed.

```javascript
Observable.unobserve(observablePerson, personUIObserver);
//  or
Observable.unobserve(observablePerson);

//  same applies to the nested
Observable.unobserve(observableAddress);
```

## Observation options
If/When provided, `options` parameter MUST contain ONLY one of the properties below, no 'unknown' properties allowed.

In order to fail-fast and prevent unexpected mess down the hill, incorrect observation options will throw.

- __`path`__ - non-empty string; specific path to observe, only a changes of this exact path will be notified; [details here](filter-paths.md)

- __`pathsOf`__ - string, MAY be empty; direct properties of the specified path will be notified; [details here](filter-paths.md)

- __`pathsFrom`__ - non-empty string, any changes from the specified path and deeper will be delivered to the observer; [details here](filter-paths.md)

## `Change` instance properties

- __`type`__        - one of the following: `insert`, `update`, `delete`, `shuffle` or `reverse`
- __`path`__        - path to the changed property represented as an __Array__ of nodes
- __`value`__       - new value; `undefined` in `delete`, `shuffle` and `reverse` changes
- __`oldValue`__    - old value; `undefined` in `insert`, `shuffle` or `reverse` changes
- __`object`__      - an immediate subject of change, property of which has been changed (ES6 module distro ONLY)