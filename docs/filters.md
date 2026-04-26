# Filters

`Observable.observe(...)` accepts an optional third argument — an options object. The only currently supported option is `filters`: a non-empty array of `Filter` instances. Changes that survive **all** filters (logical AND) are delivered to the observer.

```javascript
import { Observable, Filter } from '@gullerya/object-observer';

Observable.observe(obs, callback, {
    filters: [Filter.directChildrenOf('address'), Filter.pathsStartWith('address.city')]
});
```

`Filter` instances are created via static factory methods only; the constructor is private.

## Factory methods

### `Filter.exactPaths(paths: string[]): Filter`

Delivers only changes whose path (as a dotted string) is an exact match for one of the provided paths. `paths` MUST be a non-empty array.

```javascript
Filter.exactPaths(['firstName', 'address.city'])
```

### `Filter.pathsStartWith(prefix: string): Filter`

Delivers changes whose path string starts with `prefix`. `prefix` MUST be a non-empty string.

```javascript
Filter.pathsStartWith('address')
//  matches 'address', 'address.city', 'address.extra.data', ...
```

### `Filter.directChildrenOf(path: string): Filter`

Delivers changes whose path is a **direct child** of `path` (exactly one level deeper). `path` MUST be a string (may be empty — empty string means the root). REVERSE and SHUFFLE changes at `path` itself are also delivered, because they are semantically mutations of the container's children.

```javascript
Filter.directChildrenOf('address')
//  matches 'address.city', 'address.block'  — but NOT 'address' or 'address.extra.data'

Filter.directChildrenOf('')
//  matches any top-level property change
```

### `Filter.custom(fn: (changes: Change[]) => Change[]): Filter`

Wraps an arbitrary function. `fn` receives the (already-narrowed) array of `Change` objects and returns a filtered array. `fn` MUST be a function.

```javascript
Filter.custom(changes => changes.filter(c => c.type === 'update'))
```

## Composition

When multiple filters are provided, they run in order and each narrows the result of the previous one. Equivalent to logical AND:

```javascript
//  direct children of 'a' AND whose path starts with 'a.x'
//  → only changes to 'a.x'
{ filters: [Filter.directChildrenOf('a'), Filter.pathsStartWith('a.x')] }
```

## Validation

- `filters` (when provided) MUST be a non-empty array.
- Every element MUST be a `Filter` instance — bare functions are rejected. Use `Filter.custom(fn)` to wrap a function.
