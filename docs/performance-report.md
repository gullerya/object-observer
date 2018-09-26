# Performance Report

### General
`object-observer` is purposed to be a low-level library.
It is designed to track and deliver changes in __synchronous__ way, at least as of now.
As a such, I've put some effort to optimize it to have least possible footprint on the consuming application.
Generally speaking, the framework implies some overhead on the following areas:
- mutations of an observed objects (proxying the changes, detecting if there are any interested observers/listeners, building and delivering the changes
- reading from observed arrays (detection of read property is performed in order to supply array mutation methods like `shift`, `push`, `splice`, `reverse` etc)
- when mutated __values__ are objects / arrays, there is an additional overhead of attaching / detaching those to the observed graph (proxying newcomers, revoking removed ones, creating internal system observers)

Tests described below are covering most of those flows.

__In overall it looks to me, that `object-observer`'s impact on the application is negligible from both, CPU and memory aspects.__

### Hardware
All of the benchmarks below were performed on EliteBook 8570w:
- CPU i7-3720QM: 2.60GHz, 4 Cores, 8 Logical processors
- 16GB physical memory

### Tests

###### __TEST 1__ - creating 10000 observables

Creating in loop 10000 observable from the object below, having few primitive properties, one non-observable nested object level 1 (Date), one nested object level 1, one nested object level 2 and one nested array level 1:
```javascript
let person = {
    name: 'Anna Guller',
    accountCreated: new Date(),
    age: 20,
    address: {
        city: 'Dreamland',
        street: {
            name: 'Hope',
            apt: 123
        }
    },
    orders: []
};
```

<table>
    <tr>
        <th></th>
        <th>create observable</th>
        <th>mutate primitive deep property</th>
        <th>add primitive deep property</th>
        <th>delete primitive deep property</th>
    </tr>
    <tr>
        <td><img src="https://github.com/gullerya/object-observer/raw/master/docs/browser_icons/chrome.png"><sub>69</sub></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
    </tr>
    <tr>
        <td><img src="https://github.com/gullerya/object-observer/raw/master/docs/browser_icons/firefox.png"><sub>62.0.2</sub></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
    </tr>
    <tr>
        <td><img src="https://github.com/gullerya/object-observer/raw/master/docs/browser_icons/edge.png"><sub>69</sub></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
    </tr>
    <tr>
        <td><img src="https://github.com/gullerya/object-observer/raw/master/docs/browser_icons/nodejs.png"><sub>8.11.4</sub></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
    </tr>
</table>