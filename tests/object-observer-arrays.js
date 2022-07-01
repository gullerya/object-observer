import { assert } from 'chai';
import { getSuite } from 'just-test/suite';
import { Observable } from '../src/object-observer.js';

const suite = getSuite('Testing ObjectObserver - arrays');

suite.test('array push - primitives', () => {
	const
		pa = Observable.from([1, 2, 3, 4]),
		events = [];
	let callBacks = 0;

	Observable.observe(pa, eventsList => {
		[].push.apply(events, eventsList);
		callBacks++;
	});

	pa.push(5);
	pa.push(6, 7);

	assert.strictEqual(events.length, 3);
	assert.strictEqual(callBacks, 2);
	assert.deepStrictEqual(events[0], { type: 'insert', path: [4], value: 5, oldValue: undefined, object: pa });
	assert.deepStrictEqual(events[1], { type: 'insert', path: [5], value: 6, oldValue: undefined, object: pa });
	assert.deepStrictEqual(events[2], { type: 'insert', path: [6], value: 7, oldValue: undefined, object: pa });
});

suite.test('array push - objects', () => {
	const
		pa = Observable.from([]),
		events = [];

	Observable.observe(pa, eventsList => {
		[].push.apply(events, eventsList);
	});

	pa.push({ text: 'initial' }, { text: 'secondary' });
	assert.strictEqual(events.length, 2);
	assert.deepStrictEqual(events[0], { type: 'insert', path: [0], value: { text: 'initial' }, oldValue: undefined, object: pa });
	assert.deepStrictEqual(events[1], { type: 'insert', path: [1], value: { text: 'secondary' }, oldValue: undefined, object: pa });

	pa[0].text = 'name';
	assert.strictEqual(events.length, 3);
	assert.deepStrictEqual(events[2], { type: 'update', path: [0, 'text'], value: 'name', oldValue: 'initial', object: pa[0] });

	pa[1].text = 'more';
	assert.strictEqual(events.length, 4);
	assert.deepStrictEqual(events[3], { type: 'update', path: [1, 'text'], value: 'more', oldValue: 'secondary', object: pa[1] });
});

suite.test('array push - arrays', () => {
	const
		pa = Observable.from([]),
		events = [];

	Observable.observe(pa, eventsList => {
		[].push.apply(events, eventsList);
	});

	pa.push([], [{}]);
	assert.strictEqual(events.length, 2);
	assert.deepStrictEqual(events[0], { type: 'insert', path: [0], value: [], oldValue: undefined, object: pa });
	assert.deepStrictEqual(events[1], { type: 'insert', path: [1], value: [{}], oldValue: undefined, object: pa });

	pa[0].push('name');
	assert.strictEqual(events.length, 3);
	assert.deepStrictEqual(events[2], { type: 'insert', path: [0, 0], value: 'name', oldValue: undefined, object: pa[0] });

	pa[1][0].prop = 'more';
	assert.strictEqual(events.length, 4);
	assert.deepStrictEqual(events[3], { type: 'insert', path: [1, 0, 'prop'], value: 'more', oldValue: undefined, object: pa[1][0] });
});

suite.test('array pop - primitives', () => {
	const
		pa = Observable.from(['some']),
		events = [];

	Observable.observe(pa, eventsList => {
		[].push.apply(events, eventsList);
	});

	const popped = pa.pop();

	assert.strictEqual(events.length, 1);
	assert.deepStrictEqual(events[0], { type: 'delete', path: [0], value: undefined, oldValue: 'some', object: pa });
	assert.strictEqual(popped, 'some');
});

