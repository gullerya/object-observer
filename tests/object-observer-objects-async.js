import { getSuite } from '../../node_modules/just-test/dist/just-test.js';
import { Observable } from '../../src/object-observer.js';

const suite = getSuite({ name: 'Testing Observable - async dispatch' });

suite.runTest({ name: 'multiple continuous mutations', timeout: 15000 }, async test => {
	const
		observable = Observable.from({}, { async: true }),
		events = [];
	let callbacks = 0;
	observable.observe(changes => {
		callbacks++;
		events.push.apply(events, changes);
	});

	observable.a = 'some';
	observable.b = 2;
	observable.a = 'else';
	delete observable.b;

	await test.waitNextMicrotask();

	test.assertEqual(1, callbacks);
	test.assertEqual(4, events.length);
});

suite.runTest({ name: 'multiple continuous mutations is split bursts', timeout: 15000 }, async test => {
	const
		observable = Observable.from({}, { async: true }),
		events = [];
	let callbacks = 0;
	observable.observe(changes => {
		callbacks++;
		events.push.apply(events, changes);
	});

	//	first burst
	observable.a = 1;
	observable.b = 2;
	await test.waitNextMicrotask();

	test.assertEqual(1, callbacks);
	test.assertEqual(2, events.length);

	callbacks = 0;
	events.splice(0);

	//	second burst
	observable.a = 3;
	observable.b = 4;
	await test.waitNextMicrotask();

	test.assertEqual(1, callbacks);
	test.assertEqual(2, events.length);
});

suite.runTest({ name: 'Object.assign with multiple properties', timeout: 15000 }, async test => {
	const
		observable = Observable.from({}, { async: true }),
		newData = { a: 1, b: 2, c: 3 },
		events = [];
	let callbacks = 0;
	observable.observe(changes => {
		callbacks++;
		events.push.apply(events, changes);
	});

	Object.assign(observable, newData);

	await test.waitNextMicrotask();

	test.assertEqual(1, callbacks);
	test.assertEqual(3, events.length);
});

suite.runTest({ name: 'Object.assign with multiple properties + more changes', timeout: 15000 }, async test => {
	const
		observable = Observable.from({}, { async: true }),
		newData = { a: 1, b: 2, c: 3 },
		events = [];
	let callbacks = 0;
	observable.observe(changes => {
		callbacks++;
		events.push.apply(events, changes);
	});

	Object.assign(observable, newData);
	observable.a = 4;

	await test.waitNextMicrotask();

	test.assertEqual(1, callbacks);
	test.assertEqual(4, events.length);
});