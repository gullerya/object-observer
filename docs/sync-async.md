# Sync/Async changes delivery

## Introduction

Beginning from version `3.2.0` it is possible to control whether the changes to be delivered in a sync or async fashion.

The opt-in mechanism works on the level of `Observable`, via the options passed to the static `Observable.from` method during the creation and affects all callbacks/observers that will be listening on the observable instance.

Asynchronous behaviour implemented via `queueMicrotask` mechanism, mimicing a similar native implementations like `Promise`, `MutationObserver` etc.

Which one to use? I suggest to go first with a default __sync__ flavor and switch to the __async__ only when it is proven to be needed, for example batch delivery of changes of `Object.assign` (see below).

## Sync

Default behaviour is to deliver changes __synchronously__:
```
const o = Observable.from({});
Observable.observe(o, changes =>
	changes.forEach(change => console.log(change.value))
);

o.propA = 1;
console.log(2);
o.propB = 3;

//	console output:
//	1
//	2
//	3
```

Here is the place to mention somewhat unexpected outcome of this flavor in case of `Object.assign` usage:

```
const o = Observable.from({});
let callbacksCount = 0;
Observable.observe(o, () => callbacksCount++);

Object.assign(o, { a: 1, b: 2, c: 3 });
console.log(callbacksCount);

//	console output:
//	3
```

While one would expect to have a single callback with 3 changes, in fact we've got 3 callback, each with a single change. `Object.assign` does a full assignment cycle per property, including passing via the `Proxy` traps, which causes this single operation to appear as 3 separate assignements.

## Async

One may opt-in an __asynchronous__ changes delivery:
```
const o = Observable.from({}, { async: true });
Observable.observe(o, changes =>
	changes.forEach(change => console.log(change.value))
);

o.propA = 3;
console.log(1);
o.propB = 4;
console.log(2);

//	console output:
//	1
//	2
//	3
//	4
```

In this case `Object.assign` will behave correctly:

```
const o = Observable.from({});
let callbacksCount = 0;
Observable.observe(o, () => callbacksCount++);

Object.assign(o, { a: 1, b: 2, c: 3 });

queueMicrotask(() =>
	console.log(callbacksCount)
);

//	console output:
//	1
```

Now, due to postponing changes delivery to the end of the currently running task, all 3 changes are delivered in a single callback.

Pay attention, that because of the asynchronicity, we also need to postpone the inspection of the effect of the callback/s.