suite.test('array pop - objects', () => {
	const
		pa = Observable.from([{ test: 'text' }]),
		pad = pa[0],
		events = [],
		eventsA = [];

	Observable.observe(pa, eventsList => Array.prototype.push.apply(events, eventsList));

	pa[0].test = 'test';
	pad.test = 'more';
	assert.strictEqual(events.length, 2);

	const popped = pa.pop();
	assert.strictEqual(popped.test, 'more');
	assert.strictEqual(events.length, 3);

	popped.new = 'value';
	assert.strictEqual(events.length, 3);

	Observable.observe(pad, changes => Array.prototype.push.apply(eventsA, changes));
	pad.test = 'change';
	assert.strictEqual(eventsA.length, 1);
});

suite.test('array unshift - primitives', () => {
	const
		pa = Observable.from([]),
		events = [];
	let callbacks = 0;

	Observable.observe(pa, eventsList => {
		[].push.apply(events, eventsList);
		callbacks++;
	});

	pa.unshift('a');
	pa.unshift('b', 'c');
	assert.strictEqual(events.length, 3);
	assert.strictEqual(callbacks, 2);
	assert.deepStrictEqual(events[0], { type: 'insert', path: [0], value: 'a', oldValue: undefined, object: pa });
	assert.deepStrictEqual(events[1], { type: 'insert', path: [0], value: 'b', oldValue: undefined, object: pa });
	assert.deepStrictEqual(events[2], { type: 'insert', path: [1], value: 'c', oldValue: undefined, object: pa });
});

suite.test('array unshift - objects', () => {
	const
		pa = Observable.from([{ text: 'original' }]),
		events = [];

	Observable.observe(pa, eventsList => {
		[].push.apply(events, eventsList);
	});

	pa.unshift({ text: 'initial' });
	assert.strictEqual(events.length, 1);
	assert.deepStrictEqual(events[0], { type: 'insert', path: [0], value: { text: 'initial' }, oldValue: undefined, object: pa });
	events.splice(0);

	pa[0].text = 'name';
	pa[1].text = 'other';
	assert.strictEqual(events.length, 2);
	assert.deepStrictEqual(events[0], { type: 'update', path: [0, 'text'], value: 'name', oldValue: 'initial', object: pa[0] });
	assert.deepStrictEqual(events[1], { type: 'update', path: [1, 'text'], value: 'other', oldValue: 'original', object: pa[1] });
});

suite.test('array unshift - arrays', () => {
	const
		pa = Observable.from([{ text: 'original' }]),
		events = [];

	Observable.observe(pa, eventsList => {
		[].push.apply(events, eventsList);
	});

	pa.unshift([{}]);
	assert.strictEqual(events.length, 1);
	assert.deepStrictEqual(events[0], { type: 'insert', path: [0], value: [{}], oldValue: undefined, object: pa });
	events.splice(0);

	pa[0][0].text = 'name';
	pa[1].text = 'other';
	assert.strictEqual(events.length, 2);
	assert.deepStrictEqual(events[0], { type: 'insert', path: [0, 0, 'text'], value: 'name', oldValue: undefined, object: pa[0][0] });
	assert.deepStrictEqual(events[1], { type: 'update', path: [1, 'text'], value: 'other', oldValue: 'original', object: pa[1] });
});

suite.test('array shift - primitives', () => {
	const
		pa = Observable.from(['some']),
		events = [];

	Observable.observe(pa, eventsList => Array.prototype.push.apply(events, eventsList));

	const shifted = pa.shift();

	assert.strictEqual(events.length, 1);
	assert.deepStrictEqual(events[0], { type: 'delete', path: [0], value: undefined, oldValue: 'some', object: pa });
	assert.strictEqual(shifted, 'some');
});

