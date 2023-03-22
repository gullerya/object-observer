import { test } from '@gullerya/just-test';
import { assert } from '@gullerya/just-test/assert';
import { Observable } from '../src/object-observer.js';

test('inner object from observable should fire events as usual', () => {
	const
		oo = Observable.from({ inner: { prop: 'more' } }),
		iop = oo.inner,
		events = [],
		observer = function (changes) {
			events.push.apply(events, changes);
		};

	Observable.observe(oo, observer);
	iop.prop = 'else';
	iop.new = 'prop';

	assert.strictEqual(events.length, 2);
	assert.deepStrictEqual(events[0], { type: 'update', path: ['inner', 'prop'], value: 'else', oldValue: 'more', object: iop });
	assert.deepStrictEqual(events[1], { type: 'insert', path: ['inner', 'new'], value: 'prop', oldValue: undefined, object: iop });
});

test('removal (detaching) of inner object from observable should detach its events', () => {
	const
		oo = Observable.from({ inner: { prop: 'more' } }),
		iop = oo.inner,
		observer = function () {
			cntr++;
		};
	let cntr = 0;

	Observable.observe(oo, observer);
	iop.prop = 'text';
	assert.strictEqual(cntr, 1);

	oo.inner = null;
	cntr = 0;
	iop.prop = 'again';
	assert.strictEqual(cntr, 0);
});

test('replacement of inner object from observable should return non-proxified original object', () => {
	const oo = Observable.from({ inner: { prop: 'more', nested: { text: 'text' } } });
	let events = [];
	Observable.observe(oo, changes => Array.prototype.push.apply(events, changes));

	oo.inner.prop = 'some';
	assert.strictEqual(events.length, 1);
	assert.deepStrictEqual(events[0], { type: 'update', path: ['inner', 'prop'], value: 'some', oldValue: 'more', object: oo.inner });
	events = [];

	oo.inner = { p: 'back' };
	assert.strictEqual(events.length, 1);
	assert.deepStrictEqual(events[0], { type: 'update', path: ['inner'], value: { p: 'back' }, oldValue: { prop: 'some', nested: { text: 'text' } }, object: oo });
});

test('Object.assign on observable should raise an event/s of update with non-proxified original object', () => {
	const
		observable = Observable.from({ b: { b1: 'x', b2: 'y' } }),
		newData = { b: { b1: 'z' } },
		events = [];
	Observable.observe(observable, changes => events.push.apply(events, changes));

	Object.assign(observable, newData);

	assert.strictEqual(events.length, 1);
	assert.deepStrictEqual(events[0], { type: 'update', path: ['b'], value: { b1: 'z' }, oldValue: { b1: 'x', b2: 'y' }, object: observable });
});