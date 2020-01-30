import { createSuite } from '../../node_modules/just-test/dist/just-test.min.js';
import { Observable } from '../../dist/object-observer.js';

const suite = createSuite({ name: 'Testing Observable APIs' });

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

	bo = {
		observe: null
	};
	safeToContinue = false;
	try {
		Observable.from(bo);
	} catch (e) {
		safeToContinue = true;
	}
	test.assertTrue(safeToContinue);

	bo = {
		unobserve: null
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
	test.assertFalse(Observable.isObservable(oo.nested));
});

suite.runTest({ name: 'test observable APIs presence on object/array' }, test => {
	let o = {}, a = [], oo, aa;

	oo = Observable.from(o);

	test.assertEqual(typeof oo.revoke, 'function');
	test.assertEqual(typeof oo.observe, 'function');
	test.assertEqual(typeof oo.unobserve, 'function');

	aa = Observable.from(a);

	test.assertEqual(typeof aa.revoke, 'function');
	test.assertEqual(typeof aa.observe, 'function');
	test.assertEqual(typeof aa.unobserve, 'function');
});

suite.runTest({ name: 'test observable APIs - ensure APIs are not enumerables' }, test => {
	let o = {}, a = [], oo, aa;

	oo = Observable.from(o);

	test.assertEqual(Object.keys(oo).length, 0);

	aa = Observable.from(a);

	test.assertEqual(Object.keys(aa).length, 0);
});

suite.runTest({ name: 'test observable APIs - nested objects/arrays have no observable APIs' }, test => {
	let o = { n: {} }, a = [[]], oo, aa;

	oo = Observable.from(o);

	test.assertFalse(
		typeof oo.n.revoke === 'function' || typeof oo.n.observe === 'function' || typeof oo.n.unobserve === 'function'
	);

	aa = Observable.from(a);

	test.assertFalse(
		typeof aa[0].revoke === 'function' || typeof aa[0].observe === 'function' || typeof aa[0].unobserve === 'function'
	);
});

suite.runTest({ name: 'test observable APIs - Observable can not be used via constructor' }, test => {
	try {
		let o = new Observable();
		test.assertTrue(false);
	} catch (e) {
	}
});