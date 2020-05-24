﻿import { getSuite } from '../../node_modules/just-test/dist/just-test.min.js';
import { Observable } from '../../dist/object-observer.js';

const suite = getSuite({ name: 'Testing Object generic methods' });

suite.runTest({ name: 'Object.seal - further extensions should fail', expectError: 'TypeError' }, () => {
	const oo = Observable.from({ propA: 'a', propB: 'b' });
	Object.seal(oo);
	oo.propC = 'c';
});

suite.runTest({ name: 'Object.seal - props removal should fail', expectError: 'TypeError' }, () => {
	const oo = Observable.from({ propA: 'a', propB: 'b' });
	Object.seal(oo);
	delete oo.propA;
});

suite.runTest({ name: 'Object.seal - modifications allowed' }, test => {
	const oo = Observable.from({ propA: 'a', propB: 'b' });
	let events = 0;
	Object.seal(oo);
	oo.observe(changes => events += changes.length);
	oo.propA = 'A';
	test.assertEqual(1, events);
});

suite.runTest({ name: 'Object.seal - nested - further extensions should fail', expectError: 'TypeError' }, () => {
	const oo = Observable.from({ nested: { propA: 'a', propB: 'b' } });
	Object.seal(oo.nested);
	oo.nested.propC = 'c';
});

suite.runTest({ name: 'Object.seal - nested - props removal should fail', expectError: 'TypeError' }, () => {
	const oo = Observable.from({ nested: { propA: 'a', propB: 'b' } });
	Object.seal(oo.nested);
	delete oo.nested.propA;
});

suite.runTest({ name: 'Object.seal - nested - modifications allowed' }, test => {
	const oo = Observable.from({ nested: { propA: 'a', propB: 'b' } });
	let events = 0;
	Object.seal(oo.nested);
	oo.observe(changes => events += changes.length);
	oo.nested.propA = 'A';
	test.assertEqual(1, events);
});