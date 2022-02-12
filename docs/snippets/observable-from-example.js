import { Observable } from 'https://libs.gullerya.com/object-observer/4.2.2/object-observer.js';

//	raw data created in client or fetched from server
let user = {
	name: 'Nava',
	age: 8,
	address: {
		street: 'Noway',
		block: 50,
		city: 'Sin City',
		country: 'Neverland'
	}
};

//	setup observation
let observableUser = Observable.from(user);
Observable.observe(observableUser, changes => console.log(changes));

//	now lets play with some changes to see the results (see the console log in dev tools)
observableUser.name = 'Nava Guller';
delete observableUser.age;
observableUser.address.block = 49;
observableUser.friends = [];
observableUser.friends.push({
	name: 'Aya',
	age: 2
}, {
	name: 'Uria',
	age: 10
}, {
	name: 'Alice',
	age: 12
});

//	when loggin the Observable, you'll see many internal properties
console.log(observableUser);

//	...but when picking the iterable keys there will only be the relevant ones
console.log(Object.keys(observableUser).join(', '));

//	...and so will be the case if serializing the Observable
console.log(JSON.stringify(observableUser));