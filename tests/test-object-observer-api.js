import { getSuite } from '../../node_modules/just-test/dist/just-test.js';
import { ObjectObserver, Observable } from '../../src/object-observer.js';

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

suite.runTest({ name: 'observe returns new Observable' }, test => {
	const oo = new ObjectObserver(() => { });
	const o = {};
	const o1 = oo.observe(o);
	test.assertNotEqual(o, o1);
	test.assertTrue(Observable.isObservable(o1));
});

suite.runTest({ name: 'observe returns same Observable if supplied with Observable' }, test => {
	const oo = new ObjectObserver(() => { });
	const o1 = Observable.from({});
	const o2 = oo.observe(o1);
	test.assertEqual(o1, o2);
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
	const events = [];
	const oo = new ObjectObserver(changes => {
		events.push(...changes);
	});
	const o1 = oo.observe({ a: 'a' });
	const o2 = oo.observe({ b: 'b' });
	const o3 = oo.observe({ c: 'c' });

	o1.a = 'A';

	test.assertEqual(1, events.length);
	test.assertEqual('update', events[0].type);
	test.assertEqual(o1, events[0].object);

	oo.unobserve(o1);

	o1.a = '123';
	delete o2.b;
	o3.d = 'd';

	test.assertEqual(3, events.length);
	test.assertEqual('delete', events[1].type);
	test.assertEqual(o2, events[1].object);
	test.assertEqual('insert', events[2].type);
	test.assertEqual(o3, events[2].object);
});

suite.runTest({ name: 'observe 3 objects > disconnect > observe' }, test => {
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

	events.splice(0);
	oo.disconnect();

	o1.a = '123';
	delete o2.b;
	o3.d = 'd';
	test.assertEqual(0, events.length);

	oo.observe(o1);
	oo.observe(o2);

	o1.a = '1234';
	o2.b = 'something';
	test.assertEqual(2, events.length);
});

//	TODO: observe with options