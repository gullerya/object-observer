import { getSuite } from '../../node_modules/just-test/dist/just-test.js';
import { Observable } from '../../src/object-observer.js';

const suite = getSuite({ name: 'Testing reassignment of equal values' });

suite.runTest({ name: 'boolean' }, test => {
	const oo = Observable.from({ p: true });
	let changes = null;
	Observable.observe(oo, cs => { changes = cs; });

	oo.p = true;
	test.assertEqual(null, changes);
});

suite.runTest({ name: 'number' }, test => {
	const oo = Observable.from({ p: 6 });
	let changes = null;
	Observable.observe(oo, cs => { changes = cs; });

	oo.p = 6;
	test.assertEqual(null, changes);
});

suite.runTest({ name: 'string' }, test => {
	const oo = Observable.from({ p: 'text' });
	let changes = null;
	Observable.observe(oo, cs => { changes = cs; });

	oo.p = 'text';
	test.assertEqual(null, changes);
});

suite.runTest({ name: 'function' }, test => {
	const
		f = function () { },
		oo = Observable.from({ p: f });
	let changes = null;
	Observable.observe(oo, cs => { changes = cs; });

	oo.p = f;
	test.assertEqual(null, changes);
});

suite.runTest({ name: 'Symbol' }, test => {
	const
		s = Symbol('some'),
		oo = Observable.from({ p: s });
	let changes = null;
	Observable.observe(oo, cs => { changes = cs; });

	oo.p = s;
	test.assertEqual(null, changes);
});