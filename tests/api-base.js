import { assert } from 'chai';
import { getSuite } from 'just-test/suite';
import { Observable } from '../src/object-observer.js';

const suite = getSuite('Testing Observable APIs');

suite.test('ensure Observable object has defined APIs', () => {
	assert.equal(typeof Observable, 'object');
	assert.equal(typeof Observable.from, 'function');
	assert.equal(typeof Observable.isObservable, 'function');
	assert.equal(typeof Observable.observe, 'function');
	assert.equal(typeof Observable.unobserve, 'function');
	assert.equal(4, Object.keys(Observable).length);
});

suite.test('ensure Observable object is frozen', () => {
	const failErrorMessage = 'should not reach this point';
	try {
		Observable.some = 'prop';
		throw new Error(failErrorMessage);
	} catch (e) {
		assert.notEqual(failErrorMessage, e.message);
	}
});

suite.test('negative tests - invalid parameters', () => {
	let bo,
		safeToContinue = false;
	try {
		Observable.from(bo);
	} catch (e) {
		safeToContinue = true;
	}
	assert.isTrue(safeToContinue);

	bo = null;
	safeToContinue = false;
	try {
		Observable.from(bo);
	} catch (e) {
		safeToContinue = true;
	}
	assert.isTrue(safeToContinue);

	bo = true;
	safeToContinue = false;
	try {
		Observable.from(bo);
	} catch (e) {
		safeToContinue = true;
	}
	assert.isTrue(safeToContinue);

	bo = 1;
	safeToContinue = false;
	try {
		Observable.from(bo);
	} catch (e) {
		safeToContinue = true;
	}
	assert.isTrue(safeToContinue);

	bo = 'string';
	safeToContinue = false;
	try {
		Observable.from(bo);
	} catch (e) {
		safeToContinue = true;
	}
	assert.isTrue(safeToContinue);

	bo = function () {
	};
	safeToContinue = false;
	try {
		Observable.from(bo);
	} catch (e) {
		safeToContinue = true;
	}
	assert.isTrue(safeToContinue);
});

suite.test('isObservable tests', () => {
	assert.isFalse(Observable.isObservable('some'));
	assert.isFalse(Observable.isObservable(null));
	assert.isFalse(Observable.isObservable({}));
	assert.isTrue(Observable.isObservable(Observable.from({})));

	const oo = Observable.from({ nested: {} });
	assert.isTrue(Observable.isObservable(oo));
});

suite.test('test observable APIs - ensure APIs are not enumerables', () => {
	const oo = Observable.from({});

	assert.equal(0, Object.keys(oo).length);

	const aa = Observable.from([]);

	assert.equal(0, Object.keys(aa).length);
});

suite.test('negative - invalid options - not an object', () => {
	assert.throws(() => Observable.from({}, 4), 'Observable options if/when provided, MAY only be an object');
});

suite.test('negative - invalid options - wrong param', () => {
	assert.throws(() => Observable.from({}, { invalid: 'key' }), 'is/are not a valid Observable option/s');
});

suite.test('negative observe - invalid observable', () => {
	assert.throws(() => Observable.observe({}), 'invalid observable parameter');
});

suite.test('negative unobserve - invalid observable', () => {
	assert.throws(() => Observable.unobserve({}), 'invalid observable parameter');
});