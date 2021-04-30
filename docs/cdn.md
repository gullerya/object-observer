# CDN provisioning

CDN provisioning is a general convenience feature, which also provides:
- security:
  - __HTTPS__ only
  - __intergrity__ checksum provided, see below
- performance
  - highly __available__ (with many geo spread edges)
  - agressive __caching__ setup

## Usage

Import `object-observer` directly from CDN:
```js
import { Observable } from 'https://libs.gullerya.com/object-observer/x.y.z/object-observer.min.js';
```

> Note: regular and minified resouces are available.

> Note: replace the `x.y.z` with the desired version, one of the listed in the [changelog](changelog.md).

## Integrity (SRI)

Security feature `integrity` was defined specifically to fortify a consumption of a CDN delivered modules.
`object-observer` adheres to this effort and provides integrity checksums per release (starting from v4.3.0).

Checksums provided per version for both, regular and minified resources:

| Version | Resource | Integrity checksum |
|---------|----------|--------------------|
<!--INSERT-MARKER-->

### Use with `integrity`

To begin with, detailed descripton on SRI (Subresource Integrity) [found here](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity).

Since `object-observer` provides ES6 module syntax, the approach described in the documentation above and elsewhere is not applicable.
In this case, and until better way available (like [this proposal](https://github.com/tc39/proposal-import-assertions/issues/113) of myself), one is required to use `<link rel="modulepreload">` in __addition__ to the regular `import` in order to enforce integrity validation.

Thus, please add the below HTML piece in your HTML, when willing to use enforce the module's integrity:
```html
<link rel="modulepreload" 
  href="https://libs.gullerya.com/object-observer/x.y.z/object-observer.min.js"
  integrity="sha512-hash">
```

> Note: replace the `hash` with the relevant value as per version and regular/minified resource from the table above.

> Note: replace the `x.y.z` with the desired version, one of the listed in the [changelog](changelog.md).

> Note: `modulepreload` in general and `integrity` attribute with it in particular are still having a limited support.