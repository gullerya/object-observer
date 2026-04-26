import { test } from '@gullerya/just-test';
import { assert } from '@gullerya/just-test/assert';
import { Observable, Filter } from '../src/object-observer.ts';

test('baseline - negative - filters not an array', () => {
	const oo = Observable.from({});
	assert.throws(
		() => Observable.observe(oo, () => { }, { filters: 'nope' }),
		'"filters" option, if/when provided, MUST be a non-empty array of Filter instances'
	);
});

test('baseline - negative - filters empty array', () => {
	const oo = Observable.from({});
	assert.throws(
		() => Observable.observe(oo, () => { }, { filters: [] }),
		'"filters" option, if/when provided, MUST be a non-empty array of Filter instances'
	);
});

test('baseline - negative - filters contains non-Filter element', () => {
	const oo = Observable.from({});
	assert.throws(
		() => Observable.observe(oo, () => { }, { filters: [Filter.exactPaths(['a']), 'bad'] }),
		'"filters" option, if/when provided, MUST be a non-empty array of Filter instances'
	);
});

test('baseline - negative - foreign option', () => {
	const oo = Observable.from({});
	assert.throws(
		() => Observable.observe(oo, () => { }, { somethingElse: 'x' }),
		'is/are not a valid observer option/s'
	);
});

test('baseline - no options / empty options', () => {
	const
		oo = Observable.from({ inner: { prop: 'more' } }),
		observer = changes => (counter += changes.length);
	let counter = 0;

	//  null is valid
	Observable.observe(oo, observer, null);
	oo.inner.prop = 'else';

	assert.strictEqual(counter, 1);
	Observable.unobserve(oo, observer);
});

test('baseline - empty options is valid', () => {
	const
		oo = Observable.from({ inner: { prop: 'more' } }),
		observer = changes => (counter += changes.length);
	let counter = 0;
	Observable.observe(oo, observer, {});
	oo.inner.prop = 'even';

	assert.strictEqual(counter, 1);
	Observable.unobserve(oo, observer);
});

test('exactPaths filter - single path', () => {
	const oo = Observable.from({ inner: { prop: 'more' } });
	let callbackCalls = 0,
		changesCounter = 0;

	Observable.observe(oo, changes => {
		callbackCalls++;
		changesCounter += changes.length;
	}, { filters: [Filter.exactPaths(['inner'])] });

	oo.newProp = 'non-relevant';
	oo.inner.other = 'non-relevant';
	oo.inner = {};

	assert.strictEqual(changesCounter, 1);
	assert.strictEqual(callbackCalls, 1);
});

test('pathsStartWith filter - path and deeper', () => {
	const oo = Observable.from({ inner: { prop: 'more', nested: { text: 'text' } } });
	let counter = 0;

	Observable.observe(oo, changes => { counter += changes.length; }, { filters: [Filter.pathsStartWith('inner.prop')] });
	oo.nonRelevant = 'non-relevant';
	oo.inner.also = 'non-relevant';
	oo.inner.prop = 'relevant';
	oo.inner.prop = {};
	oo.inner.prop.deepRelevant = 'again';
	assert.strictEqual(counter, 3);
});

test('directChildrenOf filter - inner case', () => {
	const oo = Observable.from({ inner: { prop: 'more', nested: { text: 'text' } } });
	let counter = 0;
	Observable.observe(oo, changes => { counter += changes.length; }, { filters: [Filter.directChildrenOf('inner.nested')] });
	oo.nonRelevant = 'non-relevant';
	oo.inner.also = 'non-relevant';
	oo.inner.nested.text = 'relevant';
	oo.inner.nested.else = 'also relevant';
	oo.inner.nested = { nesnes: { test: 'non-relevant' } };
	oo.inner.nested.nesnes.test = 'non-relevant';
	assert.strictEqual(counter, 2);
});

test('directChildrenOf filter - array - property of same depth updated', () => {
	const oo = Observable.from({ array: [1, 2, 3], prop: { inner: 'value' } });
	let counter = 0;
	Observable.observe(oo, changes => { counter += changes.length; }, { filters: [Filter.directChildrenOf('array')] });
	oo.nonRelevant = 'non-relevant';
	oo.prop.inner = 'non-relevant';
	oo.prop = { newObj: { test: 'non-relevant' } };
	oo.array.pop();
	oo.array.push({ newObj: { test: 'relevant' } });
	oo.array[2].newObj.test = 'non-relevant';
	assert.equal(counter, 2);
});

test('directChildrenOf filter - root case', () => {
	const oo = Observable.from({ inner: { prop: 'more', nested: { text: 'text' } } });
	let counter = 0;
	Observable.observe(oo, changes => { counter += changes.length; }, { filters: [Filter.directChildrenOf('')] });
	oo.relevant = 'relevant';
	oo.inner.also = 'non-relevant';
	oo.inner = { newObj: { test: 'relevant' } };
	oo.inner.newObj.test = 'non-relevant';
	assert.equal(counter, 2);
});

test('directChildrenOf filter - root case - array sort', () => {
	const oo = Observable.from([1, 3, 2, 4, 9]);
	let counter = 0;
	Observable.observe(oo, changes => { counter += changes.length; }, { filters: [Filter.directChildrenOf('')] });
	oo.sort();
	assert.isTrue(oo[0] === 1 && oo[1] === 2 && oo[2] === 3 && oo[3] === 4 && oo[4] === 9);
	assert.equal(counter, 1);
});

test('directChildrenOf filter - root case - array reverse', () => {
	const oo = Observable.from([1, 2, 3, 4, 9]);
	let counter = 0;
	Observable.observe(oo, changes => { counter += changes.length; }, { filters: [Filter.directChildrenOf('')] });
	oo.reverse();
	assert.isTrue(oo[0] === 9 && oo[1] === 4 && oo[2] === 3 && oo[3] === 2 && oo[4] === 1);
	assert.equal(counter, 1);
});

test('multiple filters compose as AND', () => {
	const oo = Observable.from({ a: { x: 1, y: 2 }, b: { x: 3 } });
	let counter = 0;
	//	direct children of 'a' AND under 'a.x'  →  only 'a.x' changes
	Observable.observe(
		oo,
		changes => { counter += changes.length; },
		{ filters: [Filter.directChildrenOf('a'), Filter.pathsStartWith('a.x')] }
	);
	oo.a.x = 10;	//	kept
	oo.a.y = 20;	//	dropped (not under a.x)
	oo.b.x = 30;	//	dropped (not direct child of a)
	assert.strictEqual(counter, 1);
});

test('directChildrenOf filter - sibling-prefix is not a child', () => {
	//	regression guard: path 'innerX.foo' should NOT be a direct child of 'inner'
	const oo = Observable.from({ inner: { a: 1 }, innerX: { a: 1 } });
	let counter = 0;
	Observable.observe(oo, changes => { counter += changes.length; }, { filters: [Filter.directChildrenOf('inner')] });
	oo.innerX.a = 2;	//	must NOT match
	oo.inner.a = 2;		//	must match
	assert.strictEqual(counter, 1);
});

test('custom filter via Filter.custom', () => {
	const oo = Observable.from({ a: 1, b: 2 });
	let counter = 0;
	Observable.observe(
		oo,
		changes => { counter += changes.length; },
		{ filters: [Filter.custom(cs => cs.filter(c => c.value > 10))] }
	);
	oo.a = 5;		//	dropped
	oo.b = 20;		//	kept
	assert.strictEqual(counter, 1);
});
