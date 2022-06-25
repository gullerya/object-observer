import { assert } from 'chai';
import { getSuite } from 'just-test/suite';
import { Observable } from '../src/object-observer.js';

const suite = getSuite('Testing reassignment of equal values');

suite.test('boolean', () => {
	const oo = Observable.from({ p: true });
	let changes = null;
	Observable.observe(oo, cs => { changes = cs; });

	oo.p = true;
	assert.equal(changes, null);
});

suite.test('number', () => {
	const oo = Observable.from({ p: 6 });
	let changes = null;
	Observable.observe(oo, cs => { changes = cs; });

	oo.p = 6;
	assert.equal(changes, null);
});

suite.test('string', () => {
	const oo = Observable.from({ p: 'text' });
	let changes = null;
	Observable.observe(oo, cs => { changes = cs; });

	oo.p = 'text';
	assert.equal(changes, null);
});

suite.test('function', () => {
	const
		f = function () { },
		oo = Observable.from({ p: f });
	let changes = null;
	Observable.observe(oo, cs => { changes = cs; });

	oo.p = f;
	assert.equal(changes, null);
});

suite.test('Symbol', () => {
	const
		s = Symbol('some'),
		oo = Observable.from({ p: s });
	let changes = null;
	Observable.observe(oo, cs => { changes = cs; });

	oo.p = s;
	assert.equal(changes, null);
});