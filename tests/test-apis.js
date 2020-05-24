import { getSuite } from '../../node_modules/just-test/dist/just-test.min.js';
import { Observable } from '../../dist/object-observer.js';

const suite = getSuite({ name: 'Testing Observable APIs' });

suite.runTest({ name: 'ensure Observable object is frozen with only defined API' }, test => {
	test.assertEqual(typeof Observable, 'function');
	test.assertEqual(typeof Observable.from, 'function');
	test.assertEqual(typeof Observable.isObservable, 'function');

	try {
		Observable.some = 'prop';
		test.assertFalse(Observable.some);
	} catch (e) {
	}
});

suite.runTest({ name: 'negative tests - invalid parameters' }, test => {
	let bo,
		safeToContinue = false;
	try {
		Observable.from(bo);
	} catch (e) {
		safeToContinue = true;
	}
	test.assertTrue(safeToContinue);

	bo = null;
	safeToContinue = false;
	try {
		Observable.from(bo);
	} catch (e) {
		safeToContinue = true;
	}
	test.assertTrue(safeToContinue);

	bo = true;
	safeToContinue = false;
	try {
		Observable.from(bo);
	} catch (e) {
		safeToContinue = true;
	}
	test.assertTrue(safeToContinue);

	bo = 1;
	safeToContinue = false;
	try {
		Observable.from(bo);
	} catch (e) {
		safeToContinue = true;
	}
	test.assertTrue(safeToContinue);

	bo = 'string';
	safeToContinue = false;
	try {
		Observable.from(bo);
	} catch (e) {
		safeToContinue = true;
	}
	test.assertTrue(safeToContinue);

	bo = function () {
	};
	safeToContinue = false;
	try {
		Observable.from(bo);
	} catch (e) {
		safeToContinue = true;
	}
	test.assertTrue(safeToContinue);
});

suite.runTest({ name: 'isObservable tests' }, test => {
	test.assertFalse(Observable.isObservable('some'));
	test.assertFalse(Observable.isObservable(null));
	test.assertFalse(Observable.isObservable({}));
	test.assertTrue(Observable.isObservable(Observable.from({})));

	let oo = Observable.from({ nested: {} });
	test.assertTrue(Observable.isObservable(oo));
});

suite.runTest({ name: 'test observable APIs presence on object/array' }, test => {
	let o = {}, a = [], oo, aa;

	oo = Observable.from(o);

	test.assertEqual('function', typeof oo.observe);
	test.assertEqual('function', typeof oo.unobserve);

	aa = Observable.from(a);

	test.assertEqual('function', typeof aa.observe);
	test.assertEqual('function', typeof aa.unobserve);
});

suite.runTest({ name: 'test observable APIs - ensure APIs are not enumerables' }, test => {
	let o = {}, a = [], oo, aa;

	oo = Observable.from(o);

	test.assertEqual(0, Object.keys(oo).length);

	aa = Observable.from(a);

	test.assertEqual(0, Object.keys(aa).length);
});

suite.runTest({ name: 'test observable APIs - Observable can not be used via constructor', expectError: 'Observable MAY NOT be created via constructor' }, () => {
	new Observable();
});