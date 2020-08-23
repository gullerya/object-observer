import { getSuite } from '../../node_modules/just-test/dist/just-test.js';
import { Observable } from '../../dist/object-observer.js';

const suite = getSuite({ name: 'Testing Observable - subgraphs' });

suite.runTest({ name: 'inner object from observable should fire events as usual' }, () => {
	let o = { inner: { prop: 'more' } },
		oo = Observable.from(o),
		iop = oo.inner,
		events = [],
		observer = function (changes) {
			events.push.apply(events, changes);
		};

	oo.observe(observer);
	iop.prop = 'else';
	iop.new = 'prop';

	if (events.length !== 2) throw new Error('expected 2 callbacks on inner observer graph (subgraph), but found ' + events.length);
	if (events[0].type !== 'update' || events[0].path.join('.') !== 'inner.prop' || events[0].oldValue !== 'more' || events[0].value !== 'else' || events[0].object !== iop) throw new Error('event 0 did not fire as expected');
	if (events[1].type !== 'insert' || events[1].path.join('.') !== 'inner.new' || typeof events[1].oldValue !== 'undefined' || events[1].value !== 'prop' || events[1].object !== iop) throw new Error('event 1 did not fire as expected');
});

suite.runTest({ name: 'removal (detaching) of inner object from observable should detach its events' }, test => {
	let oo = Observable.from({ inner: { prop: 'more' } }),
		iop = oo.inner,
		cntr = 0,
		observer = function () {
			cntr++;
		};

	oo.observe(observer);
	iop.prop = 'text';
	test.assertEqual(1, cntr);

	oo.inner = null;
	cntr = 0;
	iop.prop = 'again';
	test.assertEqual(0, cntr);
});

suite.runTest({ name: 'replacement of inner object from observable should return non-proxified original object' }, () => {
	let o = { inner: { prop: 'more', nested: { text: 'text' } } },
		oo = Observable.from(o),
		events = [];
	oo.observe(changes => Array.prototype.push.apply(events, changes));

	oo.inner.prop = 'some';
	if (events.length !== 1 || events[0].type !== 'update' || events[0].path.length !== 2 || events[0].object !== oo.inner) {
		throw new Error('expected to have correct update event');
	}
	events = [];

	oo.inner = { p: 'back' };
	if (events.length !== 1 || events[0].type !== 'update' || events[0].path.length !== 1 || events[0].object !== oo) {
		throw new Error('expected to have correct update event - metadata');
	} else {
		if (!events[0].oldValue || events[0].oldValue.prop !== 'some') {
			throw new Error('expected to have correct update event - correct oldValue present');
		}
		if (events[0].oldValue.nested.text !== 'text') {
			throw new Error('expected to have correct update event - correct oldValue nested object present');
		}
	}
});

suite.runTest({ name: 'Object.assign on observable should raise an event/s of update with non-proxified original object' }, () => {
	let oldData = { b: { b1: "x", b2: "y" } },
		newData = { b: { b1: "z" } },
		observable = Observable.from(oldData),
		events = [];
	observable.observe(changes => events.push.apply(events, changes));

	Object.assign(observable, newData);

	if (events.length !== 1 || events[0].type !== 'update' || events[0].path.join('.') !== 'b' || events[0].object !== observable) {
		throw new Error('UPDATE event metadata NOT as expected');
	} else if (!events[0].value || events[0].value.b1 !== 'z') {
		throw new Error('UPDATE event (new) value NOT as expected');
	} else if (!events[0].oldValue || events[0].oldValue.b1 !== 'x' || events[0].oldValue.b2 !== 'y') {
		throw new Error('UPDATE event oldValue NOT as expected');
	}
});