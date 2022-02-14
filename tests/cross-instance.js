import { getSuite } from '../../node_modules/just-test/dist/just-test.js';
import { Observable as O1, ObjectObserver as OO1 } from '../../src/object-observer.js?1';
import { Observable as O2, ObjectObserver as OO2 } from '../../src/object-observer.js?2';

const suite = getSuite({ name: 'Testing cross instance workability' });

suite.runTest({ name: 'Observable.isObservable interoperable' }, test => {
	test.assertNotEqual(O1, O2);
	const obsbl1 = O1.from({});
	test.assertTrue(O1.isObservable(obsbl1));
	test.assertTrue(O2.isObservable(obsbl1));
	const obsbl2 = O2.from({});
	test.assertTrue(O2.isObservable(obsbl2));
	test.assertTrue(O1.isObservable(obsbl2));
});

suite.runTest({ name: 'Observable.from interoperable' }, test => {
	const obsbl1 = O1.from({});
	const obsbl2 = O2.from(obsbl1);
	test.assertEqual(obsbl1, obsbl2);

	const obsbl3 = O2.from({});
	const obsbl4 = O1.from(obsbl3);
	test.assertEqual(obsbl3, obsbl4);
});

suite.runTest({ name: 'callbacks are interoperable' }, test => {
	const obsbl1 = O1.from({});
	const obsbl2 = O2.from(obsbl1);
	test.assertEqual(obsbl1, obsbl2);

	let count = 0;
	O1.observe(obsbl1, es => count += es.length);
	O2.observe(obsbl2, es => count += es.length);

	obsbl1.some = 'thing';
	obsbl2.some = 'else';

	test.assertEqual(4, count);
});

suite.runTest({ name: 'ObjectObserver interoperable' }, test => {
	test.assertNotEqual(OO1, OO2);
	let count = 0;
	const oo1 = new OO1(es => count += es.length);
	const oo2 = new OO2(es => count += es.length);

	const o1 = oo1.observe({});
	const o2 = oo2.observe(o1);
	test.assertEqual(o1, o2);

	o1.some = 'thing';
	o2.some = 'else';

	test.assertEqual(4, count);
});