import { test } from '@gullerya/just-test';
import { assert } from '@gullerya/just-test/assert';
import { Observable } from '../src/object-observer.js';

test('ensure Observable object has defined APIs', () => {
	assert.equal(typeof Observable, 'object');
	assert.equal(typeof Observable.from, 'function');
	assert.equal(typeof Observable.isObservable, 'function');
	assert.equal(typeof Observable.observe, 'function');
	assert.equal(typeof Observable.unobserve, 'function');
	assert.equal(Object.keys(Observable).length, 4);
});

test('ensure Observable object is frozen', () => {
	assert.throws(() => Observable.some = 'prop');
});

test('negative tests - invalid parameters', () => {
	assert.throws(() => Observable.from(undefined), 'observable MAY ONLY be created from');

	assert.throws(() => Observable.from(null), 'observable MAY ONLY be created from');

	assert.throws(() => Observable.from(true), 'observable MAY ONLY be created from');

	assert.throws(() => Observable.from(1), 'observable MAY ONLY be created from');

	assert.throws(() => Observable.from('string'), 'observable MAY ONLY be created from');

	assert.throws(() => Observable.from(() => { }), 'observable MAY ONLY be created from');
});

test('isObservable tests', () => {
	assert.isFalse(Observable.isObservable('some'));
	assert.isFalse(Observable.isObservable(null));
	assert.isFalse(Observable.isObservable({}));
	assert.isTrue(Observable.isObservable(Observable.from({})));

	const oo = Observable.from({ nested: {} });
	assert.isTrue(Observable.isObservable(oo));
});

test('test observable APIs - ensure APIs are not enumerables', () => {
	const oo = Observable.from({});

	assert.equal(Object.keys(oo).length, 0);

	const aa = Observable.from([]);

	assert.equal(Object.keys(aa).length, 0);
});

test('negative - invalid options - not an object', () => {
	assert.throws(() => Observable.from({}, 4), 'Observable options if/when provided, MAY only be an object');
});

test('negative - invalid options - wrong param', () => {
	assert.throws(() => Observable.from({}, { invalid: 'key' }), 'is/are not a valid Observable option/s');
});

test('negative observe - invalid observable', () => {
	assert.throws(() => Observable.observe({}), 'invalid observable parameter');
});

test('negative unobserve - invalid observable', () => {
	assert.throws(() => Observable.unobserve({}), 'invalid observable parameter');
});