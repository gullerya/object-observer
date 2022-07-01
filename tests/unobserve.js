import { assert } from 'chai';
import { getSuite } from 'just-test/suite';
import { Observable } from '../src/object-observer.js';

const suite = getSuite('Testing unobserving/removal of observed object (static API)');

suite.test('test unobserve - single observer - explicit unobserve', () => {
	const
		oo = Observable.from({ some: 'text' }),
		observer = function () {
			cntr++;
		};
	let cntr = 0;

	Observable.observe(oo, observer);

	oo.some = 'thing';
	assert.equal(cntr, 1);

	cntr = 0;
	Observable.unobserve(oo, observer);
	oo.some = 'true';
	assert.equal(cntr, 0);
});

suite.test('test unobserve - few observers - explicit unobserve', () => {
	const
		oo = Observable.from({ some: 'text' }),
		observerA = function () {
			cntrA++;
		},
		observerB = function () {
			cntrB++;
		};
	let cntrA = 0,
		cntrB = 0;

	Observable.observe(oo, observerA);
	Observable.observe(oo, observerB);

	oo.some = 'thing';
	assert.equal(cntrA, 1);
	assert.equal(cntrB, 1);

	cntrA = 0;
	cntrB = 0;
	Observable.unobserve(oo, observerA);
	oo.some = 'true';
	assert.equal(cntrA, 0);
	assert.equal(cntrB, 1);

	cntrA = 0;
	cntrB = 0;
	Observable.unobserve(oo, observerB);
	oo.some = 'back';
	assert.equal(cntrA, 0);
	assert.equal(cntrB, 0);
});

suite.test('test unobserve - unobserve few', () => {
	const
		oo = Observable.from({ some: 'text' }),
		observerA = function () {
			cntrA++;
		},
		observerB = function () {
			cntrB++;
		};
	let cntrA = 0,
		cntrB = 0;

	Observable.observe(oo, observerA);
	Observable.observe(oo, observerB);

	oo.some = 'thing';
	assert.equal(cntrA, 1);
	assert.equal(cntrB, 1);

	cntrA = 0;
	cntrB = 0;
	Observable.unobserve(oo, observerA, observerB);
	oo.some = 'true';
	assert.equal(cntrA, 0);
	assert.equal(cntrB, 0);
});

suite.test('test unobserve - unobserve all', () => {
	const
		oo = Observable.from({ some: 'text' }),
		observerA = function () {
			cntrA++;
		},
		observerB = function () {
			cntrB++;
		};
	let cntrA = 0,
		cntrB = 0;

	Observable.observe(oo, observerA);
	Observable.observe(oo, observerB);

	oo.some = 'thing';
	assert.equal(cntrA, 1);
	assert.equal(cntrB, 1);

	cntrA = 0;
	cntrB = 0;
	Observable.unobserve(oo);
	oo.some = 'true';
	assert.equal(cntrA, 0);
	assert.equal(cntrB, 0);
});

suite.test('test unobserve - observe, unobserve and observe again', () => {
	const
		oo = Observable.from({ some: 'text' }),
		observer = function () {
			cntr++;
		};
	let cntr = 0;

	Observable.observe(oo, observer);
	oo.some = 'thing';
	assert.equal(cntr, 1);

	Observable.unobserve(oo);
	oo.some = 'true';
	assert.equal(cntr, 1);

	Observable.observe(oo, observer);
	oo.some = 'again';
	assert.equal(cntr, 2);
});

suite.test('test unobserve - on observers set case', () => {
	const oo = Observable.from({ some: 'text' });

	Observable.unobserve(oo, () => { });
});
