[![GitHub](https://img.shields.io/github/license/gullerya/object-observer.svg)](https://github.com/gullerya/object-observer)
[![npm](https://img.shields.io/npm/v/object-observer.svg?label=npm%20object-observer)](https://www.npmjs.com/package/object-observer)
[![npm](https://img.shields.io/npm/v/@gullerya/observable.svg?label=npm%20@gullerya/observable)](https://www.npmjs.com/package/@gullerya/observable)
[![Build Status](https://travis-ci.org/gullerya/object-observer.svg?branch=master)](https://travis-ci.org/gullerya/object-observer)

# Summary

__`object-observer`__ provides a deep observation of a changes performed on an object/array graph.

Main aspects:
* implemented via native __Proxy__ (revokable)
* observation is 'deep', yielding changes from a __sub-graphs__ too
* changes delivered in a __synchronous__ way
* original objects are __cloned__ while turned into `Observable`s
* arrays specifics:
  * generic object-like mutations supported
  * intrinsic `Array` mutation methods supported: `pop`, `push`, `shift`, `unshift`, `reverse`, `sort`, `fill`, `splice`
  * massive mutations delivered in a single callback, usually having an array of an atomic changes
* intrinsic mutation methods of `Map`, `WeakMap`, `Set`, `WeakSet` (`set`, `delete`) etc __are not__ observed (see this [issue](https://github.com/gullerya/object-observer/issues/1) for more details)
* following host objects __are not__ observed, but left as they are: `Date`, `Blob`, `Number`, `String`, `Boolean`, `Error`, `SyntaxError`, `TypeError`, `URIError`, `Function`, `Promise`, `RegExp`

#### Support matrix: ![CHROME](https://github.com/gullerya/object-observer/raw/master/docs/browser_icons/chrome.png)<sub>49+</sub> | ![FIREFOX](https://github.com/gullerya/object-observer/raw/master/docs/browser_icons/firefox.png)<sub>42+</sub> | ![EDGE](https://github.com/gullerya/object-observer/raw/master/docs/browser_icons/edge.png)<sub>13+</sub> | ![NODE JS](https://github.com/gullerya/object-observer/raw/master/docs/browser_icons/nodejs.png) <sub>8.10.0+</sub>

> ES6 module flavor distribution of the library have a higher versions in it's browser support matrix: Chrome 61, FireFox 60 and Edge 16.

#### Performance report can be found [here](https://github.com/gullerya/object-observer/blob/master/docs/performance-report.md)

#### Last versions (full changelog is [here](https://github.com/gullerya/object-observer/blob/master/docs/changelog.md))

* __1.1.4__
  * added `object` property to the `Change` pointing the the immediate subject of change

* __1.1.3__
  * added `Observable.isObservable` API

* __1.1.2__
  * hardening APIs + adding tests
  * improving documentation

For a short preview you may want to play with this [JSFiddle](https://jsfiddle.net/gullerya/5a4tyoqs/).

# Loading the Library

You have few ways to load the library: as an __ES6 module__ (pay attention to the __`module`__ / __`node-module`__ in the path) or as a __regular script__ (into a 'window' global scope, or a custom scope provided by you). See examples below.

> Attention: in some (observable :-)) future non-module syntax flavor will be frozen in a stable state and only defect fixes will be done there.
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

# API

Library implements `Observable` API as it is defined [here](https://github.com/gullerya/object-observer/blob/master/docs/observable.md).

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
//  { type: 'update', path: ['ammount'], value: 7, oldValue: 5, object: observableOrder }


observableOrder.address = {
    street: 'Str 75',
    apt: 29
};
//  { type: "insert", path: ['address'], value: { ... }, object: observableOrder }


observableOrder.address.apt = 30;
//  { type: "update", path: ['address','apt'], value: 30, oldValue: 29, object: observableOrder.address }


delete observableOrder.remark;
//  { type: "delete", path: ['remark'], oldValue: 'remove me', object: observableOrder }
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
//  { type: 'delete', path: [4], oldValue: 5, object: observableA }


//  now observableA = [ 1, 2, 3, 4 ]
//  following operation will cause a single callback to the observer with an array of 2 changes in it)
observableA.push('a', 'b');
//  { type: 'insert', path: [4], value: 'a', object: observableA }
//  { type: 'insert', path: [5], value: 'b', object: observableA }


//  now observableA = [1, 2, 3, 4, 'a', 'b']
observableA.shift();
//  { type: 'delete', path: [0], oldValue: 1, object: observableA }


//  now observableA = [ 2, 3, 4, 'a', 'b' ]
//  following operation will cause a single callback to the observer with an array of 2 changes in it)
observableA.unshift('x', 'y');
//  { type: 'insert', path: [0], value: 'x', object: observableA }
//  { type: 'insert', path: [1], value: 'y', object: observableA }


//  now observableA = [ 2, 3, 4, 'a', 'b' ]
observableA.reverse();
//  { type: 'reverse', path: [], object: observableA } (see below and exampe of this event for nested array)


//  now observableA = [ 'b', 'a', 4, 3, 2 ]
observableA.sort();
//  { type: 'shuffle', path: [], object: observableA } (see below and exampe of this event for nested array)


//  observableA = [ 2, 3, 4, 'a', 'b' ]
observableA.fill(0, 0, 1);
//  { type: 'update', path: [0], value: 0, oldValue: 2, object: observableA }


//  observableA = [ 0, 3, 4, 'a', 'b' ]
//  the following operation will cause a single callback to the observer with an array of 2 changes in it)
observableA.splice(0, 1, 'x', 'y');
//  { type: 'update', path: [0], value: 'x', oldValue: 0, object: observableA }
//  { type: 'insert', path: [1], value: 'y', object: observableA }


let customer = { orders: [ ... ] },
    oCustomer = Observable.from(customer);

//  sortin the orders array, pay attention to the path in the event
oCustomer.orders.sort();
//  { type: 'shuffle', path: ['orders'], object: oCustomer.orders }


oCustomer.orders.reverse();
//  { type: 'reverse', path: ['orders'], object: oCustomer.orders }
```
> Arrays notes: Some of array operations are effectively moving/reindexing the whole array (shift, unshift, splice, reverse, sort).
In cases of massive changes touching presumably the whole array I took a pessimistic approach with a special non-detailed events: 'reverse' for `reverse`, 'shuffle' for `sort`. The rest of these methods I'm handling in an optimistic way delivering the changes that are directly related to the method invocation, while leaving out the implicit outcomes like reindexing of the rest of the Array.
