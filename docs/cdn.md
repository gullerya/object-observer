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

### Use with `integrity`

To begin with, detailed descripton on SRI (Subresource Integrity) [found here](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity).

Particularly, in order to make browser ensuring the integrity of `object-observer`, use the following syntax:

```html
<script
  type="module"
  intergrity="hash"
  crossorigin="anonymous"
  scr="https://libs.gullerya.com/object-observer/x.y.z/object-observer.min.js"></script>
```

> Note: replace the `hash` with the relevant value as per version and regular/minified resource from the table above.

> Note: replace the `x.y.z` with the desired version, one of the listed in the [changelog](changelog.md).