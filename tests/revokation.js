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

	Observable.observe(og, changes => {
		eventsCollector = eventsCollector.concat(changes);
		assert.equal(changes.length, 1);
		assert.deepStrictEqual(changes[0], {
			type: 'update',
			oldValue: { prop: 'text' },
			value: { prop: 'text' }
		});

		// if (changes.length !== 1 || changes[0].type !== 'update') throw new Error('expected to track one update change');
		// if (changes[0].oldValue.prop !== 'text') throw new Error('expected the old value to still be readable');
		// if (changes[0].value.prop !== 'text') throw new Error('expected the new value to be readable');
	});

	og.a = og.a.b;
	assert.equal(og.a.prop, 'text');
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

	Observable.observe(og, changes => {
		eventsCollector = eventsCollector.concat(changes);
		assert.equal(changes.length, 1);
		assert.deepStrictEqual(changes[0], {
			type: 'update',
			oldValue: { prop: 'text' },
			value: { prop: 'text' }
		});

		// if (changes.length !== 1 || changes[0].type !== 'update') throw new Error('expected to track one update change');
		// if (changes[0].oldValue.prop !== 'text') throw new Error('expected the old value to still be readable');
		// if (changes[0].value.prop !== 'text') throw new Error('expected the new value to be readable');
	});

	og.splice(0, 1, og[0].child);
	assert.equal(og[0].prop, 'text');
});