import { getSuite } from '../../node_modules/just-test/dist/just-test.js';
import { Observable } from '../../dist/object-observer.js';

const suite = getSuite({ name: 'Testing reassignment of equal values' });

suite.runTest({ name: 'boolean' }, test => {
	let oo = Observable.from({ p: true }),
		changes = null;
	oo.observe(cs => changes = cs);

	oo.p = true;
	test.assertEqual(null, changes);
});

suite.runTest({ name: 'number' }, test => {
	let oo = Observable.from({ p: 6 }),
		changes = null;
	oo.observe(cs => changes = cs);

	oo.p = 6;
	test.assertEqual(null, changes);
});

suite.runTest({ name: 'string' }, test => {
	let oo = Observable.from({ p: 'text' }),
		changes = null;
	oo.observe(cs => changes = cs);

	oo.p = 'text';
	test.assertEqual(null, changes);
});

suite.runTest({ name: 'function' }, test => {
	let f = function () { },
		oo = Observable.from({ p: f }),
		changes = null;
	oo.observe(cs => changes = cs);

	oo.p = f;
	test.assertEqual(null, changes);
});

suite.runTest({ name: 'Symbol' }, test => {
	let s = Symbol('some'),
		oo = Observable.from({ p: s }),
		changes = null;
	oo.observe(cs => changes = cs);

	oo.p = s;
	test.assertEqual(null, changes);
});