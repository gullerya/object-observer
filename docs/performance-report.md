# Performance Report

### General
`object-observer` is purposed to be a low-level library.
It is designed to track and deliver changes in a __synchronous__ way, at least as of now.
As a such, I've put some effort to optimize it to have the least possible footprint on the consuming application.

Generally speaking, the framework implies some overhead on the following, when operating on __observed__ data sets:
- mutations of an observed objects: proxying the changes, detecting if there are any interested observers/listeners, building and delivering the changes
- reading from observed arrays: detection of read property is performed in order to supply array mutation methods like `shift`, `push`, `splice`, `reverse` etc
- mutation of __values__ that are objects / arrays: additional overhead comes from attaching / detaching those to the observed graph, proxying newcomers, revoking removed ones, creating internal system observers

Tests described below are covering most of those flows.

<span style="color:green">__In overall it looks to me, that `object-observer`'s impact on the application is negligible from both, CPU and memory aspects.__
</span>

### Hardware
All of the benchmarks below were performed on EliteBook 8570w:
- CPU i7-3720QM: 2.60GHz, 4 Cores, 8 Logical processors
- 16GB physical memory

### Tests

###### __CASE 1__ - creating observables, mutating nested primitive properties of an observable


1. __Creating__ in loop 100,000 observable from the object below, having few primitive properties, one non-observable nested object level 1 (Date), one nested object level 1, one nested object level 2 and one nested array level 1:
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

//  creation, while storing the result on the same variable
for (let i = 0; i < creationIterations; i++) {
    observable = Observable.from(person);
}
```

2. Last observable created in previous step is used to __mutate__ nested primitive property, while 2 observers added to watch for the changes, as following:
```javascript
//	add listeners/callbacks
observable.observe(changes => {
	if (!changes.length) throw new Error('expected to have at least one change in the list');
	else changesCountA += changes.length;
});
observable.observe(changes => {
	if (!changes) throw new Error('expected changes list to be defined');
	else changesCountB += changes.length;
});

//  deep mutation performed in a loop of 1,000,000
for (let i = 0; i < mutationIterations; i++) {
	observable.address.street.apt = i;
}
```

3. Then the same setup is used to __add__ 1,000,000 nested primitive properties, as following:
```javascript
for (let i = 0; i < mutationIterations; i++) {
	observable.address.street[i] = i;
}
```

4. Finally, those newly added properties are also being __deleted__, as following:
```javascript
for (let i = 0; i < mutationIterations; i++) {
	delete observable.address.street[i];
}
```

All of those mutations are being watched by the listeners mentioned above and counters verified to match an expectation.

Below are results of those tests, where 'total' is time for the whole loop, 'asot' stands for an average single operation time.
All times are given in 'ms', meaning that cost of a single operation on Chrome is usually half to few nanoseconds while climbing to a dozen/s of nanoseconds on Edge:

<table>
    <tr>
        <th style="width:70px;white-space:nowrap"></th>
        <th>create observable</th>
        <th>mutate primitive deep property</th>
        <th>add primitive deep property</th>
        <th>delete primitive deep property</th>
    </tr>
    <tr>
        <td style="width:70px;white-space:nowrap"><img src="https://github.com/gullerya/object-observer/raw/master/docs/browser_icons/chrome.png"><sub>69</sub></td>
        <td>
            asot: 0.00495<br>
            total: 459
        </td>
        <td>
            asot: 0.00048<br>
            total: 482.4
        </td>
        <td>
            asot: 0.000922<br>
            total: 922.4
        </td>
        <td>
            asot: 0.00096<br>
            total: 963.6
        </td>
    </tr>
    <tr>
        <td style="width:70px;white-space:nowrap"><img src="https://github.com/gullerya/object-observer/raw/master/docs/browser_icons/firefox.png"><sub>62.0.2</sub></td>
        <td>
            asot: 0.0148<br>
            total: 1482
        </td>
        <td>
            asot: 0.0008<br>
            total: 799
        </td>
        <td>
            asot: 0.00148<br>
            total: 1475
        </td>
        <td>
            asot: 0.0017<br>
            total: 1708
        </td>
    </tr>
    <tr>
        <td style="width:70px;white-space:nowrap"><img src="https://github.com/gullerya/object-observer/raw/master/docs/browser_icons/edge.png"><sub>13</sub></td>
        <td>
            asot: 0.025<br>
            total: 2530
        </td>
        <td>
            asot: 0.01<br>
            total: 10249
        </td>
        <td>
            asot: 0.011<br>
            total: 11048
        </td>
        <td>
            asot: 0.01<br>
            total: 10876
        </td>
    </tr>
    <tr>
        <td style="width:70px;white-space:nowrap"><img src="https://github.com/gullerya/object-observer/raw/master/docs/browser_icons/nodejs.png"><sub>8.11</sub></td>
        <td>--</td>
        <td>--</td>
        <td>--</td>
        <td>--</td>
    </tr>
</table>