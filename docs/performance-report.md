# Performance Report

### General
`object-observer` is purposed to be a low-level library.
It is designed to track and deliver changes in a __synchronous__ way, at least as of now.
As a such, I've put some effort to optimize it to have the least possible footprint on the consuming application.

Generally speaking, the framework implies some overhead on the following, when operating on __observed__ data sets:
- mutations of an observed objects: proxying the changes, detecting if there are any interested observers/listeners, building and delivering the changes
- reading from observed arrays: detection of read property is performed in order to supply array mutation methods like `shift`, `push`, `splice`, `reverse` etc
- mutation of __values__ that are objects / arrays: additional overhead comes from attaching / detaching those to the observed graph, proxying newcomers, revoking removed ones, creating internal system observers

Pay attention: __each and every__ object / array (including all the nested ones) added to the observed tree processed by means of cloning and turning into observed one; in the same way, __each and every__ object / array removed from the observed tree is being 'restored' (proxy revoked and cloned object returned, but not to the actual original object).

Tests described below are covering most of those flows.

<span style="color:green">__In overall it looks to me, that `object-observer`'s impact on the application is negligible from both, CPU and memory aspects.__
</span>

### Hardware
All of the benchmarks below were performed on EliteBook 8570w:
- CPU i7-3720QM: 2.60GHz, 4 Cores, 8 Logical processors
- 16GB physical memory

### Tests

##### __CASE 1__ - creating observables, mutating nested primitive properties of an observable

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

All of those mutations are being watched by the listeners mentioned above and the counters are being verified to match the expectations.

Below are results of those tests, where 'one' is the time of a single operation in average achieved with division of time for 'all' on the number of iterations.
All times are given in 'ms', meaning that cost of a single operation on Chrome is usually half to few nanoseconds while climbing to a dozen/s of nanoseconds on Edge (see remark below related to Edge):

<table>
    <tr>
        <th style="width:75px;white-space:nowrap"></th>
        <th>create observable<br>100,000 times</th>
        <th>mutate primitive<br>deep L3; 1M times</th>
        <th>add primitive<br>deep L3; 1M times</th>
        <th>delete primitive<br>deep L3; 1M times</th>
    </tr>
    <tr style="font-family:monospace">
        <td style="width:75px;white-space:nowrap;font-family:sans-serif"><img src="https://github.com/gullerya/object-observer/raw/master/docs/browser_icons/chrome.png"><sub>69</sub></td>
        <td>
            one: 0.00495 ms<br>
            all: 459 ms
        </td>
        <td>
            one: 0.00048 ms<br>
            all: 482.4 ms
        </td>
        <td>
            one: 0.000922 ms<br>
            all: 922.4 ms
        </td>
        <td>
            one: 0.00096 ms<br>
            all: 963.6 ms
        </td>
    </tr>
    <tr style="font-family:monospace">
        <td style="width:75px;white-space:nowrap;font-family:sans-serif"><img src="https://github.com/gullerya/object-observer/raw/master/docs/browser_icons/firefox.png"><sub>62.0.2</sub></td>
        <td>
            one: 0.0148 ms<br>
            all: 1482 ms
        </td>
        <td>
            one: 0.0008 ms<br>
            all: 799 ms
        </td>
        <td>
            one: 0.00148 ms<br>
            all: 1475 ms
        </td>
        <td>
            one: 0.0017 ms<br>
            all: 1708 ms
        </td>
    </tr>
    <tr style="font-family:monospace">
        <td style="width:75px;white-space:nowrap;font-family:sans-serif"><img src="https://github.com/gullerya/object-observer/raw/master/docs/browser_icons/edge.png"><sub>13</sub></td>
        <td>
            one: 0.025 ms<br>
            all: 2530 ms
        </td>
        <td>
            one: 0.01 ms<br>
            all: 10249 ms
        </td>
        <td>
            one: 0.011 ms<br>
            all: 11048 ms
        </td>
        <td>
            one: 0.01 ms<br>
            all: 10876 ms
        </td>
    </tr>
    <tr style="font-family:monospace">
        <td style="width:75px;white-space:nowrap;font-family:sans-serif"><img src="https://github.com/gullerya/object-observer/raw/master/docs/browser_icons/edge.png"><sub>17</sub></td>
        <td>
            one: 0.014 ms<br>
            all: 1433.1 ms
        </td>
        <td>
            one: 0.0013 ms<br>
            all: 1286.3 ms
        </td>
        <td>
            one: 0.00187 ms<br>
            all: 1870.3 ms
        </td>
        <td>
            one: 0.002 ms<br>
            all: 1987.8 ms
        </td>
    </tr>
    <tr style="font-family:monospace">
        <td style="width:75px;white-space:nowrap;font-family:sans-serif"><img src="https://github.com/gullerya/object-observer/raw/master/docs/browser_icons/nodejs.png"><sub></sub></td>
        <td>--</td>
        <td>--</td>
        <td>--</td>
        <td>--</td>
    </tr>
