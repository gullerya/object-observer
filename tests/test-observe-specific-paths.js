import { getSuite } from '../../node_modules/just-test/dist/just-test.js';
import { Observable } from '../../dist/object-observer.js';

const suite = getSuite({ name: 'Test observing specific path/s' });

suite.runTest({
	name: 'baseline - negative - path not a string',
	expectError: '"path" option, if/when provided, MUST be a non-empty string'
}, () => {
	const oo = Observable.from({ inner: { prop: 'more' } });
	oo.observe(() => { }, { path: 4 });
});

suite.runTest({
	name: 'baseline - negative - path empty',
	expectError: '"path" option, if/when provided, MUST be a non-empty string'
}, () => {
	const oo = Observable.from({ inner: { prop: 'more' } });
	oo.observe(() => { }, { path: '' });
});

suite.runTest({
	name: 'baseline - negative - pathsFrom not a string',
	expectError: '"pathsFrom" option, if/when provided, MUST be a non-empty string'
}, () => {
	const oo = Observable.from({ inner: { prop: 'more' } });
	oo.observe(() => { }, { pathsFrom: 4 });
});

suite.runTest({
	name: 'baseline - negative - pathsFrom empty',
	expectError: '"pathsFrom" option, if/when provided, MUST be a non-empty string'
}, () => {
	const oo = Observable.from({ inner: { prop: 'more' } });
	oo.observe(() => { }, { pathsFrom: '' });
});

suite.runTest({
	name: 'baseline - negative - no pathsFrom when path present',
	expectError: '"pathsFrom" option MAY NOT be specified together with'
}, () => {
	const oo = Observable.from({ inner: { prop: 'more' } });
	oo.observe(() => { }, { path: 'some', pathsFrom: 'else' });
});

suite.runTest({
	name: 'baseline - negative - no foreign options (pathFrom)',
	expectError: 'is/are not a valid option/s'
}, () => {
	const oo = Observable.from({ inner: { prop: 'more' } });
	oo.observe(() => { }, { pathFrom: 'something' });
});

suite.runTest({ name: 'baseline - no options / empty options' }, () => {
	const
		oo = Observable.from({ inner: { prop: 'more' } }),
		observer = changes => (counter += changes.length);
	let counter = 0;

	//  null is valid
	oo.observe(observer, null);
	oo.inner.prop = 'else';
	if (counter !== 1) throw new Error('expected 1 callback, found ' + counter);
	oo.unobserve(observer);
});

suite.runTest({ name: 'baseline - empty options is valid' }, () => {
	const
		oo = Observable.from({ inner: { prop: 'more' } }),
		observer = changes => (counter += changes.length);
	let counter = 0;
	oo.observe(observer, {});
	oo.inner.prop = 'even';
	if (counter !== 1) throw new Error('expected 1 callback, found ' + counter);
	oo.unobserve(observer);
});

suite.runTest({ name: 'observe specific path' }, () => {
	const oo = Observable.from({ inner: { prop: 'more' } });
	let callbackCalls = 0,
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
	const oo = Observable.from({ inner: { prop: 'more', nested: { text: 'text' } } });
	let counter = 0;

	oo.observe(changes => { counter += changes.length; }, { pathsFrom: 'inner.prop' });
	oo.nonRelevant = 'non-relevant';
	oo.inner.also = 'non-relevant';
	oo.inner.prop = 'relevant';
	oo.inner.prop = {};
	oo.inner.prop.deepRelevant = 'again';
	test.assertEqual(3, counter);
});

suite.runTest({ name: 'observe paths of - inner case' }, test => {
	const oo = Observable.from({ inner: { prop: 'more', nested: { text: 'text' } } });
	let counter = 0;
	oo.observe(changes => { counter += changes.length; }, { pathsOf: 'inner.nested' });
	oo.nonRelevant = 'non-relevant';
	oo.inner.also = 'non-relevant';
	oo.inner.nested.text = 'relevant';
	oo.inner.nested.else = 'also relevant';
	oo.inner.nested = { nesnes: { test: 'non-relevant' } };
	oo.inner.nested.nesnes.test = 'non-relevant';
	test.assertEqual(2, counter);
});

suite.runTest({ name: 'observe paths of - root case' }, test => {
	const oo = Observable.from({ inner: { prop: 'more', nested: { text: 'text' } } });
	let counter = 0;
	oo.observe(changes => { counter += changes.length; }, { pathsOf: '' });
	oo.relevant = 'relevant';
	oo.inner.also = 'non-relevant';
	oo.inner = { newObj: { test: 'relevant' } };
	oo.inner.newObj.test = 'non-relevant';
	test.assertEqual(2, counter);
});

suite.runTest({
	name: 'observe paths of - negative a',
	expectError: '"pathsOf" option, if/when provided, MUST be a string (MAY be empty)'
}, test => {
	const
		oo = Observable.from({ inner: { prop: 'more', nested: { text: 'text' } } }),
		consoleErrors = [];
	let counter = 0;
	const origConsoleError = console.error;
	console.error = e => consoleErrors.push(e);
	oo.observe(changes => { counter += changes.length; }, { pathsOf: 4 });
	oo.inner.prop = 'else';
	test.assertEqual(1, counter);
	test.assertEqual('"pathsOf" option, if/when provided, MUST be a non-empty string', consoleErrors[0]);
	console.error = origConsoleError;
});

suite.runTest({
	name: 'observe paths of - negative b',
	expectError: '"pathsOf" option MAY NOT be specified together with "path" option'
}, test => {
	const oo = Observable.from({ inner: { prop: 'more', nested: { text: 'text' } } }),
		consoleErrors = [];
	let counter = 0;
	const origConsoleError = console.error;
	console.error = e => consoleErrors.push(e);
	oo.observe(changes => { counter += changes.length; }, { path: 'inner.prop', pathsOf: 'some.thing' });
	oo.inner.prop = 'else';
	test.assertEqual(1, counter);
	test.assertEqual('"pathsOf" option MAY NOT be specified together with "path" option', consoleErrors[0]);
	console.error = origConsoleError;
});