import { getSuite } from '../../node_modules/just-test/dist/just-test.min.js';
import { Observable } from '../../dist/object-observer.js';

const suite = getSuite({ name: 'Testing Observable - objects with same reference' });

suite.runTest({ name: 'subgraph objects pointing to the same object few times' }, test => {
	let childObj = { prop: 'A' },
		mainObj = { childA: childObj, childB: childObj };

	let obsMainObj = Observable.from(mainObj);
	obsMainObj.observe(changes => console.dir(changes));

	obsMainObj.childA.prop = 'B';

	if (obsMainObj.childA.prop !== obsMainObj.childB.prop) test.fail('expected shared object to be updated symmetrically, but found: ' + obsMainObj.childA.prop + ' - ' + obsMainObj.childB.prop);
});