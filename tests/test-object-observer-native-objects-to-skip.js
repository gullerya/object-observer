import { getSuite } from '../../node_modules/just-test/dist/just-test.js';
import { Observable } from '../../dist/object-observer.js';

const suite = getSuite({ name: 'Testing Observable - non-observables' });

suite.runTest({ name: 'creating observable from non-observable should throw an error' }, test => {
	let objectsToTest = [
		new Date(),
		new Blob(),
		new Error()
	];

	objectsToTest.forEach(function (one) {
		try {
			const o = Observable.from(one);
			throw new Error('should not get to this point');
		} catch (e) {
			//	do nothing here
		}
	});

	const o = Observable.from(objectsToTest);
	test.assertTrue(objectsToTest.every(one => o.some(oo => oo === one)));
});

suite.runTest({ name: 'non-observable in an object subgraph should stay unchanged' }, () => {
	let o = {
		data: new Date(),
		blob: new Blob(),
		error: new Error(),
		object: {}
	}, po;

	po = Observable.from(o);
	Object.keys(o).forEach(function (key) {
		if (key === 'object') {
			if (o[key] === po[key]) throw new Error('proxification on regular object throw new Error - test is malfunctioning');
		} else {
			if (o[key] !== po[key]) throw new Error('expected non-observable key ' + key + ' to remain the same in the Observable');
		}
	});
});

suite.runTest({ name: 'non-observable in an array subgraph should stay unchanged' }, () => {
	let a = [
		{},
		new Date(),
		new Blob(),
		new Error()
	],
		o;

	o = Observable.from(a);
	a.forEach(function (elem, index) {
		if (index === 0) {
			if (a[index] === o[index]) throw new Error('proxification on regular object throw new Error - test is malfunctioning');
		} else {
			if (a[index] !== o[index]) throw new Error('expected non-observable index ' + index + ' to remain the same in the Observable');
		}
	});
});

suite.runTest({ name: 'non-observable should be handled correctly when nullified' }, () => {
	let o = {
		date: new Date()
	}, oo = Observable.from(o);

	oo.observe(function () {
	});
	oo.date = null;
});

suite.runTest({ name: 'non-observable should be handled correctly when replaced' }, test => {
	let o = {
		error: new Error('error message')
	}, oo = Observable.from(o);

	test.assertTrue(oo.error instanceof Error);
	test.assertTrue('name' in oo.error);
	test.assertTrue('message' in oo.error);
	test.assertTrue('stack' in oo.error);

	oo.error = new Error('new error message');

	test.assertTrue(oo.error instanceof Error);
	test.assertTrue('name' in oo.error);
	test.assertTrue('message' in oo.error);
	test.assertTrue('stack' in oo.error);
});

suite.runTest({ name: 'non-observable deviation should be handled correctly when replaced' }, test => {
	let o = {
		error: new SyntaxError('syntax error message')
	}, oo = Observable.from(o);

	test.assertEqual(oo.error, o.error);

	oo.error = new TypeError('type error message');

	test.assertTrue(oo.error instanceof TypeError);
	test.assertTrue('name' in oo.error);
	test.assertEqual(oo.error.message, 'type error message');
	test.assertTrue('stack' in oo.error);
});

suite.runTest({ name: 'non-observable should be handled correctly when deleted' }, () => {
	let o = {
		date: new Date()
	}, oo = Observable.from(o);

	oo.observe(function () {
	});
	delete oo.date;
});
