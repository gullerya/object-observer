import { assert } from 'chai';
import { getSuite } from 'just-test/suite';
import { Observable } from '../src/object-observer.js';

const suite = getSuite('Testing Observable - circular objects');

suite.test('subgraph object pointing to the top parent', () => {
	const o = { prop: 'text' };
	o.child = o;
	const oo = Observable.from(o);
	const changes = [];
	Observable.observe(oo, cs => {
		changes.push(...cs);
	});
	oo.prop = 'else';

	assert.isNull(oo.child);
	assert.equal(changes.length, 1);
	assert.deepEqual(changes[0], {
		type: 'update',
		path: ['prop'],
		value: 'else',
		oldValue: 'text',
		object: oo
	});
});

suite.test('subgraph object pointing to parent in the graph', () => {
	const o = { gen1: { gen2: { prop: 'text' } } };
	o.gen1.gen2.child = o.gen1;
	const oo = Observable.from(o);
	const changes = [];
	Observable.observe(oo, cs => {
		changes.push(...cs);
	});
	oo.gen1.gen2.prop = 'else';

	assert.isNull(oo.gen1.gen2.child);
	assert.equal(changes.length, 1);
	assert.deepEqual(changes[0], {
		type: 'update',
		path: ['gen1', 'gen2', 'prop'],
		value: 'else',
		oldValue: 'text',
		object: oo.gen1.gen2
	});
});

suite.test('circular object assigned to an existing observable graph (object)', () => {
	const o = { gen1: { gen2: { prop: 'text' } } };
	o.gen1.gen2.child = o.gen1;

	const oo = Observable.from({});
	oo.newbie = o;

	const changes = [];
	Observable.observe(oo, cs => {
		changes.push(...cs);
	});
	oo.newbie.gen1.gen2.prop = 'else';

	assert.isNull(oo.newbie.gen1.gen2.child);
	assert.equal(changes.length, 1);
	assert.deepEqual(changes[0], {
		type: 'update',
		path: ['newbie', 'gen1', 'gen2', 'prop'],
		value: 'else',
		oldValue: 'text',
		object: oo.newbie.gen1.gen2
	});
});
