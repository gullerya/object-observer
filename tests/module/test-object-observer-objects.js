import { Observable } from '../../dist/object-observer.js';

let suite = Utils.JustTest.createSuite({ name: 'Testing Observable - objects' });

suite.addTest({ name: 'creating observable leaves original object as is' }, (pass, fail) => {
	let person = {
		name: 'name',
		age: 7
	},
		address = { city: 'city' },
		street = { name: 'street', apt: 234 },
		po;

	address.street = street;
	person.address = address;

	po = Observable.from(person);

	if (person.address !== address) {
		fail('internal address object should remain the same');
	}
	if (address.street !== street) {
		fail('internal street object should remain the same');
	}

	pass();
});

suite.addTest({ name: 'plain object operations' }, (pass, fail) => {
	let o = {
		name: 'name',
		age: 7,
		address: null
	}, po, events = [], tmpAddress = { street: 'some' };

	po = Observable.from(o);
	po.observe(changes => {
		[].push.apply(events, changes);
	});

	po.name = 'new name';           //  event 0
	po.age = 9;                     //  event 1
	po.address = tmpAddress;        //  event 2
	if (events.length !== 3) fail('expected to have 3 data change events but counted ' + events.length);
	if (events[0].type !== 'update' || events[0].path.join('.') !== 'name' || events[0].oldValue !== 'name' || events[0].value !== 'new name' || events[0].object !== po) fail('event 0 did not fire as expected');
	if (events[1].type !== 'update' || events[1].path.join('.') !== 'age' || events[1].oldValue !== 7 || events[1].value !== 9 || events[1].object !== po) fail('event 1 did not fire as expected');
	if (events[2].type !== 'update' || events[2].path.join('.') !== 'address' || events[2].oldValue !== null || events[2].value !== po.address || events[2].object !== po) fail('event 2 did not fire as expected');

	po.address = null;              //  event 3
	po.sex = 'male';                //  event 4
	delete po.sex;                  //  event 5
	if (events.length !== 6) fail('expected to have 6 data change events but counted ' + events.length);
	if (events[3].type !== 'update' || events[3].path.join('.') !== 'address' || events[3].value !== null || events[3].object !== po) fail('event 3 did not fire as expected');
	if (events[4].type !== 'insert' || events[4].path.join('.') !== 'sex' || typeof events[4].oldValue !== 'undefined' || events[4].value !== 'male' || events[4].object !== po) fail('event 4 did not fire as expected');
	if (events[5].type !== 'delete' || events[5].path.join('.') !== 'sex' || events[5].oldValue !== 'male' || typeof events[5].value !== 'undefined' || events[5].object !== po) fail('event 5 did not fire as expected');

	pass();
});

suite.addTest({ name: 'sub tree object operations' }, (pass, fail) => {
	let person = {
		name: 'name',
		age: 7,
		address: null,
		addressB: {
			street: {
				name: 'street name',
				apt: 123
			}
		}
	}, po, events = [], newAddress = {};

	po = Observable.from(person);
	po.observe(changes => {
		[].push.apply(events, changes);
	});

	po.address = newAddress;
	if (events.length !== 1) fail('expected to have 1 data change events but counted ' + events.length);
	if (events[0].type !== 'update' || events[0].path.join('.') !== 'address' || events[0].oldValue !== null || events[0].value !== po.address || Object.keys(events[0].value).length !== 0 || events[0].object !== po) fail('event 0 did not fire as expected');

	po.address.street = 'street';
	po.addressB.street.name = 'new street name';
	if (events.length !== 3) fail('expected to have 3 data change events but counted ' + events.length);
	if (events[1].type !== 'insert' || events[1].path.join('.') !== 'address.street' || typeof events[1].oldValue !== 'undefined' || events[1].value !== 'street' || events[1].object !== po.address) fail('event 1 did not fire as expected');
	if (events[2].type !== 'update' || events[2].path.join('.') !== 'addressB.street.name' || events[2].oldValue !== 'street name' || events[2].value !== 'new street name' || events[2].object !== po.addressB.street) fail('event 2 did not fire as expected');

	pass();
});

suite.addTest({ name: 'subgraph proxy correctly revoked when replaced' }, (pass, fail) => {
	let o = {
		inner: {}
	}, oo = Observable.from(o),
		events = [],
		tmp;

	oo.observe(function (changes) {
		[].push.apply(events, changes);
	});

	tmp = oo.inner;
	tmp.some = 'text';
	if (events.length !== 1) fail('preliminary check failed, expected to observe 1 change');

	oo.inner = null;
	events = [];
	try {
		tmp.some = 'other text';
		fail('flow is not supposed to get to this point');
	} catch (e) {
	}

	if (events.length !== 0) fail('expected to not-observe any changes anymore');

	pass();
});

suite.addTest({ name: 'subgraph proxy correctly revoked when deleted' }, (pass, fail) => {
	let o = {
		inner: {}
	}, oo = Observable.from(o),
		events = [],
		tmp;

	oo.observe(function (changes) {
		[].push.apply(events, changes);
	});

	tmp = oo.inner;
	tmp.some = 'text';
	if (events.length !== 1) fail('preliminary check failed, expected to observe 1 change');

	delete oo.inner;
	events = [];
	try {
		tmp.some = 'other text';
		fail('flow is not supposed to get to this point');
	} catch (e) {
	}

	if (events.length !== 0) fail('expected to not-observe any changes anymore');

	pass();
});

suite.addTest({ name: 'subgraph proxy correctly processed when callbacks not yet set' }, (pass, fail) => {
	let o = {
		inner: {}
	}, oo = Observable.from(o),
		events = [],
		callback = function (changes) {
			[].push.apply(events, changes);
		};

	oo.observe(callback);
	oo.inner.some = 'text';
	if (events.length !== 1) fail('preliminary check failed, expected to observe 1 change');
	oo.unobserve(callback);

	oo.inner = {};
	events = [];
	oo.observe(callback);
	oo.inner.other = 'text';
	if (events.length !== 1) fail('preliminary check failed, expected to observe 1 change');

	pass();
});

suite.addTest({ name: 'subgraph objects pointing to the same object few times', skip: true }, (pass, fail) => {
	let childObj = { prop: 'A' },
		mainObj = { childA: childObj, childB: childObj };

	let obsMainObj = Observable.from(mainObj);
	obsMainObj.observe(changes => console.dir(changes));

	obsMainObj.childA.prop = 'B';

	if (obsMainObj.childA.prop !== obsMainObj.childB.prop) fail('expected shared object to be updated symmetrically, but found: ' + obsMainObj.childA.prop + ' - ' + obsMainObj.childB.prop);

	pass();
});

suite.run();