import { Observable } from '../../dist/object-observer.js';

let suite = Utils.JustTest.createSuite({ name: 'Test observing specific path/s' });

suite.addTest({ name: 'baseline - negative' }, (pass, fail) => {
	let o = { inner: { prop: 'more' } },
		oo = Observable.from(o),
		events,
		observer = changes => events.push.apply(events, changes);

	//  wrong 'path' option
	try {
		oo.observe(observer, { path: 4 });
		fail('should not get to this point');
	} catch (e) {
	}

	//  empty 'path' option
	try {
		oo.observe(observer, { path: '' });
		fail('should not get to this point');
	} catch (e) {
	}

	//  wrong 'pathsFrom' option
	try {
		oo.observe(observer, { pathsFrom: 4 });
		fail('should not get to this point');
	} catch (e) {
	}

	//  empty 'pathsFrom' option
	try {
		oo.observe(observer, { pathsFrom: '' });
		fail('should not get to this point');
	} catch (e) {
	}

	//  no 'pathsFrom' allowed when 'path' is present
	try {
		oo.observe(observer, { path: 'some', pathsFrom: 'else' });
		fail('should not get to this point');
	} catch (e) {
	}

	//  no 'foreign' options allowed (pay attention, using an invalid 'pathFrom', not a valid 'pathsFrom')
	try {
		oo.observe(observer, { pathFrom: 'something' });
		fail('should not get to this point');
	} catch (e) {
	}

	pass();
});

suite.addTest({ name: 'baseline - no options / empty options' }, (pass, fail) => {
	let o = { inner: { prop: 'more' } },
		oo = Observable.from(o),
		counter,
		observer = changes => (counter += changes.length);

	//  null is valid
	counter = 0;
	oo.observe(observer, null);
	oo.inner.prop = 'else';
	if (counter !== 1) fail('expected 1 callback, found ' + counter);
	oo.unobserve(observer);

	// empty object (or without relevant options) is valid
	counter = 0;
	oo.observe(observer, {});
	oo.inner.prop = 'even';
	if (counter !== 1) fail('expected 1 callback, found ' + counter);
	oo.unobserve(observer);

	pass();
});

suite.addTest({ name: 'observe specific path' }, (pass, fail) => {
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
	if (changesCounter !== 1) fail('expected to have 1 change, found ' + changesCounter);
	if (callbackCalls !== 1) fail('expected to have 1 callback, found ' + callbackCalls);

	pass();
});

suite.addTest({ name: 'observe paths from .. and deeper' }, (pass, fail) => {
	let o = { inner: { prop: 'more', nested: { text: 'text' } } },
		oo = Observable.from(o),
		counter = 0;
	oo.observe(changes => (counter += changes.length), { pathsFrom: 'inner.prop' });
	oo.nonRelevant = 'non-relevant';
	oo.inner.also = 'non-relevant';
	oo.inner.prop = 'relevant';
	oo.inner.prop = {};
	oo.inner.prop.deepRelevant = 'again';
	if (counter !== 3) fail('expected to have 3 callbacks, found ' + counter);

	pass();
});

suite.run();