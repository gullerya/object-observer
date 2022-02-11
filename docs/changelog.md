# Changelog

Change log of the `object-observer` by versions.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Fixed
- upgraded dependencies

## [4.7.2] - 2021-12-25
### Fixed
- [Issue no. 106](https://github.com/gullerya/object-observer/issues/106) - Fixed TS definition of ChangeType (enum to type)
- [Issue no. 107](https://github.com/gullerya/object-observer/issues/107) - Fixed TS definition of ObjectObserver.observe (options are optional)

## [4.7.1] - 2021-12-22
### Fixed
- [Issue no. 104](https://github.com/gullerya/object-observer/issues/104) - Fixed TS definitions

## [4.7.0] - 2021-12-18
### Added
- [Issue no. 102](https://github.com/gullerya/object-observer/issues/102) - Added TS definitions for convenience

## [4.6.6] - 2021-12-18
### Changed
- [Issue no. 99](https://github.com/gullerya/object-observer/issues/99) - simplified CD flow

## [4.6.0] - 2021-11-19
### Changed
- [Issue no. 97](https://github.com/gullerya/object-observer/issues/97) - removing the care for native objects, any but `Date`, due to seemingly non-relevancy (until proven otherwise); this effectively un-does issue #2

## [4.5.0] - 2021-11-13
### Fixed
- [Issue no. 53](https://github.com/gullerya/object-observer/issues/53) - fixing failures on NodeJS due to `Blob` unavailability on global scope

## [4.4.0] - 2021-11-07
### Fixed
- [Issue no. 93](https://github.com/gullerya/object-observer/issues/93) - `pathsOf` misbehave fixed
- dependencies updated
- performance tuned up

## [4.3.2] - 2021-07-19
### Fixed
- dependencies updated

## [4.3.1] - 2021-06-15
### Fixed
- dependencies updated

## [4.3.0] - 2021-05-03
### Changed
- [Issue no. 82](https://github.com/gullerya/object-observer/issues/82) - `object-observer` made cross-instance operable

## [4.2.4] - 2021-05-02
### Added
- [Issue no. 79](https://github.com/gullerya/object-observer/issues/79) - added CodePen example for ObjectObserver API flavor
- [Issue no. 81](https://github.com/gullerya/object-observer/issues/81) - added integrity checksums to the CDN flow and documentation

## [4.2.2] - 2021-04-23
### Added
- [Issue no. 77](https://github.com/gullerya/object-observer/issues/77) - manual CI trigger for release
### Changed
- documentation improved and updated
- dependencies updated

## [4.2.1] - 2021-03-15
### Added
- [Issue no. 73](https://github.com/gullerya/object-observer/issues/73) - added DOM-like API of `ObjectObserver`
### Changed
- documentation improved and updated
- dependencies updated

## [4.1.3] - 2021-02-01
### Added
- [Issue no. 71](https://github.com/gullerya/object-observer/issues/71) - added CDN deployment

## [4.1.1] - 2021-01-16
### Fixed
- `change` structure unified for all types of events
- slightly improved performance
### Changed
- [Issue no. 70](https://github.com/gullerya/object-observer/issues/70) - CI release automation flow improved
- performance tests adjusted

## [4.0.4] - 2020-11-18
### Added
- performance tests

## [4.0.3] - 2020-11-17
### Fixed
- [Issue no. 65](https://github.com/gullerya/object-observer/issues/65) - fixed a broken keys order of the cloned observable
### Changed
- dependencies updated

## [4.0.2] - 2020-10-23
### Added
- security process to be used - [TideLift](https://tidelift.com/security)
- added automated release CI flow
### Removed
- [Issue no. 61](https://github.com/gullerya/object-observer/issues/61) - removed the CommonJS-fashioned NodeJS distribution

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

## [2.9.4] - 2020-03-14
### Added
- [Issue no. 31](https://github.com/gullerya/object-observer/issues/31) - added option to observe `pathsOf`, direct properties of a specific path only

## [2.8.0] - 2020-03-13
### Added
- officially publishing and documenting [Issue no. 33](https://github.com/gullerya/object-observer/issues/33) - any nested object of an `Observable` graph is observable in itself

## [2.7.0] - 2020-02-27
### Added
- [Issue no. 29](https://github.com/gullerya/object-observer/issues/32) - added experimental functionality of nested objects being observables on their own (not yet documented)
- [Issue no. 29](https://github.com/gullerya/object-observer/issues/33) - added experimental functionality of nested objects being observables on their own (not yet documented)

## [2.6.0] - 2020-02-24
### Added
- [Issue no. 29](https://github.com/gullerya/object-observer/issues/29) - added experimental functionality of nested objects being observables on their own (not yet documented)
### Changed
- updated performance numbers: slightly affected by the new functionality, Edge became obsolete while Chromium-Edge entered the picture, measured NodeJS

## [2.5.0] - 2019-11-07
### Fixed
- [Issue no. 28](https://github.com/gullerya/object-observer/issues/28) - fixing non-observable objects detection

## [2.4.2] - 2019-10-10
### Fixed
- minor improvenent in the CI part of the library due to newer/better version of the test runner


---
# Historical releases

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
