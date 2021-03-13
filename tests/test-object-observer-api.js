import { getSuite } from '../../node_modules/just-test/dist/just-test.js';
import { ObjectObserver } from '../../src/object-observer.js';

const suite = getSuite({ name: 'Testing ObjectObserver APIs' });

suite.runTest({ name: 'ensure ObjectObserver constructable' }, test => {
	test.assertTrue(typeof ObjectObserver === 'function');
	test.assertTrue(String(ObjectObserver).includes('class'));
});

suite.runTest({ name: 'create ObjectObserver and observe 1 object' }, test => {
	let calls = 0;
	const oo = new ObjectObserver(changes => {
		calls += changes.length;
	});
	const o = oo.observe({ a: 'a', b: 'b' });

	o.a = 'b';
	test.assertEqual(1, calls);
});
