import { assert } from 'chai';
import { getSuite } from 'just-test/suite';
import { Observable } from '../src/object-observer.js';

const suite = getSuite('Testing ObjectObserver - arrays');

suite.test('array copyWithin - primitives', () => {
	const
		pa = Observable.from([1, 2, 3, 4, 5, 6]),
		events = [];
	let callbacks = 0;

	Observable.observe(pa, eventsList => {
		[].push.apply(events, eventsList);
		callbacks++;
	});

	let copied = pa.copyWithin(2, 0, 3);
	assert.equal(pa, copied);
	assert.strictEqual(events.length, 3);
	assert.strictEqual(callbacks, 1);
	assert.deepStrictEqual(events[0], { type: 'update', path: [2], value: 1, oldValue: 3, object: pa });
	assert.deepStrictEqual(events[1], { type: 'update', path: [3], value: 2, oldValue: 4, object: pa });
	assert.deepStrictEqual(events[2], { type: 'update', path: [4], value: 3, oldValue: 5, object: pa });
	events.splice(0);
	callbacks = 0;

	//  pa = [1,2,1,2,3,6]
	copied = pa.copyWithin(-3);
	assert.equal(pa, copied);
	assert.strictEqual(events.length, 3);
	assert.strictEqual(callbacks, 1);
	assert.deepStrictEqual(events[0], { type: 'update', path: [3], value: 1, oldValue: 2, object: pa });
	assert.deepStrictEqual(events[1], { type: 'update', path: [4], value: 2, oldValue: 3, object: pa });
	assert.deepStrictEqual(events[2], { type: 'update', path: [5], value: 1, oldValue: 6, object: pa });
	events.splice(0);
	callbacks = 0;

	//  pa = [1,2,1,1,2,1]
	copied = pa.copyWithin(1, -3, 9);
	assert.equal(pa, copied);
	assert.strictEqual(events.length, 2);
	assert.strictEqual(callbacks, 1);
	assert.deepStrictEqual(events[0], { type: 'update', path: [1], value: 1, oldValue: 2, object: pa });
	assert.deepStrictEqual(events[1], { type: 'update', path: [2], value: 2, oldValue: 1, object: pa });
	//	update at index 4 should not be evented, since 1 === 1
	events.splice(0);
	callbacks = 0;
});

suite.test('array copyWithin - objects', () => {
	const
		pa = Observable.from([{ text: 'a' }, { text: 'b' }, { text: 'c' }, { text: 'd' }]),
		events = [];

	Observable.observe(pa, eventsList => {
		[].push.apply(events, eventsList);
	});

	const detached = pa[1];
	const copied = pa.copyWithin(1, 2, 3);
	assert.equal(pa, copied);
	assert.strictEqual(events.length, 1);
	assert.deepStrictEqual(events[0], { type: 'update', path: [1], value: { text: 'c' }, oldValue: { text: 'b' }, object: pa });
	events.splice(0);

	pa[1].text = 'B';
	pa[2].text = 'D';
	assert.strictEqual(events.length, 2);
	assert.deepStrictEqual(events[0], { type: 'update', path: [1, 'text'], value: 'B', oldValue: 'c', object: pa[1] });
	assert.deepStrictEqual(events[1], { type: 'update', path: [2, 'text'], value: 'D', oldValue: 'c', object: pa[2] });
	events.splice(0);

	Observable.observe(detached, eventsList => {
		[].push.apply(events, eventsList);
	});
	detached.text = '1';
	assert.equal(events.length, 1);
	assert.deepStrictEqual(events[0], { type: 'update', path: ['text'], value: '1', oldValue: 'b', object: detached });
});

suite.test('array copyWithin - arrays', () => {
	const
		pa = Observable.from([{ text: 'a' }, { text: 'b' }, { text: 'c' }, [{ text: 'd' }]]),
		events = [];

	Observable.observe(pa, eventsList => {
		[].push.apply(events, eventsList);
	});

	const copied = pa.copyWithin(1, 3, 4);
	assert.equal(pa, copied);
	assert.equal(events.length, 1);
	assert.deepStrictEqual(events[0], { type: 'update', path: [1], value: [{ text: 'd' }], oldValue: { text: 'b' }, object: pa });
	events.splice(0);

	pa[1][0].text = 'B';
	pa[3][0].text = 'D';
	assert.strictEqual(events.length, 2);
	assert.deepStrictEqual(events[0], { type: 'update', path: [1, 0, 'text'], value: 'B', oldValue: 'd', object: pa[1][0] });
	assert.deepStrictEqual(events[1], { type: 'update', path: [3, 0, 'text'], value: 'D', oldValue: 'd', object: pa[3][0] });
	events.splice(0);
});