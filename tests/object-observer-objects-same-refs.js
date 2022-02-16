import { getSuite } from '../../node_modules/just-test/dist/just-test.js';
import { Observable } from '../../src/object-observer.js';

const suite = getSuite({ name: 'Testing Observable - objects with same reference' });

suite.runTest({ name: 'subgraph objects pointing to the same object few times', skip: true }, test => {
	const childObj = { prop: 'A' };
	const obsMainObj = Observable.from({ childA: childObj, childB: childObj });

	Observable.observe(obsMainObj, changes => console.dir(changes));

	obsMainObj.childA.prop = 'B';

	test.assertEqual(obsMainObj.childA.prop, obsMainObj.childB.prop);
});