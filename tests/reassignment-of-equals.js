import { test } from '@gullerya/just-test';
import { assert } from '@gullerya/just-test/assert';
import { Observable } from '../src/object-observer.js';

test('boolean', () => {
	const oo = Observable.from({ p: true });
	let changes = null;
	Observable.observe(oo, cs => { changes = cs; });

	oo.p = true;
	assert.equal(changes, null);
});

test('number', () => {
	const oo = Observable.from({ p: 6 });
	let changes = null;
	Observable.observe(oo, cs => { changes = cs; });

	oo.p = 6;
	assert.equal(changes, null);
});

test('string', () => {
	const oo = Observable.from({ p: 'text' });
	let changes = null;
	Observable.observe(oo, cs => { changes = cs; });

	oo.p = 'text';
	assert.equal(changes, null);
});

test('function', () => {
	const
		f = function () { },
		oo = Observable.from({ p: f });
	let changes = null;
	Observable.observe(oo, cs => { changes = cs; });

	oo.p = f;
	assert.equal(changes, null);
});

test('Symbol', () => {
	const
		s = Symbol('some'),
		oo = Observable.from({ p: s });
	let changes = null;
	Observable.observe(oo, cs => { changes = cs; });

	oo.p = s;
	assert.equal(changes, null);
});