import { getSuite } from '../../node_modules/just-test/dist/just-test.min.js';
import { Observable } from '../../dist/object-observer.js';

const suite = getSuite({ name: 'Test observing specific path/s' });

suite.runTest({ name: 'baseline - negative' }, test => {
	let o = { inner: { prop: 'more' } },
		oo = Observable.from(o);

	//  wrong 'path' option
	try {
		oo.observe(() => { }, { path: 4 });
		test.fail('invalid "path" option passed through');
	} catch (e) {
	}

	//  empty 'path' option
	try {
		oo.observe(() => { }, { path: '' });
		test.fail('invalid "path" option passed through');
	} catch (e) {
	}

	//  wrong 'pathsFrom' option
	try {
		oo.observe(() => { }, { pathsFrom: 4 });
		test.fail('invalid "pathsFrom" option passed through');
	} catch (e) {
	}

	//  empty 'pathsFrom' option
	try {
		oo.observe(() => { }, { pathsFrom: '' });
		test.fail('invalid "pathsFrom" option passed through');
	} catch (e) {
	}

	//  no 'pathsFrom' allowed when 'path' is present
	try {
		oo.observe(() => { }, { path: 'some', pathsFrom: 'else' });
		test.fail('"path" and "pathsFrom" options passed through');
	} catch (e) {
	}

	//  no 'foreign' options allowed (pay attention, using an invalid 'pathFrom', not a valid 'pathsFrom')
	try {
		oo.observe(() => { }, { pathFrom: 'something' });
		test.fail('foreign option passed through');
	} catch (e) {
	}
});

suite.runTest({ name: 'baseline - no options / empty options' }, () => {
	let o = { inner: { prop: 'more' } },
		oo = Observable.from(o),
		counter,
		observer = changes => (counter += changes.length);

	//  null is valid
	counter = 0;
	oo.observe(observer, null);
	oo.inner.prop = 'else';
	if (counter !== 1) throw new Error('expected 1 callback, found ' + counter);
	oo.unobserve(observer);

	// empty object (or without relevant options) is valid
	counter = 0;
	oo.observe(observer, {});
	oo.inner.prop = 'even';
	if (counter !== 1) throw new Error('expected 1 callback, found ' + counter);
	oo.unobserve(observer);
});

suite.runTest({ name: 'observe specific path' }, () => {
	let o = { inner: { prop: 'more' } },
		oo = Observable.from(o),
		callbackCalls = 0,
		changesCounter = 0;

	oo.observe(changes => {
		callbackCalls++;
		changesCounter += changes.length;
	}, { path: 'inner' });
	oo.newProp = 'non-relevant';
	oo.inner.other = 'non-relevant';
	oo.inner = {};
	if (changesCounter !== 1) throw new Error('expected to have 1 change, found ' + changesCounter);
	if (callbackCalls !== 1) throw new Error('expected to have 1 callback, found ' + callbackCalls);
});

suite.runTest({ name: 'observe paths from .. and deeper' }, test => {
	let o = { inner: { prop: 'more', nested: { text: 'text' } } },
		oo = Observable.from(o),
		counter = 0;
	oo.observe(changes => counter += changes.length, { pathsFrom: 'inner.prop' });
	oo.nonRelevant = 'non-relevant';
	oo.inner.also = 'non-relevant';
	oo.inner.prop = 'relevant';
	oo.inner.prop = {};
	oo.inner.prop.deepRelevant = 'again';
	test.assertEqual(3, counter);
});

suite.runTest({ name: 'observe paths of - inner case' }, test => {
	let oo = Observable.from({ inner: { prop: 'more', nested: { text: 'text' } } }),
		counter = 0;
	oo.observe(changes => counter += changes.length, { pathsOf: 'inner.nested' });
	oo.nonRelevant = 'non-relevant';
	oo.inner.also = 'non-relevant';
	oo.inner.nested.text = 'relevant';
	oo.inner.nested.else = 'also relevant';
	oo.inner.nested = { nesnes: { test: 'non-relevant' } };
	oo.inner.nested.nesnes.test = 'non-relevant';
	test.assertEqual(2, counter);
});

suite.runTest({ name: 'observe paths of - root case' }, test => {
	let oo = Observable.from({ inner: { prop: 'more', nested: { text: 'text' } } }),
		counter = 0;
	oo.observe(changes => counter += changes.length, { pathsOf: '' });
	oo.relevant = 'relevant';
	oo.inner.also = 'non-relevant';
	oo.inner = { newObj: { test: 'relevant' } };
	oo.inner.newObj.test = 'non-relevant';
	test.assertEqual(2, counter);
});

suite.runTest({ name: 'observe paths of - negative a' }, test => {
	let oo = Observable.from({ inner: { prop: 'more', nested: { text: 'text' } } }),
		counter = 0,
		consoleErrors = [];
	const origConsoleError = console.error;
	console.error = e => consoleErrors.push(e);
	oo.observe(changes => counter += changes.length, { pathsOf: 4 });
	oo.inner.prop = 'else';
	test.assertEqual(1, counter);
	test.assertEqual('"pathsOf" option, if/when provided, MUST be a non-empty string', consoleErrors[0]);
});

suite.runTest({ name: 'observe paths of - negative b' }, test => {
	let oo = Observable.from({ inner: { prop: 'more', nested: { text: 'text' } } }),
		counter = 0,
		consoleErrors = [];
	const origConsoleError = console.error;
	console.error = e => consoleErrors.push(e);
	oo.observe(changes => counter += changes.length, { path: 'inner.prop', pathsOf: 'some.thing' });
	oo.inner.prop = 'else';
	test.assertEqual(1, counter);
	test.assertEqual('"pathsOf" option MAY NOT be specified together with "path" option', consoleErrors[0]);
});