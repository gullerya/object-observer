import { assert } from 'chai';
import { getSuite } from 'just-test/suite';
import { Observable } from '../src/object-observer.js';

const suite = getSuite('Testing host object (native)');

suite.test('test DOMStringMap', () => {
	const
		e = document.createElement('div'),
		oo = Observable.from(e.dataset),
		events = [],
		observer = changes => {
			events.push.apply(events, changes);
		};

	Observable.observe(oo, observer);
	oo.some = 'thing';
	assert.equal(events.length, 1);
});