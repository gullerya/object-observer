import { assert } from 'chai';
import { getSuite } from 'just-test/suite';
import { Observable } from '../src/object-observer.js';

const suite = getSuite('Test observing specific path/s');

suite.test('baseline - negative - path not a string', () => {
	const oo = Observable.from({});
	assert.throws(
		() => Observable.observe(oo, () => { }, { path: 4 }),
		'"path" option, if/when provided, MUST be a non-empty string'
	);
});

suite.test('baseline - negative - path empty', () => {
	const oo = Observable.from({});
	assert.throws(
		() => Observable.observe(oo, () => { }, { path: '' }),
		'"path" option, if/when provided, MUST be a non-empty string'
	);
});

suite.test('baseline - negative - pathsFrom not a string', () => {
	const oo = Observable.from({});
	assert.throws(
		() => Observable.observe(oo, () => { }, { pathsFrom: 4 }),
		'"pathsFrom" option, if/when provided, MUST be a non-empty string'
	);
});

suite.test('baseline - negative - pathsFrom empty', () => {
	const oo = Observable.from({});
	assert.throws(
		() => Observable.observe(oo, () => { }, { pathsFrom: '' }),
		'"pathsFrom" option, if/when provided, MUST be a non-empty string'
	);
});

suite.test('baseline - negative - no pathsFrom when path present', () => {
	const oo = Observable.from({});
	assert.throws(
		() => Observable.observe(oo, () => { }, { path: 'some', pathsFrom: 'else' }),
		'"pathsFrom" option MAY NOT be specified together with'
	);
});

suite.test('baseline - negative - no foreign options (pathFrom)', () => {
	const oo = Observable.from({});
	assert.throws(
		() => Observable.observe(oo, () => { }, { pathFrom: 'something' }),
		'is/are not a valid observer option/s'
	);
});

suite.test('observe paths of - negative a', () => {
	const oo = Observable.from({});
	assert.throws(
		() => Observable.observe(oo, () => { }, { pathsOf: 4 }),
		'"pathsOf" option, if/when provided, MUST be a string (MAY be empty)'
	);
});

suite.test('observe paths of - negative b', () => {
	const oo = Observable.from({});
	assert.throws(
		() => Observable.observe(oo, () => { }, { path: 'inner.prop', pathsOf: 'some.thing' }),
		'"pathsOf" option MAY NOT be specified together with "path" option'
	);
});

suite.test('baseline - no options / empty options', () => {
	const
		oo = Observable.from({ inner: { prop: 'more' } }),
		observer = changes => (counter += changes.length);
	let counter = 0;

	//  null is valid
	Observable.observe(oo, observer, null);
	oo.inner.prop = 'else';

	assert(counter, 1);
	Observable.unobserve(oo, observer);
});

suite.test('baseline - empty options is valid', () => {
	const
		oo = Observable.from({ inner: { prop: 'more' } }),
		observer = changes => (counter += changes.length);
	let counter = 0;
	Observable.observe(oo, observer, {});
	oo.inner.prop = 'even';

	assert(counter, 1);
	Observable.unobserve(oo, observer);
});

suite.test('observe specific path', () => {
	const oo = Observable.from({ inner: { prop: 'more' } });
	let callbackCalls = 0,
		changesCounter = 0;

	Observable.observe(oo, changes => {
		callbackCalls++;
		changesCounter += changes.length;
	}, { path: 'inner' });

	oo.newProp = 'non-relevant';
	oo.inner.other = 'non-relevant';
	oo.inner = {};

	assert(changesCounter, 1);
	assert(callbackCalls, 1);
});

suite.test('observe paths from .. and deeper', () => {
	const oo = Observable.from({ inner: { prop: 'more', nested: { text: 'text' } } });
	let counter = 0;

	Observable.observe(oo, changes => { counter += changes.length; }, { pathsFrom: 'inner.prop' });
	oo.nonRelevant = 'non-relevant';
	oo.inner.also = 'non-relevant';
	oo.inner.prop = 'relevant';
	oo.inner.prop = {};
	oo.inner.prop.deepRelevant = 'again';
	assert.equal(counter, 3);
});

suite.test('observe paths of - inner case', () => {
	const oo = Observable.from({ inner: { prop: 'more', nested: { text: 'text' } } });
	let counter = 0;
	Observable.observe(oo, changes => { counter += changes.length; }, { pathsOf: 'inner.nested' });
	oo.nonRelevant = 'non-relevant';
	oo.inner.also = 'non-relevant';
	oo.inner.nested.text = 'relevant';
	oo.inner.nested.else = 'also relevant';
	oo.inner.nested = { nesnes: { test: 'non-relevant' } };
	oo.inner.nested.nesnes.test = 'non-relevant';
	assert.equal(counter, 2);
});

suite.test('observe paths of - array - property of same depth updated', () => {
	const oo = Observable.from({ array: [1, 2, 3], prop: { inner: 'value' } });
	let counter = 0;
	Observable.observe(oo, changes => { counter += changes.length; }, { pathsOf: 'array' });
	oo.nonRelevant = 'non-relevant';
	oo.prop.inner = 'non-relevant';
	oo.prop = { newObj: { test: 'non-relevant' } };
	oo.array.pop();
	oo.array.push({ newObj: { test: 'relevant' } });
	oo.array[2].newObj.test = 'non-relevant';
	assert.equal(counter, 2);
});

suite.test('observe paths of - root case', () => {
	const oo = Observable.from({ inner: { prop: 'more', nested: { text: 'text' } } });
	let counter = 0;
	Observable.observe(oo, changes => { counter += changes.length; }, { pathsOf: '' });
	oo.relevant = 'relevant';
	oo.inner.also = 'non-relevant';
	oo.inner = { newObj: { test: 'relevant' } };
	oo.inner.newObj.test = 'non-relevant';
	assert.equal(counter, 2);
});

suite.test('observe paths of - root case - array sort', () => {
	const oo = Observable.from([1, 3, 2, 4, 9]);
	let counter = 0;
	Observable.observe(oo, changes => { counter += changes.length; }, { pathsOf: '' });
	oo.sort();
	assert.isTrue(oo[0] === 1 && oo[1] === 2 && oo[2] === 3 && oo[3] === 4 && oo[4] === 9);
	assert.equal(counter, 1);
});

suite.test('observe paths of - root case - array reverse', () => {
	const oo = Observable.from([1, 2, 3, 4, 9]);
	let counter = 0;
	Observable.observe(oo, changes => { counter += changes.length; }, { pathsOf: '' });
	oo.reverse();
	assert.isTrue(oo[0] === 9 && oo[1] === 4 && oo[2] === 3 && oo[3] === 2 && oo[4] === 1);
	assert.equal(counter, 1);
});
