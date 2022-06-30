import { assert } from 'chai';
import { getSuite } from 'just-test/suite';
import { Observable } from '../src/object-observer.js';

const suite = getSuite('Testing ObjectObserver - typed arrays');

suite.test('typed array reverse - Int8Array', () => {
	const
		pa = Observable.from(new Int8Array([1, 2, 3])),
		events = [];

	Observable.observe(pa, eventsList => {
		[].push.apply(events, eventsList);
	});

	const reversed = pa.reverse();

	assert.strictEqual(reversed, pa);
	assert.strictEqual(events.length, 1);
	assert.deepStrictEqual(events[0], { type: 'reverse', path: [], value: undefined, oldValue: undefined, object: pa });
	assert.deepStrictEqual(pa, new Int8Array([3, 2, 1]));
});

suite.test('typed array sort - Int16Array', () => {
	const
		pa = Observable.from(new Int16Array([3, 2, 1])),
		events = [];

	Observable.observe(pa, eventsList => {
		[].push.apply(events, eventsList);
	});

	let sorted = pa.sort();

	assert.strictEqual(sorted, pa);
	assert.strictEqual(events.length, 1);
	assert.deepStrictEqual(events[0], { type: 'shuffle', path: [], value: undefined, oldValue: undefined, object: pa });
	assert.deepStrictEqual(pa, new Int16Array([1, 2, 3]));

	sorted = pa.sort((a, b) => {
		return a < b ? 1 : -1;
	});
	assert.strictEqual(sorted, pa);
	assert.strictEqual(events.length, 2);
	assert.deepStrictEqual(events[0], { type: 'shuffle', path: [], value: undefined, oldValue: undefined, object: pa });
	assert.deepStrictEqual(pa, new Int16Array([3, 2, 1]));
});

suite.test('typed array fill - Int32Array', () => {
	const
		pa = Observable.from(new Int32Array([1, 2, 3])),
		events = [];

	Observable.observe(pa, eventsList => {
		[].push.apply(events, eventsList);
	});

	const filled = pa.fill(256);
	assert.strictEqual(filled, pa);
	assert.strictEqual(events.length, 3);
	assert.deepStrictEqual(events[0], { type: 'update', path: [0], value: 256, oldValue: 1, object: pa });
	assert.deepStrictEqual(events[1], { type: 'update', path: [1], value: 256, oldValue: 2, object: pa });
	assert.deepStrictEqual(events[2], { type: 'update', path: [2], value: 256, oldValue: 3, object: pa });
	events.splice(0);

	pa.fill(1024, 1, 3);
	assert.strictEqual(events.length, 2);
	assert.deepStrictEqual(events[0], { type: 'update', path: [1], value: 1024, oldValue: 256, object: pa });
	assert.deepStrictEqual(events[1], { type: 'update', path: [2], value: 1024, oldValue: 256, object: pa });
	events.splice(0);

	pa.fill(9024, -1, 3);
	assert.strictEqual(events.length, 1);
	assert.deepStrictEqual(events[0], { type: 'update', path: [2], value: 9024, oldValue: 1024, object: pa });
	events.splice(0);

	//	simulating insertion of a new item into array (fill does not extend an array, so we may do it only on internal items)
	pa[1] = 0;
	pa.fill(12056, 1, 2);
	assert.strictEqual(events.length, 2);
	assert.deepStrictEqual(events[0], { type: 'update', path: ['1'], value: 0, oldValue: 1024, object: pa });
	assert.deepStrictEqual(events[1], { type: 'update', path: [1], value: 12056, oldValue: 0, object: pa });
});

suite.test('typed array set - Float32Array', () => {
	const
		pa = Observable.from(new Float32Array(8)),
		events = [];

	Observable.observe(pa, eventsList => {
		[].push.apply(events, eventsList);
	});

	//	basic set
	pa.set([1, 2, 3], 3);
	assert.strictEqual(events.length, 3);
	assert.deepStrictEqual(events[0], { type: 'update', path: [3], value: 1, oldValue: 0, object: pa });
	assert.deepStrictEqual(events[1], { type: 'update', path: [4], value: 2, oldValue: 0, object: pa });
	assert.deepStrictEqual(events[2], { type: 'update', path: [5], value: 3, oldValue: 0, object: pa });
	events.splice(0);

	//	set no offset - effectively 0
	pa.set([1, 1, 1]);
	assert.strictEqual(events.length, 3);
	assert.deepStrictEqual(events[0], { type: 'update', path: [0], value: 1, oldValue: 0, object: pa });
	assert.deepStrictEqual(events[1], { type: 'update', path: [1], value: 1, oldValue: 0, object: pa });
	assert.deepStrictEqual(events[2], { type: 'update', path: [2], value: 1, oldValue: 0, object: pa });
	events.splice(0);

	//	set from TypedArray
	pa.set(new Int8Array([5, 6, 7]), 2);
	assert.strictEqual(events.length, 3);
	assert.deepStrictEqual(events[0], { type: 'update', path: [2], value: 5, oldValue: 1, object: pa });
	assert.deepStrictEqual(events[1], { type: 'update', path: [3], value: 6, oldValue: 1, object: pa });
	assert.deepStrictEqual(events[2], { type: 'update', path: [4], value: 7, oldValue: 2, object: pa });
	events.splice(0);
});

suite.test('typed array copyWithin - Float64Array', () => {
	const
		pa = Observable.from(new Float64Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])),
		events = [];

	Observable.observe(pa, eventsList => {
		[].push.apply(events, eventsList);
	});

	//	basic case
	let copied = pa.copyWithin(5, 7, 9);
	assert.strictEqual(pa, copied);
	assert.strictEqual(events.length, 2);
	assert.deepStrictEqual(events[0], { type: 'update', path: [5], value: 7, oldValue: 5, object: pa });
	assert.deepStrictEqual(events[1], { type: 'update', path: [6], value: 8, oldValue: 6, object: pa });
	events.splice(0);

	//	negative dest, missing end
	copied = pa.copyWithin(-2, 6);
	assert.strictEqual(pa, copied);
	assert.strictEqual(events.length, 1);
	//	we do not expect of 8, since 8 replaced with 8
	assert.deepStrictEqual(events[0], { type: 'update', path: [9], value: 7, oldValue: 9, object: pa });
	events.splice(0);

	//	positive dest, missing start, end
	copied = pa.copyWithin(7);
	assert.strictEqual(pa, copied);
	assert.strictEqual(events.length, 3);
	assert.deepStrictEqual(events[0], { type: 'update', path: [7], value: 0, oldValue: 7, object: pa });
	assert.deepStrictEqual(events[1], { type: 'update', path: [8], value: 1, oldValue: 8, object: pa });
	assert.deepStrictEqual(events[2], { type: 'update', path: [9], value: 2, oldValue: 7, object: pa });
	events.splice(0);
});

suite.test('typed array as nested - Uint8Array', () => {
	const
		po = Observable.from({ a: new Uint8Array([1, 2, 3]) }),
		events = [];

	Observable.observe(po, eventsList => {
		[].push.apply(events, eventsList);
	});

	po.a[1] = 7;
	assert.strictEqual(events.length, 1);
	assert.deepStrictEqual(events[0], { type: 'update', path: ['a', '1'], value: 7, oldValue: 2, object: po.a });
});
