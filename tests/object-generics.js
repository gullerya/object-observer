import { assert } from 'chai';
import { getSuite } from 'just-test/suite';
import { Observable } from '../src/object-observer.js';

const suite = getSuite('Testing Object generic methods');

suite.test('Object.seal - further extensions should fail', () => {
	const oo = Observable.from({ propA: 'a', propB: 'b' });
	Object.seal(oo);
	assert.throws(() => oo.propC = 'c', TypeError);
});

suite.test('Object.seal - props removal should fail', () => {
	const oo = Observable.from({ propA: 'a', propB: 'b' });
	Object.seal(oo);
	assert.throws(() => delete oo.propA, TypeError);
});

suite.test('Object.seal - modifications allowed', () => {
	const oo = Observable.from({ propA: 'a', propB: 'b' });
	let events = 0;
	Object.seal(oo);
	Observable.observe(oo, changes => { events += changes.length; });
	oo.propA = 'A';
	assert.strictEqual(events, 1);
});

suite.test('Object.seal - nested - further extensions should fail', () => {
	const oo = Observable.from({ nested: { propA: 'a', propB: 'b' } });
	Object.seal(oo.nested);
	assert.throws(() => oo.nested.propC = 'c', TypeError);
});

suite.test('Object.seal - nested - props removal should fail', () => {
	const oo = Observable.from({ nested: { propA: 'a', propB: 'b' } });
	Object.seal(oo.nested);
	assert.throws(() => delete oo.nested.propA, TypeError);
});

suite.test('Object.seal - nested - modifications allowed', () => {
	const oo = Observable.from({ nested: { propA: 'a', propB: 'b' } });
	let events = 0;
	Object.seal(oo.nested);
	Observable.observe(oo, changes => { events += changes.length; });
	oo.nested.propA = 'A';
	assert.equal(events, 1);
});