import { test } from '@gullerya/just-test';
import { assert } from '@gullerya/just-test/assert';
import { Observable } from '../src/object-observer.js';

test('test DOMStringMap', () => {
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