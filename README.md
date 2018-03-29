[![npm version](https://badge.fury.io/js/object-observer.svg)](https://badge.fury.io/js/object-observer)
[![Build Status](https://travis-ci.org/gullerya/object-observer-js.svg?branch=master)](https://travis-ci.org/gullerya/object-observer-js)

# Summary

`object-observer` provides an __observation of a changes performed on an object__ (array being a subtype of it), hopefully in a most clean and performant way.

Main aspects:
- implementation relies on __Proxy__ mechanism (specifically, revokable Proxy)
- observation is 'deep', yielding changes from a __sub-graphs__ too
- changes delivered in a __synchronous__ way
- changes delivered always as an __array__, in order to have unified callback API signature supporting also bulk changes delivery in a single call back
- original objects are __cloned__, thus not being affected; this adds one more step to the normal usage flow:
  - first, create observable clone from the specified object
  - second, register observers on the observable (not on the original object)
- arrays:
  - generic object-like mutations supported
  - intrinsic mutation methods supported: `pop`, `push`, `shift`, `unshift`, `reverse`, `sort`, `fill`, `splice` (see below for more info on changes delivery for these)
  - massive mutations delivered in a single callback, usually having an array of an atomic changes
- enhanced intrinsic methods of `Map`, `WeakMap`, `Set`, `WeakSet` like `set`, `get`, `delete` etc are not observed (see this [issue](https://github.com/gullerya/object-observer-js/issues/1) for more details)

#### Support matrix: ![CHROME](./tools/browser_icons/chrome.png) <sub>49+</sub>, ![FIREFOX](./tools/browser_icons/firefox.png) <sub>42+</sub>, ![EDGE](./tools/browser_icons/edge.png) <sub>13+</sub>
Support matrix is mainly dependent on 2 advanced language features: `Proxy` and `Reflect`. The broader their adoption - the broader the support matrix of `object-observer`.

#### Backlog:
 - Changes, probably based on my own consumption of this library in __data-tier__ module ([GitHub](https://github.com/gullerya/data-tier), [NPM](https://www.npmjs.com/package/data-tier)) and/or community feedback. __Status__: in progress
 - Consider adding support for a Symbol defined object properties. __Status__: in progress

#### Versions

- __0.2.5__
  - Fix: [issue #8](https://github.com/gullerya/object-observer-js/issues/8) - incorrect `oldValue` supplied in `update`/`delete` events when handling inner object/s sub-graph 

- __0.2.4__
  - Minor syntactic fixes

- __0.2.3__
  - Fix: correct handling of removal/replacement of the non-observable objects (issues [this](https://github.com/gullerya/object-observer-js/issues/4) and [this](https://github.com/gullerya/object-observer-js/issues/3))

- __0.2.2__
  - Fix: Switched internal implementation to use `Map` instead of `WeakMap` object, due to this [issue](https://github.com/Microsoft/ChakraCore/issues/2419) in Edge browsers. Once the Edge will be fixed, I'll switch back to 'weak' maps.

- __0.2.1__
  - Bug fix: implemented 'non-observable' object types functionality for the ones, that their observation is meaningless (or even harmful and bug causing); 'non-observables' are: `Date`, `Blob`, `Number`, `String`, `Boolean`, `Error`, `SyntaxError`, `TypeError`, `URIError`, `Function`, `Promise`, `RegExp` (see this [issue](https://github.com/gullerya/object-observer-js/issues/2) for more details)

- __0.2.0__
  - Tech: moved proxy implementation to revokable
  - Tech: refactored algorithm of sub-graphs indexing and management; speed and memory improved, arrays massive changes improved significantly
  - API: added revokability to an Observable
  - 'detached' (`pop`, `shift`, `splice` actions on arrays) and replaced (simple update on objects and arrays, `fill` on arrays) observed sub-graphs are being revoked as well
  - results of 'detach' actions (`pop`, `shift`, `splice`) are turned back to the plain object (yet having all of the changes done to the observable) when returned by APIs

For a short preview you may want to play with this [JSFiddle](https://jsfiddle.net/gullerya/5a4tyoqs/).

# Loading the Library

You have 2 ways to load the library: into a 'window' global scope, or a custom scope provided by you.

* Simple a reference (script tag) to the object-oserver.js in your HTML will load it into the __global scope__:
```html
<script src="object-observer.js"></script>
<script>
	var person = { name: 'Uriya', age: 8 },
	    observablePerson;
	observablePerson = Observable.from(person);
</script>
```

* Following loader exemplifies how to load the library into a __custom scope__ (add error handling as appropriate):
```javascript
var customNamespace = {},
    person = { name: 'Nava', age: 6 },
    observablePerson;

fetch('object-observer.js').then(function (response) {
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

- __`from`__ - receives a _non-null object_ and returns __`Observable`__ interface:
	```javascript
	var person = { name: 'Aya', age: '1' },
		observablePerson;

	observablePerson = Observable.from(person);
	...
	```

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
	
	Changes delivered always as an array. Changes MAY NOT be null. Changes MAY be an empty array.
	Each change is a defined, non-null object, having:
	- `type` - one of the following: 'insert', 'update', 'delete', 'shuffle' or 'reverse'
	- `path` - path to the changed property represented as an __Array__ of nodes (see examples below)
	- `value` - new value; not available in 'delete', 'shuffle' and 'reverse' changes
	- `oldValue` - old value; not available in 'insert', 'shuffle' or 'reverse' changes
	
- __`unobserve`__ - receives a _function/s_ which previously was/were registered as an observer/s and removes it/them. If _no arguments_ passed, all observers will be removed:
	```javascript
	...
	observablePerson.unobserve(personUIObserver);
	...
	observablePerson.unobserve();
	...
	```

- __`revoke`__ - parameterless. All of the proxies along the observed graph will be revoked and thus become unusable. `observe` and `unobserve` methods will mimic the revoked `Proxy` behaviour and throw `TypeError` if used on the revoked `Observable`. Subsequent `revoke` invokations will have no effect:
	```javascript
	...
	observablePerson.revoke();
	...
	```

# Examples

##### Objects
```javascript
var order = { type: 'book', pid: 102, ammount: 5, remark: 'remove me' },
	observableOrder;
observableOrder = Observable.from(order);
observableOrder.observe(changes => {
	changes.forEach(change => {
		console.log(change);
	});
});
observableOrder.ammount = 7;		// { type: 'update', path: ['ammount'], value: 7, oldValue: 5 }
observableOrder.address = {			// { type: "insert", path: ['address'], value: { ... } }
	street: 'Str 75',
	apt: 29
};
observableOrder.address.apt = 30;	// { type: "update", path: ['address','apt'], value: 30, oldValue: 29 }
delete observableOrder.remark;		// { type: "delete", path: ['remark'], oldValue: 'remove me' }
```

##### Arrays

```javascript
var a = [ 1, 2, 3, 4, 5],
	observableA;

observableA = Observable.from(a);
observableA.observe(changes => {
	changes.forEach(change => {
		console.log(change);
	});
});


//	observableA = [ 1, 2, 3, 4, 5 ]
observableA.pop();					//	{ type: 'delete', path: [4], oldValue: 5 }


//	observableA = [ 1, 2, 3, 4 ]
//	the following operation will cause a single callback to the observer with an array of 2 changes in it)
observableA.push('a', 'b');			//	{ type: 'insert', path: [4], value: 'a' }
									//	{ type: 'insert', path: [5], value: 'b' }


//	observableA = [1, 2, 3, 4, 'a', 'b']
observableA.shift();				//	{ type: 'delete', path: [0], oldValue: 1 }


//	observableA = [ 2, 3, 4, 'a', 'b' ]
//	the following operation will cause a single callback to the observer with an array of 2 changes in it)
observableA.unshift('x', 'y');		//	{ type: 'insert', path: [0], value: 'x' }
									//	{ type: 'insert', path: [1], value: 'y' }

//	observableA = [ 2, 3, 4, 'a', 'b' ]
observableA.reverse();				//	{ type: 'reverse' }


//	observableA = [ 'b', 'a', 4, 3, 2 ]
observableA.sort();					//	{ type: 'shuffle' }


//	observableA = [ 2, 3, 4, 'a', 'b' ]
observableA.fill(0, 0, 1);			//	{ type: 'update', path: [0], value: 0, oldValue: 2 }


//	observableA = [ 0, 3, 4, 'a', 'b' ]
//	the following operation will cause a single callback to the observer with an array of 2 changes in it)
observableA.splice(0, 1, 'x', 'y');	//	{ type: 'update', path: [0], value: 'x', oldValue: 0 }
									//	{ type: 'insert', path: [1], value: 'y' }
```
Arrays notes:
- Some of array operations are effectively moving/reindexing the whole array (shift, unshift, splice, reverse, sort). In cases of massive changes touching presumably the whole array I took a pessimistic approach with a special non-detailed events: 'reverse' for `reverse`, 'shuffle' for `sort`. The rest of these methods I'm handling in an optimistic way delivering the changes that are directly related to the method invokation, while leaving out the implicit outcomes like reindexing of the rest of the Array.
