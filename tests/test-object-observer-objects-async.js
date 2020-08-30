import { getSuite } from '../../node_modules/just-test/dist/just-test.js';
import { Observable } from '../../dist/object-observer.js';

const suite = getSuite({ name: 'Testing Observable - async dispatch' });

suite.runTest({ name: 'Object.assign with multiple properties' }, async test => {
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
	//	TODO: add more assertions
});

suite.runTest({ name: 'Object.assign with multiple properties + more changes' }, async test => {
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
	//	TODO: add more assertions
});