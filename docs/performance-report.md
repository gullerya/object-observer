# Performance Report

### General
`object-observer` is purposed to be a low-level library.
It is designed to track and deliver changes in a __synchronous__ way, being __async__ possible as opt in.
As a such, I've put some effort to optimize it to have the least possible footprint on the consuming application.

Generally speaking, the framework implies some overhead on the following, when operating on __observed__ data sets:
- mutations of an observed objects: proxying the changes, detecting if there are any interested observers/listeners, building and delivering the changes
- reading from observed arrays: detection of read property is performed in order to supply array mutation methods like `shift`, `push`, `splice`, `reverse` etc
- mutation of __values__ that are objects / arrays: additional overhead comes from attaching / detaching those to the observed graph, proxying newcomers, revoking removed ones, creating internal system observers

Pay attention: __each and every__ object / array (including all the nested ones) added to the observed tree processed by means of cloning and turning into observed one; in the same way, __each and every__ object / array removed from the observed tree is being 'restored' (proxy revoked and cloned object returned, but not to the actual original object).

Tests described below are covering most of those flows.

<span style="color:green">__Overall, `object-observer`'s impact on the application is negligible from both, CPU and memory aspects.__
</span>

### Hardware
All of the benchmarks below were performed on __MacBook Pro__ (model 2019, Ventura 13.2.1), plugged in at the moment of tests:
- CPU 2.6 GHz 6-Core Intel Core i7
- 16 GB 2667 MHz DDR4

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
Observable.observe(observable, changes => {
    if (!changes.length) throw new Error('expected to have at least one change in the list');
    else changesCountA += changes.length;
});
Observable.observe(observable, changes => {
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

Below are results of those tests, where the time shown is of a single operation in average.
All times are given in 'ms', meaning that cost of a single operation on Chromiums/NodeJS is usually half to few nanoseconds. Firefox values are slightly higher (worse).

<table>
    <tr>
        <th style="width:75px;white-space:nowrap"></th>
        <th>create observable<br>100,000 times</th>
        <th>mutate primitive<br>depth L3; 1M times</th>
        <th>add primitive<br>depth L3; 1M times</th>
        <th>delete primitive<br>depth L3; 1M times</th>
    </tr>
    <tr style="font-family:monospace">
        <td style="width:75px;white-space:nowrap;font-family:sans-serif"><img src="browser-icons/chrome.png"><sub>98</sub></td>
        <td>
            0.001 ms
        </td>
        <td>
            0.0004 ms
        </td>
        <td>
            0.0006 ms
        </td>
        <td>
            0.0005 ms
        </td>
    </tr>
    <tr style="font-family:monospace">
        <td style="width:75px;white-space:nowrap;font-family:sans-serif"><img src="browser-icons/edge-chromium.png"><sub>80</sub></td>
        <td>
            0.001 ms
        </td>
        <td>
            0.0004 ms
        </td>
        <td>
            0.0006 ms
        </td>
        <td>
            0.0005 ms
        </td>
    </tr>
    <tr style="font-family:monospace">
        <td style="width:75px;white-space:nowrap;font-family:sans-serif"><img src="browser-icons/firefox.png"><sub>74</sub></td>
        <td>
            0.0047 ms
        </td>
        <td>
            0.0007 ms
        </td>
        <td>
            0.0007 ms
        </td>
        <td>
            0.0011 ms
        </td>
    </tr>
    <tr style="font-family:monospace">
        <td style="width:75px;white-space:nowrap;font-family:sans-serif"><img src="browser-icons/nodejs.png"><sub>18.14.2</sub></td>
        <td>
            0.0016 ms
        </td>
        <td>
            0.001 ms
        </td>
        <td>
            0.001 ms
        </td>
        <td>
            0.001 ms
        </td>
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
        <td style="width:75px;white-space:nowrap;font-family:sans-serif"><img src="browser-icons/chrome.png"><sub>98</sub></td>
        <td>
            0.002 ms
        </td>
        <td>
            0.003 ms
        </td>
        <td>
            0.0008 ms
        </td>
    </tr>
    <tr style="font-family:monospace">
        <td style="width:75px;white-space:nowrap;font-family:sans-serif"><img src="browser-icons/edge-chromium.png"><sub>98</sub></td>
        <td>
            0.002 ms
        </td>
        <td>
            0.003 ms
        </td>
        <td>
            0.0008 ms
        </td>
    </tr>
    <tr style="font-family:monospace">
        <td style="width:75px;white-space:nowrap;font-family:sans-serif"><img src="browser-icons/firefox.png"><sub>74</sub></td>
        <td>
            0.0077 ms
        </td>
        <td>
            0.0096 ms
        </td>
        <td>
            0.0011 ms
        </td>
    </tr>
    <tr style="font-family:monospace">
        <td style="width:75px;white-space:nowrap;font-family:sans-serif"><img src="browser-icons/nodejs.png"><sub>18.14.2</sub></td>
        <td>
            0.005 ms
        </td>
        <td>
            0.005 ms
        </td>
        <td>
            0.001 ms
        </td>
    </tr>
</table>