suite.test('array shift - objects', () => {
	const
		pa = Observable.from([{ text: 'a', inner: { test: 'more' } }, { text: 'b' }]),
		pa0 = pa[0],
		pa0i = pa0.inner,
		events = [],
		eventsA = [];

	Observable.observe(pa, eventsList => Array.prototype.push.apply(events, eventsList));

	pa[0].text = 'b';
	pa0i.test = 'test';
	assert.strictEqual(events.length, 2);
	events.splice(0);

	const shifted = pa.shift();
	assert.deepStrictEqual(shifted, { text: 'b', inner: { test: 'test' } });

	assert.strictEqual(events.length, 1);
	assert.deepStrictEqual(events[0], { type: 'delete', path: [0], value: undefined, oldValue: { text: 'b', inner: { test: 'test' } }, object: pa });
	events.splice(0);

	pa[0].text = 'c';
	assert.strictEqual(events.length, 1);
	assert.deepStrictEqual(events[0], { type: 'update', path: [0, 'text'], value: 'c', oldValue: 'b', object: pa[0] });
	events.splice(0);

	shifted.text = 'd';
	assert.strictEqual(events.length, 0);

	Observable.observe(pa0i, changes => Array.prototype.push.apply(eventsA, changes));
	pa0i.test = 'dk';
	assert.strictEqual(eventsA.length, 1);
});

suite.test('array reverse - primitives (flat array)', () => {
	const
		pa = Observable.from([1, 2, 3]),
		events = [];

	Observable.observe(pa, eventsList => {
		[].push.apply(events, eventsList);
	});

	const reversed = pa.reverse();

	assert.strictEqual(reversed, pa);
	assert.strictEqual(events.length, 1);
	assert.deepStrictEqual(events[0], { type: 'reverse', path: [], value: undefined, oldValue: undefined, object: pa });
	assert.deepStrictEqual(pa, [3, 2, 1]);
});

suite.test('array reverse - primitives (nested array)', () => {
	const
		pa = Observable.from({ a1: { a2: [1, 2, 3] } }),
		events = [];

	Observable.observe(pa, eventsList => {
		[].push.apply(events, eventsList);
	});

	const reversed = pa.a1.a2.reverse();

	assert.strictEqual(reversed, pa.a1.a2);
	assert.strictEqual(events.length, 1);
	assert.deepStrictEqual(events[0], { type: 'reverse', path: ['a1', 'a2'], value: undefined, oldValue: undefined, object: pa.a1.a2 });
	assert.deepStrictEqual(pa.a1.a2, [3, 2, 1]);
});

suite.test('array reverse - objects', () => {
	const
		pa = Observable.from([{ name: 'a' }, { name: 'b' }, { name: 'c' }]),
		events = [];

	Observable.observe(pa, eventsList => {
		[].push.apply(events, eventsList);
	});

	pa[0].name = 'A';
	const reversed = pa.reverse();
	pa[0].name = 'C';

	assert.strictEqual(reversed, pa);
	assert.strictEqual(events.length, 3);
	assert.deepStrictEqual(events[0], { type: 'update', path: [0, 'name'], value: 'A', oldValue: 'a', object: pa[2] });
	assert.deepStrictEqual(events[1], { type: 'reverse', path: [], value: undefined, oldValue: undefined, object: pa });
	assert.deepStrictEqual(events[2], { type: 'update', path: [0, 'name'], value: 'C', oldValue: 'c', object: pa[0] });
});

suite.test('array sort - primitives (flat array)', () => {
	const
		pa = Observable.from([3, 2, 1]),
		events = [];

	Observable.observe(pa, eventsList => {
		[].push.apply(events, eventsList);
	});

	let sorted = pa.sort();

	assert.strictEqual(sorted, pa);
	assert.strictEqual(events.length, 1);
	assert.deepStrictEqual(events[0], { type: 'shuffle', path: [], value: undefined, oldValue: undefined, object: pa });
	assert.deepStrictEqual(pa, [1, 2, 3]);

	sorted = pa.sort((a, b) => {
		return a < b ? 1 : -1;
	});
	assert.strictEqual(sorted, pa);
	assert.strictEqual(events.length, 2);
	assert.deepStrictEqual(events[1], { type: 'shuffle', path: [], value: undefined, oldValue: undefined, object: pa });
	assert.deepStrictEqual(pa, [3, 2, 1]);
});

