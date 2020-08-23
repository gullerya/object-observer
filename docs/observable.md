# `Observable` API

`Observable` interface defines the APIs for the whole life cycle of object observation functionality.

| static methods | instance methods |
|----------------|------------------|
| `from`         | `observe`        |
| `isObservable` | `unobserve`      |

Additionally, this API defines the `Change` object, list of which being a parameter of an observer/listener callback function.

## Static methods

* __`from(input)`__ - receives a _non-null object_ and returns its __clone__, decorated with an __`Observable`__ interface, effectively returning `Observable` instance
    * clone is deep
    * nested objects are turned into `Observable` instances too
    * cloning performed only on __own enumerable__ properties, leaving a possibility to 'hide' some data from observation
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

* __`isObservable(input)`__ - receives a _non-null object_ and returns `true` if it stands for implementation of `Observable` API as it is defined here
```javascript
Observable.isObservable({});                            //  false
Observable.isObservable(observablePerson);              //  true
Observable.isObservable(observablePerson.address);      //  true
```

## Instance methods

* __`observe(callback[, options])`__
    - callback is a _function_, which will be added to the list of observers subscribed for a changes of this observable; changes delivered always as a never-null-nor-empty array of [__`Change`__](#change-instance-properties) objects; each change is a defined, non-null object, see `Change` definition below
    - optional options _object_

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
observablePerson.observe(personUIObserver, options);    //  options is optional

const observableAddress = observablePerson.address;
observableAddress.observe(personUIObserver);            //  nested objects are observables too

observablePerson.address = {};                          //  see below
```

> Attention! Observation set on the nested objects, like `address` in the example above, 'sticks' to that object. So if one replaces the nested object of the observable graph (see the last line of code above), observer callbacks __are NOT__ moved to the new object, they stick to the old one and continue to live there - think of detaching/replacing a sub-graph from the parent.

* __`unobserve`__ - receives a _function/s_ which previously was/were registered as an observer/s and removes it/them. If _no arguments_ passed, all observers will be removed.
```javascript
observablePerson.unobserve(personUIObserver);
//  or
observablePerson.unobserve();

//  same applies to the nested
observableAddress.unobserve();
```

## Observation options
If/When provided, `options` parameter MUST contain ONLY one/some of the properties below, no 'unknown' properties allowed.

In order to fail-fast and prevent unexpected mess down the hill, incorrect observation options will throw.

* __`path`__ - non-empty string; specific path to observe, only a changes of this exact path will be notified
> If the `path` is `firstName` when observing `{ firstName: 'some', lastName: 'name' }`, ONLY and ONLY changes of the `firstName` will be notified.
When the `path` equals `address` when observing `{ address: { city: 'city', street: 'street' } }`, ONLY and ONLY changes of `address` will be observed, BUT NOT, for instance, changes of `city` or `street`. 

* __`pathsOf`__ - string, MAY be empty; direct properties of the specified path will be notified
> If the `path` equals `address` when observing an object from the examples above, ONLY and ONLY changes of the direct properties of `address` will be notified.
>
> The `path` MAY be empty string, in this case a top level changed will be notified.

* __`pathsFrom`__ - non-empty string, any changes from the specified path and deeper will be delivered to the observer; this option MAY NOT be used together with `path` option
> If the `pathsFrom` equals `'address'` when observing `{ addressNew: {...}, addressOld: {...} }`, ALL of the changes to `addressNew` and `addressOld` and their nested properties of any level of depth will be notified.

## `Change` instance properties

* __`type`__        - one of the following: `insert`, `update`, `delete`, `shuffle` or `reverse`
* __`path`__        - path to the changed property represented as an __Array__ of nodes
* __`value`__       - new value; not available in `delete`, `shuffle` and `reverse` changes
* __`oldValue`__    - old value; not available in `insert`, `shuffle` or `reverse` changes
* __`object`__      - an immediate subject of change, property of which has been changed (ES6 module distro ONLY)