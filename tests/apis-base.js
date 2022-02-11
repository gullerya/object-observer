import { getSuite } from '../../node_modules/just-test/dist/just-test.js';
import { Observable } from '../../src/object-observer.js';

const suite = getSuite({ name: 'Testing Observable APIs' });

suite.runTest({ name: 'ensure Observable object has defined APIs' }, test => {
	test.assertEqual(typeof Observable, 'object');
	test.assertEqual(typeof Observable.from, 'function');
	test.assertEqual(typeof Observable.isObservable, 'function');
	test.assertEqual(typeof Observable.observe, 'function');
	test.assertEqual(typeof Observable.unobserve, 'function');
	test.assertEqual(4, Object.keys(Observable).length);
});

suite.runTest({ name: 'ensure Observable object is frozen' }, test => {
	const failErrorMessage = 'should not reach this point';
	try {
		Observable.some = 'prop';
		throw new Error(failErrorMessage);
	} catch (e) {
		test.assertNotEqual(failErrorMessage, e.message);
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

	const oo = Observable.from({ nested: {} });
	test.assertTrue(Observable.isObservable(oo));
});

suite.runTest({ name: 'test observable APIs presence on object/array' }, test => {
	const oo = Observable.from({});

	test.assertEqual('function', typeof oo.observe);
	test.assertEqual('function', typeof oo.unobserve);

	const aa = Observable.from([]);

	test.assertEqual('function', typeof aa.observe);
	test.assertEqual('function', typeof aa.unobserve);
});

suite.runTest({ name: 'test observable APIs - ensure APIs are not enumerables' }, test => {
	const oo = Observable.from({});

	test.assertEqual(0, Object.keys(oo).length);

	const aa = Observable.from([]);

	test.assertEqual(0, Object.keys(aa).length);
});

suite.runTest({
	name: 'negative - invalid options - not an object',
	expectError: 'Observable options if/when provided, MAY only be an object'
}, () => {
	Observable.from({}, 4);
});

suite.runTest({
	name: 'negative - invalid options - wrong param',
	expectError: 'is/are not a valid Observable option/s'
}, () => {
	Observable.from({}, { invalid: 'key' });
});