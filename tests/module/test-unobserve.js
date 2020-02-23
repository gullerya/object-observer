import { getSuite } from '../../node_modules/just-test/dist/just-test.min.js';
import { Observable } from '../../dist/object-observer.js';

const suite = getSuite({ name: 'Testing unobserving/removal of observed object' });

suite.runTest({ name: 'test unobserve - single observer - explicit unobserve' }, () => {
	let o = { some: 'text' },
		oo = Observable.from(o),
		cntr = 0,
		observer = function () {
			cntr++;
		};

	oo.observe(observer);

	oo.some = 'thing';
	if (cntr !== 1) throw new Error('preliminary check failed - observer was not invoked');

	cntr = 0;
	oo.unobserve(observer);
	oo.some = 'true';
	if (cntr > 0) throw new Error('unobserve failed, expected 0 callbacks, found ' + cntr);
});

suite.runTest({ name: 'test unobserve - few observers - explicit unobserve' }, () => {
	let o = { some: 'text' },
		oo = Observable.from(o),
		cntrA = 0,
		cntrB = 0,
		observerA = function () {
			cntrA++;
		},
		observerB = function () {
			cntrB++;
		};

	oo.observe(observerA);
	oo.observe(observerB);

	oo.some = 'thing';
	if (cntrA !== 1) throw new Error('preliminary check failed - observerA was not invoked');
	if (cntrB !== 1) throw new Error('preliminary check failed - observerB was not invoked');

	cntrA = 0;
	cntrB = 0;
	oo.unobserve(observerA);
	oo.some = 'true';
	if (cntrA > 0) throw new Error('unobserve failed, expected 0 callbacks for unobserved, found ' + cntr);
	if (cntrB !== 1) throw new Error('unobserve failed, expected 1 callback for the left alone after unobserve, found ' + cntr);

	cntrA = 0;
	cntrB = 0;
	oo.unobserve(observerB);
	oo.some = 'back';
	if (cntrA > 0) throw new Error('unobserve failed, expected 0 callbacks for unobserved, found ' + cntr);
	if (cntrB > 0) throw new Error('unobserve failed, expected 0 callbacks for unobserved, found ' + cntr);
});

suite.runTest({ name: 'test unobserve - unobserve few' }, () => {
	let o = { some: 'text' },
		oo = Observable.from(o),
		cntrA = 0,
		cntrB = 0,
		observerA = function () {
			cntrA++;
		},
		observerB = function () {
			cntrB++;
		};

	oo.observe(observerA);
	oo.observe(observerB);

	oo.some = 'thing';
	if (cntrA !== 1) throw new Error('preliminary check failed - observerA was not invoked');
	if (cntrB !== 1) throw new Error('preliminary check failed - observerB was not invoked');

	cntrA = 0;
	cntrB = 0;
	oo.unobserve(observerA, observerB);
	oo.some = 'true';
	if (cntrA > 0) throw new Error('unobserve failed, expected 0 callbacks for unobserved, found ' + cntr);
	if (cntrB > 0) throw new Error('unobserve failed, expected 0 callbacks for unobserved, found ' + cntr);
});

suite.runTest({ name: 'test unobserve - unobserve all' }, () => {
	let o = { some: 'text' },
		oo = Observable.from(o),
		cntrA = 0,
		cntrB = 0,
		observerA = function () {
			cntrA++;
		},
		observerB = function () {
			cntrB++;
		};

	oo.observe(observerA);
	oo.observe(observerB);

	oo.some = 'thing';
	if (cntrA !== 1) throw new Error('preliminary check failed - observerA was not invoked');
	if (cntrB !== 1) throw new Error('preliminary check failed - observerB was not invoked');

	cntrA = 0;
	cntrB = 0;
	oo.unobserve();
	oo.some = 'true';
	if (cntrA > 0) throw new Error('unobserve failed, expected 0 callbacks for unobserved, found ' + cntr);
	if (cntrB > 0) throw new Error('unobserve failed, expected 0 callbacks for unobserved, found ' + cntr);
});

suite.runTest({ name: 'test unobserve - observe, unobserve and observe again' }, () => {
	let o = { some: 'text' },
		oo = Observable.from(o),
		cntr = 0,
		observer = function () {
			cntr++;
		};

	oo.observe(observer);
	oo.some = 'thing';
	if (cntr !== 1) throw new Error('preliminary check failed - observer was not invoked');

	oo.unobserve();
	oo.some = 'true';
	if (cntr !== 1) throw new Error('unobserve failed, expected callbacks for unobserved to remain 1, found ' + cntr);

	oo.observe(observer);
	oo.some = 'again';
	if (cntr !== 2) throw new Error('preliminary check failed - observer was not invoked being added anew');
});

suite.runTest({ name: 'test unobserve - revoke the observable (Object)' }, () => {
	let o = { some: 'text', inner: { more: 'text' } },
		oo = Observable.from(o),
		ooi = oo.inner,
		cntr = 0,
		observer = function () {
			cntr++;
		};

	oo.observe(observer);
	oo.some = 'thing';
	ooi.more = 'stuff';
	if (cntr !== 2) throw new Error('preliminary check failed - observer was invoked ' + cntr + ' times; expected - 2');

	oo.revoke();
	try {
		oo.some = 'true';
		throw new Error(' execution should not get here');
	} catch (e) {
		if (!(e instanceof TypeError)) throw new Error('expected to catch TypeError');
	}
	try {
		ooi.more = 'test';
		throw new Error(' execution should not get here');
	} catch (e) {
		if (!(e instanceof TypeError)) throw new Error('expected to catch TypeError');
	}
});

suite.runTest({ name: 'test unobserve - revoke the observable (Array)' }, () => {
	let o = [{ some: 'text' }, { inner: { more: 'text', arr: ['a', 'b', 'c'] } }],
		oo = Observable.from(o),
		ooi = oo[1],
		ooia = ooi.inner.arr,
		cntr = 0,
		observer = function () {
			cntr++;
		};

	oo.observe(observer);
	oo.push({});
	oo[0].some = 'thing';
	ooi.adding = 'new';
	ooi.inner.more = 'stuff';
	ooia.pop();
	if (cntr !== 5) throw new Error('preliminary check failed - observer was invoked ' + cntr + ' times; expected - 5');

	oo.revoke();

	try {
		oo.pop();
		throw new Error(' execution should not get here (A)');
	} catch (e) {
		if (!(e instanceof TypeError)) throw new Error('expected to catch TypeError');
	}
	try {
		oo[0].some = 'test';
		throw new Error(' execution should not get here (B)');
	} catch (e) {
		if (!(e instanceof TypeError)) throw new Error('expected to catch TypeError');
	}
	try {
		ooi.more = 'true';
		if (cntr > 5) throw new Error('expected to not have any new callbacks');
		ooi.inner.more = 'again';
		throw new Error(' execution should not get here (C)');
	} catch (e) {
		if (!(e instanceof TypeError)) throw new Error('expected to catch TypeError');
	}
	try {
		ooia.push('d');
		throw new Error(' execution should not get here (D)');
	} catch (e) {
		if (!(e instanceof TypeError)) throw new Error('expected to catch TypeError');
	}
});