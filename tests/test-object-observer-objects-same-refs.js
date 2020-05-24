﻿import { getSuite } from '../../node_modules/just-test/dist/just-test.min.js';
import { Observable } from '../../dist/object-observer.js';

const suite = getSuite({ name: 'Testing Observable - objects with same reference' });

suite.runTest({ name: 'subgraph objects pointing to the same object few times', skip: true }, test => {
	let childObj = { prop: 'A' },
		mainObj = { childA: childObj, childB: childObj };

	let obsMainObj = Observable.from(mainObj);
	obsMainObj.observe(changes => console.dir(changes));

	obsMainObj.childA.prop = 'B';

	test.assertEqual(obsMainObj.childA.prop, obsMainObj.childB.prop);
});