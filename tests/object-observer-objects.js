import { assert } from 'chai';
import { getSuite } from 'just-test/suite';
import { Observable } from '../src/object-observer.js';

const suite = getSuite('Testing Observable - objects');

suite.test('creating observable leaves original object as is', () => {
	const person = {
		name: 'name',
		age: 7
	};
	const
		address = { city: 'city' },
		street = { name: 'street', apt: 234 };

	address.street = street;
	person.address = address;

	Observable.from(person);

	assert.deepStrictEqual(person.address, address);
});

suite.test('creating observable preserves original object keys order', () => {
	const person = {
		name: 'name',
		age: 7,
		street: 'street',
		block: 9,
		apt: 1
	};
	const oPerson = Observable.from(person);
	const sKeys = Object.keys(person);
	const oKeys = Object.keys(oPerson);

	assert.strictEqual(sKeys.length, oKeys.length);
	for (const [i, key] of Object.entries(sKeys)) {
		assert.strictEqual(key, oKeys[i]);
	}
});

suite.test('plain object operations', () => {
	const o = {
		name: 'name',
		age: 7,
		address: null
	}
	const
		events = [],
		tmpAddress = { street: 'some' };

	const po = Observable.from(o);
	Observable.observe(po, changes => {
		[].push.apply(events, changes);
	});

	const v1 = po.name = 'new name';
	const v2 = po.age = 9;
	const v3 = po.address = tmpAddress;
	assert.strictEqual(v1, 'new name');
	assert.strictEqual(v2, 9);
	assert.deepStrictEqual(v3, tmpAddress);
	assert.strictEqual(events.length, 3);
	assert.deepStrictEqual(events[0], { type: 'update', path: ['name'], value: 'new name', oldValue: 'name', object: po });
	assert.deepStrictEqual(events[1], { type: 'update', path: ['age'], value: 9, oldValue: 7, object: po });
	assert.deepStrictEqual(events[2], { type: 'update', path: ['address'], value: po.address, oldValue: null, object: po });

	const v4 = po.address = null;
	const v5 = po.sex = 'male';
	delete po.sex;
	assert.strictEqual(v4, null);
	assert.strictEqual(v5, 'male');
	assert.strictEqual(events.length, 6);
	assert.deepStrictEqual(events[3], { type: 'update', path: ['address'], value: null, oldValue: { street: 'some' }, object: po });
	assert.deepStrictEqual(events[4], { type: 'insert', path: ['sex'], value: 'male', oldValue: undefined, object: po });
	assert.deepStrictEqual(events[5], { type: 'delete', path: ['sex'], value: undefined, oldValue: 'male', object: po });
});

suite.test('sub tree object operations', () => {
	const person = {
		name: 'name',
		age: 7,
		address: null,
		addressB: {
			street: {
				name: 'street name',
				apt: 123
			}
		}
	};
	const
		events = [],
		newAddress = {};

	const po = Observable.from(person);
	Observable.observe(po, changes => {
		[].push.apply(events, changes);
	});

	po.address = newAddress;
	assert.strictEqual(events.length, 1);
	assert.deepStrictEqual(events[0], { type: 'update', path: ['address'], value: po.address, oldValue: null, object: po });

	po.address.street = 'street';
	po.addressB.street.name = 'new street name';
	assert.strictEqual(events.length, 3);
	assert.deepStrictEqual(events[1], { type: 'insert', path: ['address', 'street'], value: 'street', oldValue: undefined, object: po.address });
	assert.deepStrictEqual(events[2], { type: 'update', path: ['addressB', 'street', 'name'], value: 'new street name', oldValue: 'street name', object: po.addressB.street });
});

suite.test('subgraph correctly detached when replaced', () => {
	const
		oo = Observable.from({ inner: {} }),
		events = [],
		eventsA = [],
		eventsB = [],
		inner = oo.inner;

	Observable.observe(oo, changes => Array.prototype.push.apply(events, changes));
	Observable.observe(inner, changes => Array.prototype.push.apply(eventsA, changes));

	inner.some = 'text';
	assert.strictEqual(1, events.length);
	assert.strictEqual(1, eventsA.length);

	oo.inner = {};
	Observable.observe(oo.inner, changes => Array.prototype.push.apply(eventsB, changes));
	assert.strictEqual(2, events.length);
	assert.strictEqual(1, eventsA.length);

	inner.some = 'other text';
	assert.strictEqual(2, events.length);
	assert.strictEqual(2, eventsA.length);
	assert.strictEqual(0, eventsB.length);

	oo.inner.some = 'yet another';
	assert.strictEqual(3, events.length);
	assert.strictEqual(2, eventsA.length);
	assert.strictEqual(1, eventsB.length);
});

suite.test('subgraph correctly detached when deleted', () => {
	const
		oo = Observable.from({ inner: {} }),
		events = [],
		eventsA = [],
		inner = oo.inner;

	Observable.observe(oo, changes => Array.prototype.push.apply(events, changes));
	Observable.observe(inner, changes => Array.prototype.push.apply(eventsA, changes));

	inner.some = 'text';
	assert.strictEqual(1, events.length);
	assert.strictEqual(1, eventsA.length);

	delete oo.inner;

	inner.some = 'other text';
	assert.strictEqual(2, events.length);
	assert.strictEqual(2, eventsA.length);
});

suite.test('subgraph proxy correctly processed when callbacks not yet set', () => {
	const
		oo = Observable.from({
			inner: {}
		});
	const
		callback = function (changes) {
			[].push.apply(events, changes);
		};
	let events = [];

	Observable.observe(oo, callback);
	oo.inner.some = 'text';
	assert.strictEqual(events.length, 1);
	Observable.unobserve(oo, callback);

	oo.inner = {};
	events = [];
	Observable.observe(oo, callback);
	oo.inner.other = 'text';
	assert.strictEqual(events.length, 1);
});

suite.test('Object.assign with multiple properties - sync yields many callbacks', () => {
	const
		observable = Observable.from({}),
		newData = { a: 1, b: 2, c: 3 },
		events = [];
	let callbacks = 0;
	Observable.observe(observable, changes => {
		callbacks++;
		events.push.apply(events, changes);
	});

	Object.assign(observable, newData);
	observable.a = 4;

	assert.strictEqual(events.length, 4);
	assert.strictEqual(callbacks, 4);
	//	TODO: add more assertions
});