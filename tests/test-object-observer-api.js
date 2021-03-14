import { getSuite } from '../../node_modules/just-test/dist/just-test.js';
import { ObjectObserver } from '../../src/object-observer.js';

const suite = getSuite({ name: 'Testing ObjectObserver APIs' });

suite.runTest({ name: 'ensure ObjectObserver constructable' }, test => {
	test.assertTrue(typeof ObjectObserver === 'function');
	test.assertTrue(String(ObjectObserver).includes('class'));
});

suite.runTest({ name: 'observe 1 object' }, test => {
	let calls = 0;
	const oo = new ObjectObserver(changes => {
		calls += changes.length;
	});
	const o = oo.observe({ a: 'a', b: 'b' });

	o.a = 'b';
	test.assertEqual(1, calls);
});

suite.runTest({ name: 'observe 3 objects' }, test => {
	const events = [];
	const oo = new ObjectObserver(changes => {
		events.push(...changes);
	});
	const o1 = oo.observe({ a: 'a' });
	const o2 = oo.observe({ b: 'b' });
	const o3 = oo.observe({ c: 'c' });

	o1.a = 'A';
	delete o2.b;
	o3.d = 'd';

	test.assertEqual(3, events.length);
	test.assertEqual('update', events[0].type);
	test.assertEqual(o1, events[0].object);
	test.assertEqual('delete', events[1].type);
	test.assertEqual(o2, events[1].object);
	test.assertEqual('insert', events[2].type);
	test.assertEqual(o3, events[2].object);
});

suite.runTest({ name: 'observe 3 objects then unobserve 1' }, test => {
});

suite.runTest({ name: 'observe 3 objects then disconnect' }, test => {
});

suite.runTest({ name: 'observe object that is already observable - should stay same' }, test => {
});

suite.runTest({ name: 'observe 3 objects then disconnect' }, test => {
});

//	TODO: observe with options