suite.test('array sort - primitives (nested array)', () => {
	const
		pa = Observable.from({ a1: { a2: [3, 2, 1] } }),
		events = [];

	Observable.observe(pa, eventsList => {
		[].push.apply(events, eventsList);
	});

	let sorted = pa.a1.a2.sort();

	assert.strictEqual(sorted, pa.a1.a2);
	assert.strictEqual(events.length, 1);
	assert.deepStrictEqual(events[0], { type: 'shuffle', path: ['a1', 'a2'], value: undefined, oldValue: undefined, object: pa.a1.a2 });
	assert.deepStrictEqual(pa.a1.a2, [1, 2, 3]);

	sorted = pa.a1.a2.sort((a, b) => {
		return a < b ? 1 : -1;
	});
	assert.strictEqual(sorted, pa.a1.a2);
	assert.strictEqual(events.length, 2);
	assert.deepStrictEqual(events[1], { type: 'shuffle', path: ['a1', 'a2'], value: undefined, oldValue: undefined, object: pa.a1.a2 });
	assert.deepStrictEqual(pa.a1.a2, [3, 2, 1]);
});

suite.test('array sort - objects', () => {
	const
		pa = Observable.from([{ name: 'a' }, { name: 'b' }, { name: 'c' }]),
		events = [];

	Observable.observe(pa, eventsList => {
		[].push.apply(events, eventsList);
	});

	pa[0].name = 'A';
	const sorted = pa.sort((a, b) => {
		return a.name < b.name ? 1 : -1;
	});
	pa[0].name = 'C';

	assert.strictEqual(sorted, pa);
	assert.strictEqual(events.length, 3);
	assert.deepStrictEqual(events[0], { type: 'update', path: [0, 'name'], value: 'A', oldValue: 'a', object: pa[2] });
	assert.deepStrictEqual(events[1], { type: 'shuffle', path: [], value: undefined, oldValue: undefined, object: pa });
	assert.deepStrictEqual(events[2], { type: 'update', path: [0, 'name'], value: 'C', oldValue: 'c', object: pa[0] });
});

suite.test('array fill - primitives', () => {
	const
		pa = Observable.from([1, 2, 3]),
		events = [];

	Observable.observe(pa, eventsList => {
		[].push.apply(events, eventsList);
	});

	const filled = pa.fill('a');
	assert.strictEqual(filled, pa);
	assert.strictEqual(events.length, 3);
	assert.deepStrictEqual(events[0], { type: 'update', path: [0], value: 'a', oldValue: 1, object: pa });
	assert.deepStrictEqual(events[1], { type: 'update', path: [1], value: 'a', oldValue: 2, object: pa });
	assert.deepStrictEqual(events[2], { type: 'update', path: [2], value: 'a', oldValue: 3, object: pa });
	events.splice(0);

	pa.fill('b', 1, 3);
	assert.strictEqual(events.length, 2);
	assert.deepStrictEqual(events[0], { type: 'update', path: [1], value: 'b', oldValue: 'a', object: pa });
	assert.deepStrictEqual(events[1], { type: 'update', path: [2], value: 'b', oldValue: 'a', object: pa });
	events.splice(0);

	pa.fill('c', -1, 3);
	assert.strictEqual(events.length, 1);
	assert.deepStrictEqual(events[0], { type: 'update', path: [2], value: 'c', oldValue: 'b', object: pa });
	events.splice(0);

	//	simulating insertion of a new item into array (fill does not extend an array, so we may do it only on internal items)
	delete pa[1];
	pa.fill('d', 1, 2);
	assert.strictEqual(events.length, 2);
	assert.deepStrictEqual(events[0], { type: 'delete', path: ['1'], value: undefined, oldValue: 'b', object: pa });
	assert.deepStrictEqual(events[1], { type: 'insert', path: [1], value: 'd', oldValue: undefined, object: pa });
});

