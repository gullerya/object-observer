import { assert } from 'chai';
import { getSuite } from 'just-test/suite';
import { Observable } from '../src/object-observer.js';

const suite = getSuite('Testing revokation of removed/replaced objects');

suite.test('test revokation of replaced objects - simple set', () => {
	const og = Observable.from({
		a: {
			b: {
				prop: 'text'
			},
			prop: 'text'
		}
	});
	let eventsCollector = [];
	let errorsInListener = 0;

	Observable.observe(og, changes => {
		try {
			eventsCollector = eventsCollector.concat(changes);
			assert.equal(changes.length, 1);
			assert.deepStrictEqual(changes[0], { type: 'update', path: ['a'], value: { prop: 'text' }, oldValue: { b: { prop: 'text' }, prop: 'text' }, object: og });
		} catch (e) {
			errorsInListener++;
			throw e;
		}
	});

	og.a = og.a.b;
	assert.strictEqual(og.a.prop, 'text');
	assert.strictEqual(errorsInListener, 0);
});

suite.test('test revokation of replaced objects - splice in array', () => {
	const og = Observable.from([
		{
			child: {
				prop: 'text'
			},
			prop: 'text'
		}
	]);
	let eventsCollector = [];
	let errorsInListener = 0;

	Observable.observe(og, changes => {
		try {
			eventsCollector = eventsCollector.concat(changes);
			assert.equal(changes.length, 1);
			assert.deepStrictEqual(changes[0], { type: 'update', path: [0], value: { prop: 'text' }, oldValue: { child: { prop: 'text' }, prop: 'text' }, object: og });
		} catch (e) {
			errorsInListener++;
			throw e;
		}
	});

	og.splice(0, 1, og[0].child);
	assert.strictEqual(og[0].prop, 'text');
	assert.strictEqual(errorsInListener, 0);
});