# Migrating from v6 to v7

`object-observer` v7 is a major release. The core API — `Observable.from`, `Observable.observe`, `Observable.unobserve`, `Observable.isObservable`, `ObjectObserver` — keeps its shape and semantics. The change event model (`type`, `path`, `value`, `oldValue`, `object`) is unchanged.

The only API break is the **observation options** shape: the old path-based options have been replaced with a single `filters` array of `Filter` instances. A handful of smaller, mostly incidental adjustments are listed at the end for completeness.

## Observation options — path-based options replaced by `filters`

### What changed

In v6, `Observable.observe(observable, callback, options)` accepted one of three mutually exclusive path options:

| v6 option    | Meaning                                              |
|--------------|------------------------------------------------------|
| `path`       | observe one exact path                               |
| `pathsOf`    | observe direct children of a path                    |
| `pathsFrom`  | observe a path and everything below it               |

In v7 these three options are **removed**. In their place, `options.filters` accepts a **non-empty array of `Filter` instances**. When multiple filters are provided they compose as logical AND — each narrows the output of the previous one. `Filter` is a new named export; instances are created via static factory methods (the constructor is private).

### Mapping table

| v6                                            | v7                                                                   |
|-----------------------------------------------|----------------------------------------------------------------------|
| `{ path: 'a.b' }`                             | `{ filters: [Filter.exactPaths(['a.b'])] }`                          |
| `{ path: ['a.b', 'a.c'] }` *(if ever used)*   | `{ filters: [Filter.exactPaths(['a.b', 'a.c'])] }`                   |
| `{ pathsOf: 'a' }`                            | `{ filters: [Filter.directChildrenOf('a')] }`                        |
| `{ pathsOf: '' }`                             | `{ filters: [Filter.directChildrenOf('')] }` *(root direct children)* |
| `{ pathsFrom: 'a' }`                          | `{ filters: [Filter.pathsStartWith('a')] }`                          |
| *(no v6 equivalent)*                          | `{ filters: [Filter.custom(cs => cs.filter(...))] }`                 |

### Before / after

```javascript
//  v6
import { Observable } from '@gullerya/object-observer';

Observable.observe(obs, cb, { path: 'address.city' });
Observable.observe(obs, cb, { pathsOf: 'address' });
Observable.observe(obs, cb, { pathsFrom: 'address' });
```

```javascript
//  v7
import { Observable, Filter } from '@gullerya/object-observer';

Observable.observe(obs, cb, { filters: [Filter.exactPaths(['address.city'])] });
Observable.observe(obs, cb, { filters: [Filter.directChildrenOf('address')] });
Observable.observe(obs, cb, { filters: [Filter.pathsStartWith('address')] });
```

### Behavior notes

- **`directChildrenOf` fixes a v6 sibling-prefix bug.** In v6, `pathsOf: 'inner'` could incorrectly match changes under a sibling named `innerX` (see [issue #93](https://github.com/gullerya/object-observer/issues/93) for the original fix attempt). `Filter.directChildrenOf('inner')` in v7 matches only true direct children of `'inner'`. If your v6 code relied on the buggy behavior, update the expected path.
- **`REVERSE` / `SHUFFLE` at the target path are still delivered by `directChildrenOf`**, matching v6 `pathsOf` semantics — they are semantically mutations of the container's children.
- **Multiple filters compose as AND.** There was no way to combine path options in v6; in v7 you can stack filters to narrow further.
- **Bare functions are rejected.** `{ filters: [(cs) => cs] }` throws. Wrap with `Filter.custom(fn)`.
- **Unknown options still throw, as in v6.** `Observable.observe` continues to fail-fast on unrecognized option keys — only the valid key name changed.

See [docs/filters.md](filters.md) for the full `Filter` API.

## Other breaking changes

### `Change` objects are read-only

In v6 the `Change` class exposed its fields as plain writable properties. In v7, `type`, `path`, `value`, `oldValue`, and `object` are read-only getters backed by private fields. Code that **read** change properties is unaffected. Code that **wrote** to change objects — e.g. `change.type = 'custom'` or attaching ad-hoc properties to a change — will throw in strict mode (and silently fail in sloppy mode). This is very rarely done in practice; if you were using change objects as a scratch space, copy the fields into your own object instead.

A new `pathAsString` getter is available (lazy, dot-joined). Additive, not breaking.

### Runtime and browser matrix

The officially supported matrix has been refreshed:

- Node.js: **24.15.0+** (aligned with current LTS).
- Browsers: **last 2 versions** of Chrome, Firefox, Edge, and Safari.

This is the matrix the library is actively **tested against** — it is not a hard runtime requirement. The library does not use any v7-specific new language or platform features, so older Node.js versions and older browsers will most likely continue to work just fine. We simply don't run CI against them anymore, so regressions there won't be caught by us.

## What did **not** change

- `Observable.from`, `Observable.isObservable`, `Observable.observe`, `Observable.unobserve` signatures.
- `ObjectObserver` class and its `observe` / `unobserve` / `disconnect` methods.
- The `Change` shape (`type`, `path`, `value`, `oldValue`, `object`) and the set of change types (`insert`, `update`, `delete`, `shuffle`, `reverse`).
- Synchronous default delivery and the opt-in `async: true` option on `Observable.from`.
- The set of observed mutations on plain objects, arrays, and typed arrays.
- Cross-instance operability.

## New in v7 (non-breaking, for awareness)

- **`Filter` is exported**, with static factories: `exactPaths`, `pathsStartWith`, `directChildrenOf`, `custom`.
- **`Validator` is exported**, with a `Validator.custom(fn)` factory. Validators are passed via `Observable.from(target, { validators: [...] })` and run **before** a mutation is applied — throwing from a validator vetoes the mutation (the target is not modified and observers are not invoked). See the `Validators` section in the readme for details.
  > In 7.0 validators do not yet run for `Array.prototype.splice`, `Array.prototype.fill`, and `Array.prototype.copyWithin` (and their `TypedArray` counterparts where applicable). Support is planned for a subsequent release.
