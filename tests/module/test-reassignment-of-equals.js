import { getSuite } from '../../node_modules/just-test/dist/just-test.min.js';
import { Observable } from '../../dist/object-observer.js';

const suite = getSuite({ name: 'Testing reassignment of equal values' });

suite.runTest({ name: 'boolean' }, () => {
	let oo = Observable.from({ p: true }),
		changes = null;
	oo.observe(cs => changes = cs);

	oo.p = true;
	if (changes !== null) throw new Error('expected no events to be fired when strictly equal assigment performed');
});

suite.runTest({ name: 'number' }, () => {
	let oo = Observable.from({ p: 6 }),
		changes = null;
	oo.observe(cs => changes = cs);

	oo.p = 6;
	if (changes !== null) throw new Error('expected no events to be fired when strictly equal assigment performed');
});

suite.runTest({ name: 'string' }, () => {
	let oo = Observable.from({ p: 'text' }),
		changes = null;
	oo.observe(cs => changes = cs);

	oo.p = 'text';
	if (changes !== null) throw new Error('expected no events to be fired when strictly equal assigment performed');
});

suite.runTest({ name: 'function' }, () => {
	let f = function () { },
		oo = Observable.from({ p: f }),
		changes = null;
	oo.observe(cs => changes = cs);

	oo.p = f;
	if (changes !== null) throw new Error('expected no events to be fired when strictly equal assigment performed');
});

suite.runTest({ name: 'Symbol' }, () => {
	let s = Symbol('some'),
		oo = Observable.from({ p: s }),
		changes = null;
	oo.observe(cs => changes = cs);

	oo.p = s;
	if (changes !== null) throw new Error('expected no events to be fired when strictly equal assigment performed');
});