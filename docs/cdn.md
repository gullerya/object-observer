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

Security feature `integrity` was introduced specifically to fortify a consumption of a CDN delivered modules.
`object-observer` adheres to this effort and provides integrity checksums per release (starting from version `4.2.4`).

### Usage example

To begin with, detailed description on SRI (Subresource Integrity) [found here](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity).

Since `object-observer` provides ES6 module syntax, the approach described in the documentation above and elsewhere is not applicable.
In this case, and until a better way available (like [this proposal](https://github.com/tc39/proposal-import-assertions/issues/113) of myself), one is required to use `<link rel="modulepreload">` in __addition__ to the regular `import` in order to enforce integrity validation.

Thus, please add the below HTML piece in your HTML, when willing to enforce the module's integrity:
```html
<link rel="modulepreload" 
  href="https://libs.gullerya.com/object-observer/x.y.z/object-observer.min.js"
  integrity="hash">
```

> Note: version (to be put instead of `x.y.z`) and resource kind (regular/minified) should be the same as you use in the application. Accordingly, replace the `hash` with the relevant value as per version and resource, see below.

> Note: `modulepreload` in general and `integrity` attribute with it in particular are still having a limited support.

### Integrity checksums

Checksums provided per version for both, regular and minified resources.

From version `4.6.6` SRI hashes provided via Git and NPM, by `sri.json` file:
- Git: check out version tag, then find `sri.json` file in the repo root
- GitHub: visit the file via GitHub UI at version tag, eg [this link](https://github.com/gullerya/object-observer/blob/v4.6.6/sri.json) (pay attention to the version tag in the URL)
- NPM: do install `object-observer` via `npm install...`, then find `sri.json` file in your `node_modules/object-observer` folder

Below are SRI hashes of the pre-`4.6.6` version:

| Version | Resource | Integrity checksum (hash) |
|---------|----------|---------------------------|
|<!--INSERT-MARKER-->
| 4.6.0 | `object-observer.js` | `sha512-2SzwdAYs8e6Kh9qst3WsrQBHoALF0fqeHzFrbMwjjfPYvUJkpn0c0jBFs/rolSAtYCWK22h+Z3Ht6o5Wy80CyA==` |
| 4.6.0 | `object-observer.min.js` | `sha512-nxyrR/lamznRJA5CgXiTGdyyaXbfUaKa9bLYTcqLHlMG8rznT4j7VBewWGTsrjD5xFQxtn7VnlRhT/MF0hO3fA==` |
| 4.5.0 | `object-observer.js` | `sha512-PRxMMuoda0rmLHMFCguy2CSySHoWyCZtFIy+N7gzBHAOB9QYs0VGx8PbaHUhpyo0VwHDY/2L02bDZzmfAq3aIQ==` |
| 4.5.0 | `object-observer.min.js` | `sha512-Xn4niKWPRT5W502IEgfafP4W+agpLcE6Y/arwL2/kP5FQq1rFP5B6WRZiLPlT++qxGXHkKejduWo6L7SAVh0Sg==` |
| 4.4.0 | `object-observer.js` | `sha512-4l0Q/VlM/3dyYEiH6zp4qQ7oFoe6lcyKFDTU+wJ04LwK9o9hzvBYfmHzFlt4kicfGe4U8u+D+AD3onTQuQBoaw==` |
| 4.4.0 | `object-observer.min.js` | `sha512-zlqhnAOtENZ58r5GzmpbvYQMr9JrII7YrxJ9SEWQXNIZUhL/rZDTm3g0uH1895kbPKv/zIK59XcfrmAWtR/QDA==` |
| 4.3.2 | `object-observer.js` | `sha512-KIVmA1D/MQMPfJ2DunNeugVrTsOjt/q9BU2+C2E4PEMT+Om5kRE8nl/at+zBKbO7yUih/T9VmiQw50mROPfI/A==` |
| 4.3.2 | `object-observer.min.js` | `sha512-lpc5mmJKkVVMt5Cus2qHKN+9WppzIEqyBuT1ROmI2w+dC+RRwi0jB9p0El55Yoh2m5cmDOcXbv3YMyWQd22oZA==` |
| 4.3.1 | `object-observer.js` | `sha512-KIVmA1D/MQMPfJ2DunNeugVrTsOjt/q9BU2+C2E4PEMT+Om5kRE8nl/at+zBKbO7yUih/T9VmiQw50mROPfI/A==` |
| 4.3.1 | `object-observer.min.js` | `sha512-lpc5mmJKkVVMt5Cus2qHKN+9WppzIEqyBuT1ROmI2w+dC+RRwi0jB9p0El55Yoh2m5cmDOcXbv3YMyWQd22oZA==` |
| 4.3.0 | `object-observer.js` | `sha512-KIVmA1D/MQMPfJ2DunNeugVrTsOjt/q9BU2+C2E4PEMT+Om5kRE8nl/at+zBKbO7yUih/T9VmiQw50mROPfI/A==` |
| 4.3.0 | `object-observer.min.js` | `sha512-lpc5mmJKkVVMt5Cus2qHKN+9WppzIEqyBuT1ROmI2w+dC+RRwi0jB9p0El55Yoh2m5cmDOcXbv3YMyWQd22oZA==` |
| 4.2.4 | `object-observer.js` | `sha512-hS94aprLMMSBEKeIeXwdsSNjNjsaxaUjdUH029d5fga93buCNxXMcgusb5ELGUhbzi2qkjfQT8s/6m2PnwvCsQ==` |
| 4.2.4 | `object-observer.min.js` | `sha512-o98LgLvzBtc6j+XkCtt0K3JS9FxYwkDdEWduD1yX8gqRtte1Eg5E8iTfoKzLC+fcB2fYrmzrQM3G2mLm8Z1nOQ==` |
