import { getSuite } from '../../node_modules/just-test/dist/just-test.min.js';
import { Observable } from '../../dist/object-observer.js';

const suite = getSuite({ name: 'Test observing specific path/s' });

suite.runTest({ name: 'baseline - negative' }, () => {
	let o = { inner: { prop: 'more' } },
		oo = Observable.from(o);

	//  wrong 'path' option
	try {
		oo.observe(() => { }, { path: 4 });
	} catch (e) {
	}

	//  empty 'path' option
	try {
		oo.observe(() => { }, { path: '' });
	} catch (e) {
	}

	//  wrong 'pathsFrom' option
	try {
		oo.observe(() => { }, { pathsFrom: 4 });
	} catch (e) {
	}

	//  empty 'pathsFrom' option
	try {
		oo.observe(() => { }, { pathsFrom: '' });
	} catch (e) {
	}

	//  no 'pathsFrom' allowed when 'path' is present
	try {
		oo.observe(() => { }, { path: 'some', pathsFrom: 'else' });
	} catch (e) {
	}

	//  no 'foreign' options allowed (pay attention, using an invalid 'pathFrom', not a valid 'pathsFrom')
	try {
		oo.observe(() => { }, { pathFrom: 'something' });
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

suite.runTest({ name: 'observe paths from .. and deeper' }, () => {
	let o = { inner: { prop: 'more', nested: { text: 'text' } } },
		oo = Observable.from(o),
		counter = 0;
	oo.observe(changes => (counter += changes.length), { pathsFrom: 'inner.prop' });
	oo.nonRelevant = 'non-relevant';
	oo.inner.also = 'non-relevant';
	oo.inner.prop = 'relevant';
	oo.inner.prop = {};
	oo.inner.prop.deepRelevant = 'again';
	if (counter !== 3) throw new Error('expected to have 3 callbacks, found ' + counter);
});