</table>

##### __CASE 2__ - filling an array by pushing objects, mutating nested arrays of those, popping the array back to empty

1. __Pushing__ in loop 100,000 objects as below in an array nested 1 level:
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
},
dataset = {
    users: []
},
observable = Observable.from(dataset);      //  the observable we'll be working with

//  filling the array of users
for (let i = 0; i < mutationIterations; i++) {
    observable.users.push(person);
}
```

2. __Mutating__ nested `orders` array from an empty to the below one:
```javascript
let orders = [
    {id: 1, description: 'some description', sum: 1234, date: new Date()},
    {id: 2, description: 'some description', sum: 1234, date: new Date()},
    {id: 3, description: 'some description', sum: 1234, date: new Date()}
];

for (let i = 0; i < mutationIterations; i++) {
    observable.users[i].orders = orders;
}
```

3. Finally, the base `users` array is being emptied by popping it to the end:
```javascript
for (let i = 0; i < mutationIterations; i++) {
    observable.users.pop();
}
```

All of those mutations are being watched by the same 2 listeners from CASE 1 and the counters are being verified to match the expectations.

<table>
    <tr>
        <th style="width:75px;white-space:nowrap"></th>
        <th>push 100,000 objects</th>
        <th>replace nested array 100,000 times</th>
        <th>pop 100,000 objects</th>
    </tr>
    <tr style="font-family:monospace">
        <td style="width:75px;white-space:nowrap;font-family:sans-serif"><img src="https://github.com/gullerya/object-observer/raw/master/docs/browser_icons/chrome.png"><sub>69</sub></td>
        <td>
            one: 0.0044 ms<br>
            all: 442.4 ms
        </td>
        <td>
            one: 0.0056 ms<br>
            all: 560 ms
        </td>
        <td>
            one: 0.0033 ms<br>
            all: 326.6 ms
        </td>
    </tr>
    <tr style="font-family:monospace">
        <td style="width:75px;white-space:nowrap;font-family:sans-serif"><img src="https://github.com/gullerya/object-observer/raw/master/docs/browser_icons/firefox.png"><sub>62.0.2</sub></td>
        <td>
            one: 0.016 ms<br>
            all: 1590 ms
        </td>
        <td>
            one: 0.02 ms<br>
            all: 2129 ms
        </td>
        <td>
            one: 0.011ms<br>
            all: 1129 ms
        </td>
    </tr>
    <tr style="font-family:monospace">
        <td style="width:75px;white-space:nowrap;font-family:sans-serif"><img src="https://github.com/gullerya/object-observer/raw/master/docs/browser_icons/edge.png"><sub>13</sub></td>
        <td>
            one: 0.034 ms<br>
            all: 3425 ms
        </td>
        <td>
            one: 0.038 ms<br>
            all: 3802 ms
        </td>
        <td>
            one: 0.032 ms<br>
            all: 3246 ms
        </td>
    </tr>
    <tr style="font-family:monospace">
        <td style="width:75px;white-space:nowrap;font-family:sans-serif"><img src="https://github.com/gullerya/object-observer/raw/master/docs/browser_icons/edge.png"><sub>17</sub></td>
        <td>
            one: 0.017 ms<br>
            all: 1683.7 ms
        </td>
        <td>
            one: 0.025 ms<br>
            all: 2477.1 ms
        </td>
        <td>
            one: 0.02 ms<br>
            all: 2007.7 ms
        </td>
    </tr>
    <tr style="font-family:monospace">
        <td style="width:75px;white-space:nowrap;font-family:sans-serif"><img src="https://github.com/gullerya/object-observer/raw/master/docs/browser_icons/nodejs.png"><sub></sub></td>
        <td>--</td>
        <td>--</td>
        <td>--</td>
    </tr>
</table>

> Edge has shown huge improvement from v13 to v17.
This happens to be mostly due to the ability to preserve the console log when DevTools are closed.
Seems like opened DevTools of Edge have vast negative impact on the page/s performance up to and including v17.