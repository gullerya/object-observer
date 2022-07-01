import { assert } from 'chai';
import { getSuite } from 'just-test/suite';
import { Observable } from '../src/object-observer.js';

const suite = getSuite('Testing Observable - objects with same reference');

suite.test('subgraph objects pointing to the same object few times', { skip: true }, () => {
	const childObj = { prop: 'A' };
	const obsMainObj = Observable.from({ childA: childObj, childB: childObj });

	Observable.observe(obsMainObj, changes => console.dir(changes));

	obsMainObj.childA.prop = 'B';

	assert.strictEqual(obsMainObj.childA.prop, obsMainObj.childB.prop);
});