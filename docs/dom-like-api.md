# 'DOM-like' API

Starting from version 4.2.0 `object-observer` provides additional 'DOM-like' API flavor.
To be sure, this is a thin layer over an exising `Observable` API, so do make sure to get accustomized with [this](observable.md).

While `Observable` API is more __data__ centric, the present API can be seen as more __logic__ centric one.

## Use cases and basic example

This API flavor suites well, when there is a generic logic to run on any changes of multiple unrelated targets.

In this case you'd create an `ObjectObserver` instance once:
```js
const loggingObserver = new ObjectObserver(changes => {
	changes.forEach( ... );
});
```

and then observe with it subjects of observation:
```js
const observedUser = loggingObserver.observe(user);
// or
const observedSettings = loggingObserver.observe(settings);
```

Attention: for `ObjectObserver` to be able to react on changes, mutations MUST be performed on the `Observable` objects returned from the `observe` method.
Therefore, these objects should become a primary operational 'model' in your logic.

## API

```js
import { ObjectObserver } from 'object-observer.min.js';
```

`ObjectObserver` is class. Construct an instance as following:

`const oo = new ObjectObserver(callback);`

The `callback` is a function with the following signature:

`(changes: Change[]): void`.

### `ObjectObserver` instance methods

| Method       | Signature               | Returns      | Description |
|--------------|-------------------------|--------------|------------|
| `observe`    | `(subject: object)`     | `Observable` | create new `Observable` from the given subject (unless it is already `Observable`) and start observing it |
| `unobserve`  | `(subject: Observable)` |              | stop observing the specified `Observable` subject |
| `disconnect` | `()`                    |              | stop observing __all__ observed subjects |