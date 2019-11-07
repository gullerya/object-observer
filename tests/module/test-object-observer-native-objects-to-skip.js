import { createSuite } from '../../node_modules/just-test/dist/just-test.min.js';
import { Observable } from '../../dist/object-observer.js';

const suite = createSuite({ name: 'Testing Observable - non-observables' });

suite.runTest({ name: 'creating observable from non-observable should throw an error' }, () => {
	let objectsToTest = [
		new Date(),
		new Blob(),
		new Number(),
		new String(),
		new Boolean(),
		new Error(),
		new Function(),
		new RegExp(),
		new Promise(function () {
		})],
		o;

	objectsToTest.forEach(function (one) {
		try {
			o = Observable.from(one);
			throw new Error('should not get to this point');
		} catch (e) {
			//	do nothing here
		}
	});
});

suite.runTest({ name: 'non-observable in an object subgraph should stay unchanged' }, () => {
	let o = {
		data: new Date(),
		blob: new Blob(),
		number: new Number(),
		string: new String(),
		boolean: new Boolean(),
		error: new Error(),
		func: new Function(),
		regexp: new RegExp(),
		promise: new Promise(function () {
		}),
		object: {}
	}, po;

	po = Observable.from(o);
	Object.keys(o).forEach(function (key) {
		if (key === 'object') {
			if (o[key] === po[key]) throw new Error('proxification on regular object throw new Errored - test is malfunctioning');
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
		new Number(),
		new String(),
		new Boolean(),
		new Error(),
		new Function(),
		new RegExp(),
		new Promise(function () {
		})],
		o;

	o = Observable.from(a);
	a.forEach(function (elem, index) {
		if (index === 0) {
			if (a[index] === o[index]) throw new Error('proxification on regular object throw new Errored - test is malfunctioning');
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

suite.runTest({ name: 'non-observable should be handled correctly when deleted' }, () => {
	let o = {
		date: new Date()
	}, oo = Observable.from(o);

	oo.observe(function () {
	});
	delete oo.date;
});
