import { assert } from 'chai';
import { getSuite } from 'just-test/suite';
import { Observable } from '../src/object-observer.js';

const suite = getSuite('Testing listeners APIs');

suite.test('test listeners invocation - single listener', () => {
	const oo = Observable.from({});
	let events = [];

	Observable.observe(oo, changes => { events = events.concat(changes); });

	oo.some = 'test';
	oo.some = 'else';
	delete oo.some;

	assert.strictEqual(events.length, 3);
	assert.deepStrictEqual(events[0], {
		type: 'insert',
		path: ['some'],
		oldValue: undefined,
		value: 'test',
		object: oo
	});
	assert.deepStrictEqual(events[1], {
		type: 'update',
		path: ['some'],
		oldValue: 'test',
		value: 'else',
		object: oo
	});
	assert.deepStrictEqual(events[2], {
		type: 'delete',
		path: ['some'],
		oldValue: 'else',
		value: undefined,
		object: oo
	});
});

suite.test('test listeners invocation - multiple listeners', () => {
	const oo = Observable.from({});
	let eventsA = [], eventsB = [], eventsC = [];

	Observable.observe(oo, changes => { eventsA = eventsA.concat(changes); });
	Observable.observe(oo, changes => { eventsB = eventsB.concat(changes); });
	Observable.observe(oo, changes => { eventsC = eventsC.concat(changes); });

	oo.some = 'test';
	oo.some = 'else';
	delete oo.some;

	assert.equal(eventsA.length, 3);
	assert.equal(eventsB.length, 3);
	assert.equal(eventsC.length, 3);
});

suite.test('test listeners invocation - multiple listeners and one is throwing', () => {
	const oo = Observable.from({});
	let eventsA = [], eventsB = [];

	Observable.observe(oo, () => {
		throw new Error('intentional disrupt');
	});
	Observable.observe(oo, changes => { eventsA = eventsA.concat(changes); });
	Observable.observe(oo, changes => { eventsB = eventsB.concat(changes); });

	oo.some = 'test';
	oo.some = 'else';
	delete oo.some;

	assert.equal(eventsA.length, 3);
	assert.equal(eventsB.length, 3);
});

suite.test('test listeners invocation - multiple times same listener', () => {
	const
		oo = Observable.from({}),
		listener = changes => { eventsA = eventsA.concat(changes); };
	let eventsA = [];

	Observable.observe(oo, listener);
	Observable.observe(oo, listener);

	oo.some = 'test';
	oo.some = 'else';
	delete oo.some;

	assert.equal(eventsA.length, 3);
});

suite.test('test listeners invocation - listener is corrupted - null', () => {
	assert.throws(() => Observable.observe(Observable.from({}), null), 'observer MUST be a function');
});

suite.test('test listeners invocation - listener is corrupted - NaF', () => {
	assert.throws(() => Observable.observe(Observable.from({}), 'some non function'), 'observer MUST be a function');
});
