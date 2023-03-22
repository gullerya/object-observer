import { test } from '@gullerya/just-test';
import { assert } from '@gullerya/just-test/assert';
import { Observable } from '../src/object-observer.js';

test('test revokation of replaced objects - simple set', () => {
	const og = Observable.from({
		a: {
			b: {
				prop: 'text'
			},
			prop: 'text'
		}
	});
	let events = [];

	Observable.observe(og, changes => events.push(...changes));

	og.a = og.a.b;
	assert.strictEqual(og.a.prop, 'text');
	assert.equal(events.length, 1);
	assert.deepStrictEqual(events[0], { type: 'update', path: ['a'], value: { prop: 'text' }, oldValue: { b: { prop: 'text' }, prop: 'text' }, object: og });
});

test('test revokation of replaced objects - splice in array', () => {
	const og = Observable.from([
		{
			child: {
				prop: 'text'
			},
			prop: 'text'
		}
	]);
	let events = [];

	Observable.observe(og, changes => events.push(...changes));

	og.splice(0, 1, og[0].child);
	assert.strictEqual(og[0].prop, 'text');
	assert.strictEqual(events.length, 1);
	assert.deepStrictEqual(events[0], { type: 'update', path: [0], value: { prop: 'text' }, oldValue: { child: { prop: 'text' }, prop: 'text' }, object: og });
});