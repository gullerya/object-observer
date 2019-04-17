# `Observable` API

`Observable` interface defines the APIs for the whole life cycle of object observation functionality.

| static methods | instance methods |
|----------------|------------------|
| `from`         | `observe`        |
| `isObservable` | `unobserve`      |
|                | `revoke`         |

Additionally, this API defines the `Change` object, list of which being a parameter of an observer/listener callback function.

## Static methods

* __`from(input)`__ - receives a _non-null object_ and returns its __clone__, decorated with an __`Observable`__ interface, effectively returning `Observable` instance.
Clone is deep. Cloning performed only on __own enumerable__ properties, leaving a possibility to 'hide' some data from observation.
```javascript
let person = { name: 'Aya', age: '1' },
    observablePerson;

observablePerson = Observable.from(person);
```

* __`isObservable(input)`__ - receives a _non-null object_ and returns `true` if it stands for implementation of `Observable` API as it is defined here.
Validation is done by the 'duck-typing' method.
```javascript
Observable.isObservable({});                    //  false

Observable.isObservable(observablePerson);      //  true

Observable.isObservable({
    revoke: function() {},
    observe: function() {},
    unobserve: function() {}
});                                             //  true... yes, nothing smart here
```

## Instance methods

* __`observe`__
    - receives a _function_, which will be added to the list of observers subscribed for a changes of this observable.
Changes delivered always as a never-null-nor-empty array of [__`Change`__](#change-instance-properties) objects.
Each change is a defined, non-null object, see `Change` definition below.
    - receives an options _object_, optional.
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
observablePerson.observe(personUIObserver, options);        //  options is optional
```

* __`unobserve`__ - receives a _function/s_ which previously was/were registered as an observer/s and removes it/them. If _no arguments_ passed, all observers will be removed.
```javascript
observablePerson.unobserve(personUIObserver);
//  or
observablePerson.unobserve();
```

* __`revoke`__ - parameterless. All of the proxies along the observed graph will be revoked and thus become unusable. `observe` and `unobserve` methods will mimic the revoked `Proxy` behaviour and throw `TypeError` if used on the revoked `Observable`. Subsequent `revoke` invocations will have no effect.
```javascript
observablePerson.revoke();
```

## Observation options
`options` parameter MAY be not provided at all, it also MAY be null.
If/When provided, `options` parameter MUST contain ONLY one/some of the properties below, no 'foreign' property allowed.

* __`path`__        - non-empty string, specific path to observe; only a changes to this path will be delivered to the observer
> if specified path `firstName` when observing `{ firstName: 'some', lastName: 'name' }`, ONLY and ONLY changes of `firstName` will be observed.
In the same fashion if specified path `address` when observing `{ address: { city: 'city', street: 'street' } }`, ONLY and ONLY changes of `address` will be observed, BUT NOT, for instance, changes of `city` or `street`. 

* __`pathsFrom`__   - non-empty string, any changes from the specified starting path and deeper will be delivered to the observer; this options MAY NOT be used together with `path` option
> if specified path `address` when observing `{ addressNew: {...}, addressOld: {...} }`, ALL of the changes to `addressNew` and `addressOld` and their nested properties of any level of depth will be observed.

## `Change` instance properties

* __`type`__        - one of the following: `insert`, `update`, `delete`, `shuffle` or `reverse`
* __`path`__        - path to the changed property represented as an __Array__ of nodes
* __`value`__       - new value; not available in `delete`, `shuffle` and `reverse` changes
* __`oldValue`__    - old value; not available in `insert`, `shuffle` or `reverse` changes
* __`object`__      - an immediate subject of change, property of which has been changed (ES6 module distro ONLY)