import { getSuite } from '../../node_modules/just-test/dist/just-test.min.js';
import { Observable } from '../../dist/object-observer.js';

const suite = getSuite({ name: 'Testing Observable - objects' });

suite.runTest({ name: 'creating observable leaves original object as is' }, test => {
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
		test.fail('internal address object should remain the same');
	}
	if (address.street !== street) {
		test.fail('internal street object should remain the same');
	}
});

suite.runTest({ name: 'plain object operations' }, test => {
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
	if (events.length !== 3) test.fail('expected to have 3 data change events but counted ' + events.length);
	if (events[0].type !== 'update' || events[0].path.join('.') !== 'name' || events[0].oldValue !== 'name' || events[0].value !== 'new name' || events[0].object !== po) test.fail('event 0 did not fire as expected');
	if (events[1].type !== 'update' || events[1].path.join('.') !== 'age' || events[1].oldValue !== 7 || events[1].value !== 9 || events[1].object !== po) test.fail('event 1 did not fire as expected');
	if (events[2].type !== 'update' || events[2].path.join('.') !== 'address' || events[2].oldValue !== null || events[2].value !== po.address || events[2].object !== po) test.fail('event 2 did not fire as expected');

	po.address = null;              //  event 3
	po.sex = 'male';                //  event 4
	delete po.sex;                  //  event 5
	if (events.length !== 6) test.fail('expected to have 6 data change events but counted ' + events.length);
	if (events[3].type !== 'update' || events[3].path.join('.') !== 'address' || events[3].value !== null || events[3].object !== po) test.fail('event 3 did not fire as expected');
	if (events[4].type !== 'insert' || events[4].path.join('.') !== 'sex' || typeof events[4].oldValue !== 'undefined' || events[4].value !== 'male' || events[4].object !== po) test.fail('event 4 did not fire as expected');
	if (events[5].type !== 'delete' || events[5].path.join('.') !== 'sex' || events[5].oldValue !== 'male' || typeof events[5].value !== 'undefined' || events[5].object !== po) test.fail('event 5 did not fire as expected');
});

suite.runTest({ name: 'sub tree object operations' }, test => {
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
	if (events.length !== 1) test.fail('expected to have 1 data change events but counted ' + events.length);
	if (events[0].type !== 'update' || events[0].path.join('.') !== 'address' || events[0].oldValue !== null || events[0].value !== po.address || Object.keys(events[0].value).length !== 0 || events[0].object !== po) test.fail('event 0 did not fire as expected');

	po.address.street = 'street';
	po.addressB.street.name = 'new street name';
	if (events.length !== 3) test.fail('expected to have 3 data change events but counted ' + events.length);
	if (events[1].type !== 'insert' || events[1].path.join('.') !== 'address.street' || typeof events[1].oldValue !== 'undefined' || events[1].value !== 'street' || events[1].object !== po.address) test.fail('event 1 did not fire as expected');
	if (events[2].type !== 'update' || events[2].path.join('.') !== 'addressB.street.name' || events[2].oldValue !== 'street name' || events[2].value !== 'new street name' || events[2].object !== po.addressB.street) test.fail('event 2 did not fire as expected');
});

suite.runTest({ name: 'subgraph correctly detached when replaced' }, test => {
	let oo = Observable.from({ inner: {} }),
		events = [],
		eventsA = [],
		eventsB = [],
		inner = oo.inner;

	oo.observe(changes => Array.prototype.push.apply(events, changes));
	inner.observe(changes => Array.prototype.push.apply(eventsA, changes));

	inner.some = 'text';
	test.assertEqual(1, events.length);
	test.assertEqual(1, eventsA.length);

	oo.inner = {};
	oo.inner.observe(changes => Array.prototype.push.apply(eventsB, changes));
	test.assertEqual(2, events.length);
	test.assertEqual(1, eventsA.length);

	inner.some = 'other text';
	test.assertEqual(2, events.length);
	test.assertEqual(2, eventsA.length);
	test.assertEqual(0, eventsB.length);

	oo.inner.some = 'yet another';
	test.assertEqual(3, events.length);
	test.assertEqual(2, eventsA.length);
	test.assertEqual(1, eventsB.length);
});

suite.runTest({ name: 'subgraph correctly detached when deleted' }, test => {
	let oo = Observable.from({ inner: {} }),
		events = [],
		eventsA = [],
		inner = oo.inner;

	oo.observe(changes => Array.prototype.push.apply(events, changes));
	inner.observe(changes => Array.prototype.push.apply(eventsA, changes));

	inner.some = 'text';
	test.assertEqual(1, events.length);
	test.assertEqual(1, eventsA.length);

	delete oo.inner;

	inner.some = 'other text';
	test.assertEqual(2, events.length);
	test.assertEqual(2, eventsA.length);
});

suite.runTest({ name: 'subgraph proxy correctly processed when callbacks not yet set' }, test => {
	let o = {
		inner: {}
	}, oo = Observable.from(o),
		events = [],
		callback = function (changes) {
			[].push.apply(events, changes);
		};

	oo.observe(callback);
	oo.inner.some = 'text';
	if (events.length !== 1) test.fail('preliminary check failed, expected to observe 1 change');
	oo.unobserve(callback);

	oo.inner = {};
	events = [];
	oo.observe(callback);
	oo.inner.other = 'text';
	if (events.length !== 1) test.fail('preliminary check failed, expected to observe 1 change');
});

suite.runTest({ name: 'subgraph objects pointing to the same object few times', skip: true }, test => {
	let childObj = { prop: 'A' },
		mainObj = { childA: childObj, childB: childObj };

	let obsMainObj = Observable.from(mainObj);
	obsMainObj.observe(changes => console.dir(changes));

	obsMainObj.childA.prop = 'B';

	if (obsMainObj.childA.prop !== obsMainObj.childB.prop) test.fail('expected shared object to be updated symmetrically, but found: ' + obsMainObj.childA.prop + ' - ' + obsMainObj.childB.prop);
});