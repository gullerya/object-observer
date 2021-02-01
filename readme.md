[![npm](https://img.shields.io/npm/v/object-observer.svg?label=npm%20object-observer)](https://www.npmjs.com/package/object-observer)
[![GitHub](https://img.shields.io/github/license/gullerya/object-observer.svg)](https://github.com/gullerya/object-observer)

[![Quality pipeline](https://github.com/gullerya/object-observer/workflows/Quality%20pipeline/badge.svg?branch=master)](https://github.com/gullerya/object-observer/actions?query=workflow%3A%22Quality+pipeline%22)
[![Codecov](https://img.shields.io/codecov/c/github/gullerya/object-observer/master.svg)](https://codecov.io/gh/gullerya/object-observer/branch/master)
[![Codacy](https://img.shields.io/codacy/grade/a3879d7077eb4eef83a591733ad7c579.svg?logo=codacy)](https://www.codacy.com/app/gullerya/object-observer)

# Summary

__`object-observer`__ provides a deep observation of a changes performed on an object/array graph.

Main aspects and features:

* implemented via native __Proxy__ (revokable)

* observation is 'deep', yielding changes from a __sub-graphs__ too

* nested objects of the observable graph are observables too

* changes delivered in a __synchronous__ way by default, __asynchronous__ delivery (experimental) is optionally available as per `Observable` configuration; [more details here](docs/sync-async.md)

* observed path may optionally be filtered as per `observer` configuration; [more details here](docs/filter-paths.md)

* original objects are __cloned__ while turned into `Observable`s

* __array__ specifics:
  * generic object-like mutations supported
  * intrinsic `Array` mutation methods supported: `pop`, `push`, `shift`, `unshift`, `reverse`, `sort`, `fill`, `splice`, `copyWithin`
  * massive mutations delivered in a single callback, usually having an array of an atomic changes

* __typed array__ specifics:
  * generic object-like mutations supported
  * intrinsic `TypedArray` mutation methods supported: `reverse`, `sort`, `fill`, `set`, `copyWithin`
  * massive mutations delivered in a single callback, usually having an array of an atomic changes

* intrinsic mutation methods of `Map`, `WeakMap`, `Set`, `WeakSet` (`set`, `delete`) etc __are not__ observed (see this [issue](https://github.com/gullerya/object-observer/issues/1) for more details)

* following host objects (and their extensions) are __skipped__ from cloning / turning into observables: `Date`, `Blob`, `Error`

#### Support matrix: ![CHROME](docs/browser-icons/chrome.png)<sub>61+</sub> | ![FIREFOX](docs/browser-icons/firefox.png)<sub>60+</sub> | ![EDGE](docs/browser-icons/edge.png)<sub>16+</sub> | ![NODE JS](docs/browser-icons/nodejs.png) <sub>8.10.0+</sub>

#### Performance report can be found [here](docs/performance-report.md)

#### Last versions (full changelog is [here](docs/changelog.md))

* __4.1.3__
  * implemented [Issue no. 71](https://github.com/gullerya/object-observer/issues/71) - added CDN deployment

* __4.1.1__
  * [Issue no. 70](https://github.com/gullerya/object-observer/issues/70) - automated version bump
  * unified `Change` object structure (so that it is always the same shape)
  * improved perf tests

* __4.0.4__
  * [Issue no. 65](https://github.com/gullerya/object-observer/issues/65) - fixed a broken keys order of the cloned observable
  * added perf tests

For a preview/playground you are welcome to:
* [JSFiddle](https://jsfiddle.net/gullerya/5a4tyoqs/latest)
* [CodePen](https://codepen.io/gullerya/pen/zYrGMNB)

# Loading

`object-observer` provided as an __ES6 module__.

```javascript
import { Observable } from 'dist/object-observer.min.js';
```

# API

Library implements `Observable` API as it is defined [here](docs/observable.md).

# Examples

##### Objects

```javascript
const
	order = { type: 'book', pid: 102, ammount: 5, remark: 'remove me' },
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

Object.assign(observableOrder, { amount: 1, remark: 'less is more' }, { async: true });
//	- by default the changes below would be delivered in a separate callback
//	- due to async use, they are delivered as a batch in a single callback
//  { type: 'update', path: ['ammount'], value: 1, oldValue: 7, object: observableOrder }
//  { type: 'insert', path: ['remark'], value: 'less is more', object: observableOrder }
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
//  { type: 'delete', path: [4], value: undefined, oldValue: 5, object: observableA }


//  now observableA = [ 1, 2, 3, 4 ]
//  following operation will cause a single callback to the observer with an array of 2 changes in it)
observableA.push('a', 'b');
//  { type: 'insert', path: [4], value: 'a', oldValue: undefined, object: observableA }
//  { type: 'insert', path: [5], value: 'b', oldValue: undefined, object: observableA }


//  now observableA = [1, 2, 3, 4, 'a', 'b']
observableA.shift();
//  { type: 'delete', path: [0] value: undefined, oldValue: 1, object: observableA }


//  now observableA = [ 2, 3, 4, 'a', 'b' ]
//  following operation will cause a single callback to the observer with an array of 2 changes in it)
observableA.unshift('x', 'y');
//  { type: 'insert', path: [0], value: 'x', oldValue: undefined, object: observableA }
//  { type: 'insert', path: [1], value: 'y', oldValue: undefined, object: observableA }


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
//  { type: 'insert', path: [1], value: 'y', oldValue: undefined, object: observableA }


let customer = { orders: [ ... ] },
    oCustomer = Observable.from(customer);

//  sorting the orders array, pay attention to the path in the event
oCustomer.orders.sort();
//  { type: 'shuffle', path: ['orders'], object: oCustomer.orders }


oCustomer.orders.reverse();
//  { type: 'reverse', path: ['orders'], object: oCustomer.orders }
```

> Arrays notes: Some of array operations are effectively moving/reindexing the whole array (shift, unshift, splice, reverse, sort).
In cases of massive changes touching presumably the whole array I took a pessimistic approach with a special non-detailed events: 'reverse' for `reverse`, 'shuffle' for `sort`. The rest of these methods I'm handling in an optimistic way delivering the changes that are directly related to the method invocation, while leaving out the implicit outcomes like reindexing of the rest of the Array.

##### Observation options

`object-observer` allows to filter the events delivered to each callback/listener by an optional configuration object passed to the `observe` API.

> In the examples below assume that `callback = changes => {...}`.

```javascript
let user = {
        firstName: 'Aya',
        lastName: 'Guller',
        address: {
            city: 'of mountaineers',
            street: 'of the top ridges',
            block: 123,
            extra: {
                data: {}
            }
        }
    },
    oUser = Observable.from(user);

//  path
//
//  going to observe ONLY the changes of 'firstName'
oUser.observe(callback, {path: 'firstName'});

//  going to observe ONLY the changes of 'address.city'
oUser.observe(callback, {path: 'address.city'});

//  pathsOf
//
//  going to observe the changes of 'address' own properties ('city', 'block') but not else
oUser.observe(callback, {pathsOf: 'address'});
//  here we'll be notified on changes of
//    address.city
//    address.extra

//  pathsFrom
//
//  going to observe the changes from 'address' and deeper
oUser.observe(callback, {pathsFrom: 'address'});
//  here we'll be notified on changes of
//    address
//    address.city
//    address.extra
//    address.extra.data
```
