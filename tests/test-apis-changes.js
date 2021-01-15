import { getSuite } from '../../node_modules/just-test/dist/just-test.js';
import { Observable } from '../../src/object-observer.js';

const suite = getSuite({ name: 'Testing Observable APIs - Changes' });

//	object
//
suite.runTest({ name: 'verify object - root - insert' }, test => {
	let c;
	const o = Observable.from({});
	o.observe(cs => { c = cs[0]; })
	o.some = 'new';
	assertObjectEqual(test, c, { type: 'insert', path: ['some'], value: 'new', oldValue: undefined, object: o });
});

suite.runTest({ name: 'verify object - deep - insert' }, test => {
	let c;
	const o = Observable.from({ a: {} });
	o.observe(cs => { c = cs[0]; })
	o.a.some = 'new';
	assertObjectEqual(test, c, { type: 'insert', path: ['a', 'some'], value: 'new', oldValue: undefined, object: o.a });
});

suite.runTest({ name: 'verify object - root - update' }, test => {
	let c;
	const o = Observable.from({ p: 'old' });
	o.observe(cs => { c = cs[0]; })
	o.p = 'new';
	assertObjectEqual(test, c, { type: 'update', path: ['p'], value: 'new', oldValue: 'old', object: o });
});

suite.runTest({ name: 'verify object - deep - update' }, test => {
	let c;
	const o = Observable.from({ a: { p: 'old' } });
	o.observe(cs => { c = cs[0]; })
	o.a.p = 'new';
	assertObjectEqual(test, c, { type: 'update', path: ['a', 'p'], value: 'new', oldValue: 'old', object: o.a });
});

suite.runTest({ name: 'verify object - root - delete' }, test => {
	let c;
	const o = Observable.from({ p: 'old' });
	o.observe(cs => { c = cs[0]; })
	delete o.p;
	assertObjectEqual(test, c, { type: 'delete', path: ['p'], value: undefined, oldValue: 'old', object: o });
});

suite.runTest({ name: 'verify object - deep - delete' }, test => {
	let c;
	const o = Observable.from({ a: { p: 'old' } });
	o.observe(cs => { c = cs[0]; })
	delete o.a.p;
	assertObjectEqual(test, c, { type: 'delete', path: ['a', 'p'], value: undefined, oldValue: 'old', object: o.a });
});

//	array
//
suite.runTest({ name: 'verify array - root - insert' }, test => {
	let c;
	const o = Observable.from([]);
	o.observe(cs => { c = cs[0]; })
	o.push('new');
	assertObjectEqual(test, c, { type: 'insert', path: [0], value: 'new', oldValue: undefined, object: o });
});

suite.runTest({ name: 'verify array - deep - insert' }, test => {
	let c;
	const o = Observable.from([[]]);
	o.observe(cs => { c = cs[0]; })
	o[0].push('new');
	assertObjectEqual(test, c, { type: 'insert', path: [0, 0], value: 'new', oldValue: undefined, object: o[0] });
});

suite.runTest({ name: 'verify array - root - update' }, test => {
	let c;
	const o = Observable.from(['old']);
	o.observe(cs => { c = cs[0]; })
	o[0] = 'new';
	assertObjectEqual(test, c, { type: 'update', path: ['0'], value: 'new', oldValue: 'old', object: o });
});

suite.runTest({ name: 'verify array - deep - update' }, test => {
	let c;
	const o = Observable.from([['old']]);
	o.observe(cs => { c = cs[0]; })
	o[0][0] = 'new';
	assertObjectEqual(test, c, { type: 'update', path: [0, '0'], value: 'new', oldValue: 'old', object: o[0] });
});

suite.runTest({ name: 'verify array - root - delete' }, test => {
	let c;
	const o = Observable.from(['old']);
	o.observe(cs => { c = cs[0]; })
	o.pop();
	assertObjectEqual(test, c, { type: 'delete', path: [0], value: undefined, oldValue: 'old', object: o });
});

suite.runTest({ name: 'verify array - deep - delete' }, test => {
	let c;
	const o = Observable.from([['old']]);
	o.observe(cs => { c = cs[0]; })
	o[0].pop();
	assertObjectEqual(test, c, { type: 'delete', path: [0, 0], value: undefined, oldValue: 'old', object: o[0] });
});

function assertObjectEqual(test, change, expected) {
	for (const [p, v] of Object.entries(expected)) {
		test.assertTrue(p in change);
		if (Array.isArray(v)) {
			assertArrayEqual(test, v, change[p]);
		} else if (typeof v === 'object') {
			assertObjectEqual(test, v, change[p]);
		} else {
			test.assertEqual(v, change[p]);
		}
	}
}

function assertArrayEqual(test, a1, a2) {
	test.assertTrue(Array.isArray(a1));
	test.assertTrue(Array.isArray(a2));
	test.assertEqual(a1.lenght, a2.lenght);
	a1.forEach((e, i) => test.assertEqual(e, a2[i]));
}