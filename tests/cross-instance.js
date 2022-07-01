import { assert } from 'chai';
import { getSuite } from 'just-test/suite';
import { Observable as O1, ObjectObserver as OO1 } from '../src/object-observer.js?1';
import { Observable as O2, ObjectObserver as OO2 } from '../src/object-observer.js?2';

const suite = getSuite('Testing cross instance workability');

suite.test('Observable.isObservable interoperable', () => {
	assert.notEqual(O1, O2);
	const obsbl1 = O1.from({});
	assert.isTrue(O1.isObservable(obsbl1));
	assert.isTrue(O2.isObservable(obsbl1));
	const obsbl2 = O2.from({});
	assert.isTrue(O2.isObservable(obsbl2));
	assert.isTrue(O1.isObservable(obsbl2));
});

suite.test('Observable.from interoperable', () => {
	const obsbl1 = O1.from({});
	const obsbl2 = O2.from(obsbl1);
	assert.equal(obsbl1, obsbl2);

	const obsbl3 = O2.from({});
	const obsbl4 = O1.from(obsbl3);
	assert.equal(obsbl3, obsbl4);
});

suite.test('callbacks are interoperable', () => {
	const obsbl1 = O1.from({});
	const obsbl2 = O2.from(obsbl1);
	assert.equal(obsbl1, obsbl2);

	let count = 0;
	O1.observe(obsbl1, es => count += es.length);
	O2.observe(obsbl2, es => count += es.length);

	obsbl1.some = 'thing';
	obsbl2.some = 'else';

	assert.equal(count, 4);
});

suite.test('ObjectObserver interoperable', () => {
	assert.notEqual(OO1, OO2);
	let count = 0;
	const oo1 = new OO1(es => count += es.length);
	const oo2 = new OO2(es => count += es.length);

	const o1 = oo1.observe({});
	const o2 = oo2.observe(o1);
	assert.equal(o1, o2);

	o1.some = 'thing';
	o2.some = 'else';

	assert.equal(count, 4);
});