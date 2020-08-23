import { getSuite } from '../../node_modules/just-test/dist/just-test.js';
import { Observable } from '../../dist/object-observer.js';

const suite = getSuite({ name: 'Testing host object (native)' });

suite.runTest({ name: 'test DOMStringMap' }, test => {
	const
		e = document.createElement('div'),
		oo = Observable.from(e.dataset),
		events = [],
		observer = changes => {
			events.push.apply(events, changes);
		};

	oo.observe(observer);
	oo.some = 'thing';
	test.assertEqual(1, events.length);
});