suite.test('array fill - objects', () => {
	const
		pa = Observable.from([{ some: 'text' }, { some: 'else' }, { some: 'more' }]),
		events = [];

	Observable.observe(pa, eventsList => {
		[].push.apply(events, eventsList);
	});

	const filled = pa.fill({ name: 'Niv' });
	assert.strictEqual(filled, pa);
	assert.strictEqual(events.length, 3);
	assert.deepStrictEqual(events[0], { type: 'update', path: [0], value: { name: 'Niv' }, oldValue: { some: 'text' }, object: pa });
	assert.deepStrictEqual(events[1], { type: 'update', path: [1], value: { name: 'Niv' }, oldValue: { some: 'else' }, object: pa });
	assert.deepStrictEqual(events[2], { type: 'update', path: [2], value: { name: 'Niv' }, oldValue: { some: 'more' }, object: pa });
	events.splice(0);

	pa[1].name = 'David';
	assert.strictEqual(events.length, 1);
	assert.deepStrictEqual(events[0], { type: 'update', path: [1, 'name'], value: 'David', oldValue: 'Niv', object: pa[1] });
});

suite.test('array fill - arrays', () => {
	const
		pa = Observable.from([{ some: 'text' }, { some: 'else' }, { some: 'more' }]),
		events = [];

	Observable.observe(pa, eventsList => {
		[].push.apply(events, eventsList);
	});

	const filled = pa.fill([{ name: 'Niv' }]);
	assert.strictEqual(filled, pa);
	assert.strictEqual(events.length, 3);
	assert.deepStrictEqual(events[0], { type: 'update', path: [0], value: [{ name: 'Niv' }], oldValue: { some: 'text' }, object: pa });
	assert.deepStrictEqual(events[1], { type: 'update', path: [1], value: [{ name: 'Niv' }], oldValue: { some: 'else' }, object: pa });
	assert.deepStrictEqual(events[2], { type: 'update', path: [2], value: [{ name: 'Niv' }], oldValue: { some: 'more' }, object: pa });
	events.splice(0);

	pa[1][0].name = 'David';
	assert.strictEqual(events.length, 1);
	assert.deepStrictEqual(events[0], { type: 'update', path: [1, 0, 'name'], value: 'David', oldValue: 'Niv', object: pa[1][0] });
});

suite.test('array splice - primitives', () => {
	const
		pa = Observable.from([1, 2, 3, 4, 5, 6]),
		events = [];
	let callbacks = 0;

	Observable.observe(pa, eventsList => {
		[].push.apply(events, eventsList);
		callbacks++;
	});

	const spliced = pa.splice(2, 2, 'a');
	assert.isArray(spliced);
	assert.strictEqual(spliced.length, 2);
	assert.strictEqual(spliced[0], 3);
	assert.strictEqual(spliced[1], 4);
	assert.strictEqual(events.length, 2);
	assert.strictEqual(callbacks, 1);
	assert.deepStrictEqual(events[0], { type: 'update', path: [2], value: 'a', oldValue: 3, object: pa });
	assert.deepStrictEqual(events[1], { type: 'delete', path: [3], value: undefined, oldValue: 4, object: pa });
	events.splice(0);
	callbacks = 0;

	//  pa = [1,2,'a',5,6]
	pa.splice(-3);
	assert.strictEqual(events.length, 3);
	assert.strictEqual(callbacks, 1);
	assert.deepStrictEqual(events[0], { type: 'delete', path: [2], value: undefined, oldValue: 'a', object: pa });
	assert.deepStrictEqual(events[1], { type: 'delete', path: [3], value: undefined, oldValue: 5, object: pa });
	assert.deepStrictEqual(events[2], { type: 'delete', path: [4], value: undefined, oldValue: 6, object: pa });
	events.splice(0);
	callbacks = 0;

	//  pa = [1,2]
	pa.splice(0);
	assert.strictEqual(events.length, 2);
	assert.strictEqual(callbacks, 1);
	assert.deepStrictEqual(events[0], { type: 'delete', path: [0], value: undefined, oldValue: 1, object: pa });
	assert.deepStrictEqual(events[1], { type: 'delete', path: [1], value: undefined, oldValue: 2, object: pa });
	events.splice(0);
	callbacks = 0;
});

