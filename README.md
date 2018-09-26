[![GitHub](https://img.shields.io/github/license/gullerya/object-observer.svg)](https://github.com/gullerya/object-observer)
[![npm](https://img.shields.io/npm/v/object-observer.svg?label=npm%20object-observer)](https://www.npmjs.com/package/object-observer)
[![npm](https://img.shields.io/npm/v/@gullerya/observable.svg?label=npm%20@gullerya/observable)](https://www.npmjs.com/package/@gullerya/observable)
[![Build Status](https://travis-ci.org/gullerya/object-observer.svg?branch=master)](https://travis-ci.org/gullerya/object-observer)

# Summary

__`object-observer`__ provides a deep observation of a changes performed on an object/array graph.

Main aspects:
- implemented via native __Proxy__ (revokable)
- observation is 'deep', yielding changes from a __sub-graphs__ too
- changes delivered in a __synchronous__ way
- original objects are __cloned__ while turned into `Observable`s
- arrays specifics:
  - generic object-like mutations supported
  - intrinsic `Array` mutation methods supported: `pop`, `push`, `shift`, `unshift`, `reverse`, `sort`, `fill`, `splice`
  - massive mutations delivered in a single callback, usually having an array of an atomic changes
- intrinsic mutation methods of `Map`, `WeakMap`, `Set`, `WeakSet` (`set`, `delete`) etc __are not__ observed (see this [issue](https://github.com/gullerya/object-observer/issues/1) for more details)
- following host objects __are not__ observed, but left as they are: `Date`, `Blob`, `Number`, `String`, `Boolean`, `Error`, `SyntaxError`, `TypeError`, `URIError`, `Function`, `Promise`, `RegExp`

#### Support matrix: ![CHROME](https://github.com/gullerya/object-observer/raw/master/docs/browser_icons/chrome.png)<sub>49+</sub> | ![FIREFOX](https://github.com/gullerya/object-observer/raw/master/docs/browser_icons/firefox.png)<sub>42+</sub> | ![EDGE](https://github.com/gullerya/object-observer/raw/master/docs/browser_icons/edge.png) <sub>13+</sub> | ![NODE JS](https://github.com/gullerya/object-observer/raw/master/docs/browser_icons/nodejs.png) <sub>8.10.0+</sub>

#### Performance report can be found [here](https://github.com/gullerya/object-observer/blob/master/docs/performance-report.md)

#### Last versions (full changelog is [here](https://github.com/gullerya/object-observer/blob/master/docs/changelog.md))

- __1.1.0__
  - `reverse`/`shuffle` change events provided with a `path` (see this [enhancement proposal](https://github.com/gullerya/object-observer/issues/10))
  - further performance improvements

- __1.0.6__
  - Performance improvements (plain objects for events, WeakMap instead of Map wherever possible, other tightens)
  - Minor fixes on `1.0.4` and `1.0.5`

- __1.0.3__
  - Fixed [Issue no. 9](https://github.com/gullerya/object-observer/issues/9) - incorrect tail array items indexing/pathing after performing `splice` which inserts new items in the middle of array

For a short preview you may want to play with this [JSFiddle](https://jsfiddle.net/gullerya/5a4tyoqs/).

# Loading the Library

You have few ways to load the library: as an __ES6 module__ (pay attention to the __`module`__ / __`node-module`__ in the path) or as a __regular script__ (into a 'window' global scope, or a custom scope provided by you). See examples below.

Attention: in some (observable :-)) future non-module syntax flavor will be frozen in a stable state and only defect fixes will be done there.
Active development will focus on the ES6 module code base, which is effectively raising the support matrix of Chrome to 61, FireFox to 60 and Edge to 16.

* ES6 module (__preferred__):
```javascript
//  browser
import Observable from 'dist/module/object-observer.min.js';

//  NodeJS
let Observable = require('./dist/node-module/object-observer');
```

* Simple a reference (script tag) to the `object-observer.min.js`/`object-observer.js` in your `HTML` will load it into the __global scope__:
```html
<script src="dist/object-observer.min.js"></script>
<script>
    let person = { name: 'Uria', age: 8 },
        observablePerson;
    observablePerson = Observable.from(person);
</script>
```

* Following loader exemplifies how to load the library into a __custom scope__ (add error handling as appropriate):
```javascript
let customNamespace = {},
    person = { name: 'Nava', age: 6 },
    observablePerson;

fetch('dist/object-observer.min.js').then(function (response) {
    if (response.status === 200) {
        response.text().then(function (code) {
            Function(code).call(customNamespace);

            //	the below code is an example of consumption, locate it in your app lifecycle/flow as appropriate
            observablePerson = customNamespace.Observable.from(person);
        });
    }
});
```

# APIs

##### `Observable` static properties

- __`from`__ - receives a _non-null object_ and returns its __clone__, decorated with an __`Observable`__ interface:
```javascript
let person = { name: 'Aya', age: '1' },
    observablePerson;

observablePerson = Observable.from(person);
```

Clone is deep. Cloning performed only on __own enumerable__ properties, leaving a possibility to 'hide' some data from the library.
    
##### `Observable` instance properties

- __`observe`__ - receives a _function_, which will be added to the list of observers subscribed for a changes of this observable:
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
	
- __`unobserve`__ - receives a _function/s_ which previously was/were registered as an observer/s and removes it/them. If _no arguments_ passed, all observers will be removed:
```javascript
observablePerson.unobserve(personUIObserver);
//  or
observablePerson.unobserve();
```

- __`revoke`__ - parameterless. All of the proxies along the observed graph will be revoked and thus become unusable. `observe` and `unobserve` methods will mimic the revoked `Proxy` behaviour and throw `TypeError` if used on the revoked `Observable`. Subsequent `revoke` invocations will have no effect:
```javascript
observablePerson.revoke();
```

##### `Change` instance properties

- __`type`__ - one of the following: `insert`, `update`, `delete`, `shuffle` or `reverse`
- __`path`__ - path to the changed property represented as an __Array__ of nodes (see examples below)
- __`value`__ - new value; not available in `delete`, `shuffle` and `reverse` changes
- __`oldValue`__ - old value; not available in `insert`, `shuffle` or `reverse` changes


# Examples

##### Objects
```javascript
let order = { type: 'book', pid: 102, ammount: 5, remark: 'remove me' },
    observableOrder = Observable.from(order);

observableOrder.observe(changes => {
    changes.forEach(change => {
        console.log(change);
    });
});


observableOrder.ammount = 7;
//  { type: 'update', path: ['ammount'], value: 7, oldValue: 5 }


observableOrder.address = {
    street: 'Str 75',
    apt: 29
};
//  { type: "insert", path: ['address'], value: { ... } }


observableOrder.address.apt = 30;
//  { type: "update", path: ['address','apt'], value: 30, oldValue: 29 }


delete observableOrder.remark;
//  { type: "delete", path: ['remark'], oldValue: 'remove me' }
```

##### Arrays

```javascript
let a = [ 1, 2, 3, 4, 5 ],
    observableA = Observable.from(a);

observableA.observe(changes => {
    changes.forEach(change => {
        console.log(change);
    });
});

//  observableA = [ 1, 2, 3, 4, 5 ]
observableA.pop();
//  { type: 'delete', path: [4], oldValue: 5 }


//  now observableA = [ 1, 2, 3, 4 ]
//  following operation will cause a single callback to the observer with an array of 2 changes in it)
observableA.push('a', 'b');
//  { type: 'insert', path: [4], value: 'a' }
//  { type: 'insert', path: [5], value: 'b' }


//  now observableA = [1, 2, 3, 4, 'a', 'b']
observableA.shift();
//  { type: 'delete', path: [0], oldValue: 1 }


//  now observableA = [ 2, 3, 4, 'a', 'b' ]
//  following operation will cause a single callback to the observer with an array of 2 changes in it)
observableA.unshift('x', 'y');
//  { type: 'insert', path: [0], value: 'x' }
//  { type: 'insert', path: [1], value: 'y' }


//  now observableA = [ 2, 3, 4, 'a', 'b' ]
observableA.reverse();
//  { type: 'reverse', path: [] } (see below and exampe of this event for nested array)


//  now observableA = [ 'b', 'a', 4, 3, 2 ]
observableA.sort();
//  { type: 'shuffle', path: [] } (see below and exampe of this event for nested array)


//  observableA = [ 2, 3, 4, 'a', 'b' ]
observableA.fill(0, 0, 1);
//  { type: 'update', path: [0], value: 0, oldValue: 2 }


//  observableA = [ 0, 3, 4, 'a', 'b' ]
//  the following operation will cause a single callback to the observer with an array of 2 changes in it)
observableA.splice(0, 1, 'x', 'y');
//  { type: 'update', path: [0], value: 'x', oldValue: 0 }
//  { type: 'insert', path: [1], value: 'y' }


let customer = { orders: [ ... ] },
    oCustomer = Observable.from(customer);

//  sortin the orders array, pay attention to the path in the event
oCustomer.orders.sort();
//  { type: 'shuffle', path: ['orders'] }


oCustomer.orders.reverse();
//  { type: 'reverse', path: ['orders'] }
```
Arrays notes:
- Some of array operations are effectively moving/reindexing the whole array (shift, unshift, splice, reverse, sort).
In cases of massive changes touching presumably the whole array I took a pessimistic approach with a special non-detailed events: 'reverse' for `reverse`, 'shuffle' for `sort`. The rest of these methods I'm handling in an optimistic way delivering the changes that are directly related to the method invokation, while leaving out the implicit outcomes like reindexing of the rest of the Array.
