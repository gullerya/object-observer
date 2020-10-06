# Changelog

Change log of the `object-observer` by versions.

## [Unreleased]

## [3.2.0] - 2020-09-03
### Added
- [Issue no. 45](https://github.com/gullerya/object-observer/issues/45) - implemented async flavor of changes delivery on per Observable configuration basis; default behavior remained the same - synchronous
- [Issue no. 51](https://github.com/gullerya/object-observer/issues/51) - batch delivery of `Object.assign` changes is enabled via the async opt-in, see issue #45 above

## [3.1.1] - 2020-09-03
### Fixed
- [Issue no. 58](https://github.com/gullerya/object-observer/issues/58) - JSFiddle link to point to the latest

## [3.1.0] - 2020-08-23
### Changed
- [Issue no. 55](https://github.com/gullerya/object-observer/issues/55) - enhanced documentation of observation options
### Fixed
- [Issue no. 56](https://github.com/gullerya/object-observer/issues/56) - fixed handling of `pathsOf` option in case of `Array` massive mutations (`reverse`, `shuffle` events)
### Added
- enhanced tests and fixed mis-implemented negative ones

## [3.0.3] - 2020-06-04
### Added
- [Issue no. 46](https://github.com/gullerya/object-observer/issues/46) - added support to the `TypedArray` objects
- [Issue no. 44](https://github.com/gullerya/object-observer/issues/44) - added support to the `copyWithin` method (`Array`, `TypedArray`)
### Fixed
- slight performance improvements

* __2.9.4__
  * implemented [Issue no. 31](https://github.com/gullerya/object-observer/issues/31) - added option to observe `pathsOf`, direct properties of a specific path only

* __2.8.0__
  * officially publishing and documenting [Issue no. 33](https://github.com/gullerya/object-observer/issues/33) - any nested object of an `Observable` graph is observable in itself

* __2.7.0__
  * implemented [Issue no. 29](https://github.com/gullerya/object-observer/issues/32) - added experimental functionality of nested objects being observables on their own (not yet documented)
  * implemented [Issue no. 29](https://github.com/gullerya/object-observer/issues/33) - added experimental functionality of nested objects being observables on their own (not yet documented)

* __2.6.0__
  * implemented [Issue no. 29](https://github.com/gullerya/object-observer/issues/29) - added experimental functionality of nested objects being observables on their own (not yet documented)
  * updated performance numbers: slightly affected by the new functionality, Edge became obsolete while Chromium-Edge entered the picture, measured NodeJS

* __2.5.0__
  * fixed [Issue no. 28](https://github.com/gullerya/object-observer/issues/28) - fixing non-observable objects detection

* __2.4.2__
  * minor improvenent in the CI part of the library due to newer/better version of the test runner

* __2.4.1__
  * fixed [Issue no. 27](https://github.com/gullerya/object-observer/issues/27) - broken `NodeJS` dedicated distro
  * updated dependencies

* __2.3.0__
  * fixed [Issue no. 26](https://github.com/gullerya/object-observer/issues/26) - callbacks/observers are being called with an empty changes array when set for a specific path/paths

* __2.2.0__
  * implemented [Issue no. 25](https://github.com/gullerya/object-observer/issues/25) - not dispathing events when strictly equal values reassigned (except `object`, which is never equal due to cloning)

* __2.1.0__
  * implemented [Issue no. 21](https://github.com/gullerya/object-observer/issues/21) - implemented 'partial paths observation' functionality (thanks [tonis2](https://github.com/tonis2)!)

* __2.0.2__
  * fixed [Issue no. 20](https://github.com/gullerya/object-observer/issues/20) - fixing `isObservable` API

* __2.0.0__
  * implemented [Issue no. 16](https://github.com/gullerya/object-observer/issues/16) - explicit naming in export instead of default (!!! breaking change)
  * implemented [Issue no. 17](https://github.com/gullerya/object-observer/issues/17) - removed non-ES6 like module and adjusted folder structure (!!! breaking change)

* __1.2.0__
  * fixed [Issue no. 18](https://github.com/gullerya/object-observer/issues/18)

* __1.1.5__
  * implemented improvement as suggested in [Issue no. 13](https://github.com/gullerya/object-observer/issues/13)
  * added tests to CI + coverage report

* __1.1.4__
  * added `object` property to the `Change` pointing the the immediate subject of change; [Issue no. 12](https://github.com/gullerya/object-observer/issues/12). Attention: this change is found only in ES6-module flavor distribution.

* __1.1.3__
  * added `Observable.isObservable` API

- __1.1.2__
  - hardening APIs + adding tests
  - improving documentation

- __1.1.1__
  - even more aggressive performance tightening
  - performance tests added to the test suites

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
