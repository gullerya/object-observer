# `Observable` API

`Observable` interface defines the APIs for the whole life cycle of object observation functionality.

| static methods | instance methods |
|----------------|------------------|
| `from`         | `observe`        |
|                | `unobserve`      |
|                | `revoke`         |


#### Static methods

- __`from`__ - receives a _non-null object_ and returns its __clone__, decorated with an __`Observable`__ interface, effectively returning `Observable` instance.
```javascript
let person = { name: 'Aya', age: '1' },
    observablePerson;

observablePerson = Observable.from(person);
```
Clone is deep. Cloning performed only on __own enumerable__ properties, leaving a possibility to 'hide' some data from the library.

#### Instance methods

- __`observe`__ - receives a _function_, which will be added to the list of observers subscribed for a changes of this observable.
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
observablePerson = Observable.from(person);
observablePerson.observe(personUIObserver);
```
Changes delivered always as a never-null-nor-empty array of [__`Change`__](#change-instance-properties) objects.
Each change is a defined, non-null object, see `Change` definition below.

- __`unobserve`__ - receives a _function/s_ which previously was/were registered as an observer/s and removes it/them. If _no arguments_ passed, all observers will be removed.
```javascript
observablePerson.unobserve(personUIObserver);
//  or
observablePerson.unobserve();
```

- __`revoke`__ - parameterless. All of the proxies along the observed graph will be revoked and thus become unusable. `observe` and `unobserve` methods will mimic the revoked `Proxy` behaviour and throw `TypeError` if used on the revoked `Observable`. Subsequent `revoke` invocations will have no effect.
```javascript
observablePerson.revoke();
```

#### `Change` instance properties

- __`type`__ - one of the following: `insert`, `update`, `delete`, `shuffle` or `reverse`
- __`path`__ - path to the changed property represented as an __Array__ of nodes (see examples below)
- __`value`__ - new value; not available in `delete`, `shuffle` and `reverse` changes
- __`oldValue`__ - old value; not available in `insert`, `shuffle` or `reverse` changes
