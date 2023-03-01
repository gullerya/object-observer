# Changelog

Change log of the `object-observer` by versions.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [6.0.3] - 2023-03-01
### BREAKING CHANGE
### Chore
- moved deployment to the scoped NPM package `@gullerya/object-observer`

## [5.1.7] - 2023-03-01
### Fixed
- [Issue no. 129](https://github.com/gullerya/object-observer/issues/129) - graceful handling of the circular referenced inputs
### Chore
- updated performance data on NodeJS
- upgraded dependencies

## [5.1.6] - 2022-09-25
### Chore
- upgraded dependencies

## [5.1.5] - 2022-09-14
### Chore
- reduced dependencies (via reworking build flow)
- improved CI

## [5.1.0] - 2022-09-07
### Added
- [Issue no. 121](https://github.com/gullerya/object-observer/issues/121) - added commonjs module build
### Chore
- upgraded dependencies

## [5.0.4] - 2022-07-02
### Chore
- upgraded dependencies
- [Issue no. 86](https://github.com/gullerya/object-observer/issues/86) - moved to the new JustTest testing framework

## [5.0.2] - 2022-05-09
### Chore
- upgraded dependencies

## [5.0.0] - 2022-02-16
### Changed (breaking change)
- [Issue no. 113](https://github.com/gullerya/object-observer/issues/113) - removed `observable`'s `observe` and `unobserve` in favor of the static counterparts from `Observable` namespace.

## [4.8.0] - 2022-02-12
### Added
- [Issue no. 111](https://github.com/gullerya/object-observer/issues/111) - Added `observe` and `unobserve` methods as statics on the `Observable`. Those methods will be removed from the next major release (5) from the observable instance and only be available from `Observable` namespace.
### Chore
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
### Chore
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
### Chore
- dependencies updated
- performance tuned up

## [4.3.2] - 2021-07-19
### Chore
- dependencies updated

## [4.3.1] - 2021-06-15
### Chore
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
### Chore
- documentation improved and updated
- dependencies updated

## [4.2.1] - 2021-03-15
### Added
- [Issue no. 73](https://github.com/gullerya/object-observer/issues/73) - added DOM-like API of `ObjectObserver`
### Chore
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
