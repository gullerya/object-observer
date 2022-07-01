import { assert } from 'chai';
import { getSuite } from 'just-test/suite';
import { Observable } from '../src/object-observer.js';

const suite = getSuite('Testing Observable APIs - Changes');

//	object
//
suite.test('verify object - root - insert', () => {
	let c;
	const o = Observable.from({});
	Observable.observe(o, cs => { c = cs[0]; })
	o.some = 'new';
	assert.deepStrictEqual(c, { type: 'insert', path: ['some'], value: 'new', oldValue: undefined, object: o });
});

suite.test('verify object - deep - insert', () => {
	let c;
	const o = Observable.from({ a: {} });
	Observable.observe(o, cs => { c = cs[0]; })
	o.a.some = 'new';
	assert.deepStrictEqual(c, { type: 'insert', path: ['a', 'some'], value: 'new', oldValue: undefined, object: o.a });
});

suite.test('verify object - root - update', () => {
	let c;
	const o = Observable.from({ p: 'old' });
	Observable.observe(o, cs => { c = cs[0]; })
	o.p = 'new';
	assert.deepStrictEqual(c, { type: 'update', path: ['p'], value: 'new', oldValue: 'old', object: o });
});

suite.test('verify object - deep - update', () => {
	let c;
	const o = Observable.from({ a: { p: 'old' } });
	Observable.observe(o, cs => { c = cs[0]; })
	o.a.p = 'new';
	assert.deepStrictEqual(c, { type: 'update', path: ['a', 'p'], value: 'new', oldValue: 'old', object: o.a });
});

suite.test('verify object - root - delete', () => {
	let c;
	const o = Observable.from({ p: 'old' });
	Observable.observe(o, cs => { c = cs[0]; })
	delete o.p;
	assert.deepStrictEqual(c, { type: 'delete', path: ['p'], value: undefined, oldValue: 'old', object: o });
});

suite.test('verify object - deep - delete', () => {
	let c;
	const o = Observable.from({ a: { p: 'old' } });
	Observable.observe(o, cs => { c = cs[0]; })
	delete o.a.p;
	assert.deepStrictEqual(c, { type: 'delete', path: ['a', 'p'], value: undefined, oldValue: 'old', object: o.a });
});

//	array
//
suite.test('verify array - root - insert', () => {
	let c;
	const o = Observable.from([]);
	Observable.observe(o, cs => { c = cs[0]; })
	o.push('new');
	assert.deepStrictEqual(c, { type: 'insert', path: [0], value: 'new', oldValue: undefined, object: o });
});

suite.test('verify array - deep - insert', () => {
	let c;
	const o = Observable.from([[]]);
	Observable.observe(o, cs => { c = cs[0]; })
	o[0].push('new');
	assert.deepStrictEqual(c, { type: 'insert', path: [0, 0], value: 'new', oldValue: undefined, object: o[0] });
});

suite.test('verify array - root - update', () => {
	let c;
	const o = Observable.from(['old']);
	Observable.observe(o, cs => { c = cs[0]; })
	o[0] = 'new';
	assert.deepStrictEqual(c, { type: 'update', path: ['0'], value: 'new', oldValue: 'old', object: o });
});

suite.test('verify array - deep - update', () => {
	let c;
	const o = Observable.from([['old']]);
	Observable.observe(o, cs => { c = cs[0]; })
	o[0][0] = 'new';
	assert.deepStrictEqual(c, { type: 'update', path: [0, '0'], value: 'new', oldValue: 'old', object: o[0] });
});

suite.test('verify array - root - delete', () => {
	let c;
	const o = Observable.from(['old']);
	Observable.observe(o, cs => { c = cs[0]; })
	o.pop();
	assert.deepStrictEqual(c, { type: 'delete', path: [0], value: undefined, oldValue: 'old', object: o });
});

suite.test('verify array - deep - delete', () => {
	let c;
	const o = Observable.from([['old']]);
	Observable.observe(o, cs => { c = cs[0]; })
	o[0].pop();
	assert.deepStrictEqual(c, { type: 'delete', path: [0, 0], value: undefined, oldValue: 'old', object: o[0] });
});
