# Changelog

- __1.1.0__
  - `reverse`/`shuffle` change events provided with a `path` (see this [enhancement proposal](https://github.com/gullerya/object-observer/issues/10))
  - further performance improvements

- __1.0.6__
  - Performance improvements (plain objects for events, WeakMap instead of Map wherever possible, other tightens)
  - Minor fixes on `1.0.4` and `1.0.5`

- __1.0.3__
  - Fixed [Issue no. 9](https://github.com/gullerya/object-observer/issues/9) - incorrect tail array items indexing/pathing after performing `splice` which inserts new items in the middle of array

- __1.0.2__
  - Removed named export, only a default export/import is available (see docs below)

- __1.0.1__
  - Added ES6 module packaging (both regular and minified)

- __0.2.6__
  - Fixed cloning logic to allow observability for host objects like `DOMStringMap` and alike (gave up on calling the original object's constructor)
  - Documentation fixes

- __0.2.5__
  - Fix: [issue #8](https://github.com/gullerya/object-observer/issues/8) - incorrect `oldValue` supplied in `update`/`delete` events when handling inner object/s sub-graph

- __0.2.4__
  - Minor syntactic fixes

- __0.2.3__
  - Fix: correct handling of removal/replacement of the non-observable objects (issues [this](https://github.com/gullerya/object-observer/issues/4) and [this](https://github.com/gullerya/object-observer-js/issues/3))

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