suite.test('array splice - objects', () => {
	const
		pa = Observable.from([{ text: 'a' }, { text: 'b' }, { text: 'c' }, { text: 'd' }]),
		events = [];

	Observable.observe(pa, eventsList => {
		[].push.apply(events, eventsList);
	});

	pa.splice(1, 2, { text: '1' });
	assert.strictEqual(events.length, 2);
	assert.deepStrictEqual(events[0], { type: 'update', path: [1], value: { text: '1' }, oldValue: { text: 'b' }, object: pa });
	assert.deepStrictEqual(events[1], { type: 'delete', path: [2], value: undefined, oldValue: { text: 'c' }, object: pa });
	events.splice(0);

	pa[1].text = 'B';
	pa[2].text = 'D';
	assert.strictEqual(events.length, 2);
	assert.deepStrictEqual(events[0], { type: 'update', path: [1, 'text'], value: 'B', oldValue: '1', object: pa[1] });
	assert.deepStrictEqual(events[1], { type: 'update', path: [2, 'text'], value: 'D', oldValue: 'd', object: pa[2] });
	events.splice(0);

	pa.splice(1, 1, { text: 'A' }, { text: 'B' });
	assert.strictEqual(events.length, 2);
	assert.deepStrictEqual(events[0], { type: 'update', path: [1], value: { text: 'A' }, oldValue: { text: 'B' }, object: pa });
	assert.deepStrictEqual(events[1], { type: 'insert', path: [2], value: { text: 'B' }, oldValue: undefined, object: pa });
	events.splice(0);

	pa[3].text = 'C';
	assert.strictEqual(events.length, 1);
	assert.deepStrictEqual(events[0], { type: 'update', path: [3, 'text'], value: 'C', oldValue: 'D', object: pa[3] });
});

suite.test('array splice - arrays', () => {
	const
		pa = Observable.from([{ text: 'a' }, { text: 'b' }, { text: 'c' }, { text: 'd' }]),
		events = [];

	Observable.observe(pa, eventsList => {
		[].push.apply(events, eventsList);
	});

	pa.splice(1, 2, [{ text: '1' }]);
	assert.strictEqual(events.length, 2);
	assert.deepStrictEqual(events[0], { type: 'update', path: [1], value: [{ text: '1' }], oldValue: { text: 'b' }, object: pa });
	assert.deepStrictEqual(events[1], { type: 'delete', path: [2], value: undefined, oldValue: { text: 'c' }, object: pa });
	events.splice(0);

	pa[1][0].text = 'B';
	pa[2].text = 'D';
	assert.strictEqual(events.length, 2);
	assert.deepStrictEqual(events[0], { type: 'update', path: [1, 0, 'text'], value: 'B', oldValue: '1', object: pa[1][0] });
	assert.deepStrictEqual(events[1], { type: 'update', path: [2, 'text'], value: 'D', oldValue: 'd', object: pa[2] });
	events.splice(0);

	const spliced = pa.splice(1, 1, { text: 'A' }, [{ text: 'B' }]);
	assert.strictEqual(events.length, 2);
	assert.strictEqual(spliced.length, 1);
	assert.deepStrictEqual(spliced[0], [{ text: 'B' }]);

	assert.deepStrictEqual(events[0], { type: 'update', path: [1], value: { text: 'A' }, oldValue: [{ text: 'B' }], object: pa });
	assert.deepStrictEqual(events[1], { type: 'insert', path: [2], value: [{ text: 'B' }], oldValue: undefined, object: pa });
	events.splice(0);

	pa[3].text = 'C';
	assert.strictEqual(events.length, 1);
	assert.deepStrictEqual(events[0], { type: 'update', path: [3, 'text'], value: 'C', oldValue: 'D', object: pa[3] });
});