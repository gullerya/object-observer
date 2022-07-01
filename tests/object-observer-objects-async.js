import { assert } from 'chai';
import { getSuite } from 'just-test/suite';
import { waitNextTask } from 'just-test/time-utils';
import { Observable } from '../src/object-observer.js';

const suite = getSuite('Testing Observable - async dispatch');

suite.test('multiple continuous mutations', async () => {
	const
		observable = Observable.from({}, { async: true }),
		events = [];
	let callbacks = 0;
	Observable.observe(observable, changes => {
		callbacks++;
		events.push.apply(events, changes);
	});

	observable.a = 'some';
	observable.b = 2;
	observable.a = 'else';
	delete observable.b;

	await waitNextTask();

	assert.strictEqual(callbacks, 1);
	assert.strictEqual(events.length, 4);
});

suite.test('multiple continuous mutations is split bursts', async () => {
	const
		observable = Observable.from({}, { async: true }),
		events = [];
	let callbacks = 0;
	Observable.observe(observable, changes => {
		callbacks++;
		events.push.apply(events, changes);
	});

	//	first burst
	observable.a = 1;
	observable.b = 2;
	await waitNextTask();

	assert.strictEqual(callbacks, 1);
	assert.strictEqual(events.length, 2);

	callbacks = 0;
	events.splice(0);

	//	second burst
	observable.a = 3;
	observable.b = 4;
	await waitNextTask();

	assert.strictEqual(callbacks, 1);
	assert.strictEqual(events.length, 2);
});

suite.test('Object.assign with multiple properties', async () => {
	const
		observable = Observable.from({}, { async: true }),
		newData = { a: 1, b: 2, c: 3 },
		events = [];
	let callbacks = 0;
	Observable.observe(observable, changes => {
		callbacks++;
		events.push.apply(events, changes);
	});

	Object.assign(observable, newData);

	await waitNextTask();

	assert.strictEqual(callbacks, 1);
	assert.strictEqual(events.length, 3);
});

suite.test('Object.assign with multiple properties + more changes', async () => {
	const
		observable = Observable.from({}, { async: true }),
		newData = { a: 1, b: 2, c: 3 },
		events = [];
	let callbacks = 0;
	Observable.observe(observable, changes => {
		callbacks++;
		events.push.apply(events, changes);
	});

	Object.assign(observable, newData);
	observable.a = 4;

	await waitNextTask();

	assert.strictEqual(callbacks, 1);
	assert.strictEqual(events.length, 4);
});