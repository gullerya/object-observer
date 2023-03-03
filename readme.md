[![npm](https://img.shields.io/npm/v/@gullerya/object-observer.svg?label=npm)](https://www.npmjs.com/package/@gullerya/object-observer)
[![GitHub](https://img.shields.io/github/license/gullerya/object-observer.svg)](https://github.com/gullerya/object-observer)

[![Quality pipeline](https://github.com/gullerya/object-observer/workflows/Quality%20pipeline/badge.svg?branch=main)](https://github.com/gullerya/object-observer/actions?query=workflow%3A%22Quality+pipeline%22)
[![Codecov](https://img.shields.io/codecov/c/github/gullerya/object-observer/main.svg)](https://codecov.io/gh/gullerya/object-observer/branch/main)
[![Codacy](https://img.shields.io/codacy/grade/a3879d7077eb4eef83a591733ad7c579.svg?logo=codacy)](https://www.codacy.com/app/gullerya/object-observer)

# `object-observer`

Starting with `6.0.0` this package will be relocated to [@gullerya/object-observer](https://www.npmjs.com/package/@gullerya/object-observer), please follow up there.

__`object-observer`__ provides a deep observation of a changes performed on an object/array graph.

Main aspects and features:
- implemented via native __Proxy__ (revokable)
- observation is 'deep', yielding changes from a __sub-graphs__ too
- nested objects of the observable graph are observables too
- changes delivered in a __synchronous__ way by default, __asynchronous__ delivery is optionally available as per `Observable` configuration; [more details here](docs/sync-async.md)
- observed path may optionally be filtered as per `observer` configuration; [more details here](docs/filter-paths.md)
- original objects are __cloned__ while turned into `Observable`s
  - circular references are nullified in the clone
- __array__ specifics:
  - generic object-like mutations supported
  - intrinsic `Array` mutation methods supported: `pop`, `push`, `shift`, `unshift`, `reverse`, `sort`, `fill`, `splice`, `copyWithin`
  - massive mutations delivered in a single callback, usually having an array of an atomic changes
- __typed array__ specifics:
  - generic object-like mutations supported
  - intrinsic `TypedArray` mutation methods supported: `reverse`, `sort`, `fill`, `set`, `copyWithin`
  - massive mutations delivered in a single callback, usually having an array of an atomic changes
- intrinsic mutation methods of `Map`, `WeakMap`, `Set`, `WeakSet` (`set`, `delete`) etc __are not__ observed (see this [issue](https://github.com/gullerya/object-observer/issues/1) for more details)
- following host objects (and their extensions) are __skipped__ from cloning / turning into observables: `Date`

Supported:
![CHROME](docs/browser-icons/chrome.png)<sub>71+</sub> |
![FIREFOX](docs/browser-icons/firefox.png)<sub>65+</sub> |
![EDGE](docs/browser-icons/edge-chromium.png)<sub>79+</sub> |
![SAFARI](docs/browser-icons/safari-ios.png)<sub>12.1</sub> |
![NODE JS](docs/browser-icons/nodejs.png) <sub>12.0.0+</sub>

Performance report can be found [here](docs/performance-report.md).

Changelog is [here](docs/changelog.md).

## Preview

For a preview/playground you are welcome to:
- [CodePen](https://codepen.io/gullerya/pen/zYrGMNB) - `Observable.from()` flavor
- [CodePen](https://codepen.io/gullerya/pen/WNRLJWY) - `new ObjectObserver()` flavor

## Install

Use regular `npm install @gullerya/object-observer --save-prod` to use the library from your local environment.

__ES__ module:
```js
import { Observable } from '@gullerya/object-observer';
```

__CJS__ flavor:
```js
const { Observable } = require('@gullerya/object-observer');
```
> Huge thanks to [seidelmartin](https://github.com/seidelmartin) providing the CJS build while greatly improving the build code overall along the way!

__CDN__ (most suggested, when possible):
```js
import { Observable } from 'https://libs.gullerya.com/object-observer/x.y.z/object-observer.min.js';
```

> Replace the `x.y.z` with the desired version, one of the listed in the [changelog](docs/changelog.md).

CDN features:
- security:
  - __HTTPS__ only
  - __intergrity__ checksums for SRI
- performance
  - highly __available__ (with many geo spread edges)
  - agressive __caching__ setup

Full details about CDN usage and example are [found here](docs/cdn.md).

## API

Library implements `Observable` API as it is defined [here](docs/observable.md).

There is also a 'DOM-like' API flavor - constructable `ObjectObserver`.
This API is resonating with DOM's `MutationObserver`, `ResizeObserver` etc from the syntax perspective.
Under the hood it uses the same `Observable` mechanics.
Read docs about this API flavor [here](docs/dom-like-api.md).

`object-observer` is cross-instance operable.
Observables created by different instances of the library will still be detected correctly as such and handled correctly by any of the instances.

## Security

Security policy is described [here](https://github.com/gullerya/object-observer/blob/main/docs/security.md). If/when any concern raised, please follow the process.

## Examples

##### Objects

```javascript
const
    order = { type: 'book', pid: 102, ammount: 5, remark: 'remove me' },
    observableOrder = Observable.from(order);

Observable.observe(observableOrder, changes => {
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
//  - by default the changes below would be delivered in a separate callback
//  - due to async use, they are delivered as a batch in a single callback
//  { type: 'update', path: ['ammount'], value: 1, oldValue: 7, object: observableOrder }
//  { type: 'insert', path: ['remark'], value: 'less is more', object: observableOrder }
```

##### Arrays

```javascript
let a = [ 1, 2, 3, 4, 5 ],
    observableA = Observable.from(a);

Observable.observe(observableA, changes => {
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
Observable.observe(oUser, callback, {path: 'firstName'});

//  going to observe ONLY the changes of 'address.city'
Observable.observe(oUser, callback, {path: 'address.city'});

//  pathsOf
//
//  going to observe the changes of 'address' own properties ('city', 'block') but not else
Observable.observe(oUser, callback, {pathsOf: 'address'});
//  here we'll be notified on changes of
//    address.city
//    address.extra

//  pathsFrom
//
//  going to observe the changes from 'address' and deeper
Observable.observe(oUser, callback, {pathsFrom: 'address'});
//  here we'll be notified on changes of
//    address
//    address.city
//    address.extra
//    address.extra.data
```
