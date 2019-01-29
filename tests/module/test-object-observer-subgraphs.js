import {Observable} from '../../dist/object-observer.js';

let suite = Utils.JustTest.createSuite({name: 'Testing Observable - subgraphs'});

suite.addTest({name: 'inner object from observable should fire events as usual'}, (pass, fail) => {
	let o = {inner: {prop: 'more'}},
		oo = Observable.from(o),
		iop = oo.inner,
		events = [],
		observer = function (changes) {
			events.push.apply(events, changes);
		};

	oo.observe(observer);
	iop.prop = 'else';
	iop.new = 'prop';

	if (events.length !== 2) fail('expected 2 callbacks on inner observer graph (subgraph), but found ' + events.length);
	if (events[0].type !== 'update' || events[0].path.join('.') !== 'inner.prop' || events[0].oldValue !== 'more' || events[0].value !== 'else' || events[0].object !== iop) fail('event 0 did not fire as expected');
	if (events[1].type !== 'insert' || events[1].path.join('.') !== 'inner.new' || typeof events[1].oldValue !== 'undefined' || events[1].value !== 'prop' || events[1].object !== iop) fail('event 1 did not fire as expected');

	pass();
});

suite.addTest({name: 'removal (detaching) of inner object from observable should disable it\'s proxy/events generating'}, (pass, fail) => {
	let o = {inner: {prop: 'more'}},
		oo = Observable.from(o),
		iop = oo.inner,
		cntr = 0,
		observer = function () {
			cntr++;
		};

	oo.observe(observer);
	iop.prop = 'text';
	if (cntr !== 1) fail('preliminary check failed, observer expected to be called 1 time, called ' + cntr);

	oo.inner = null;
	cntr = 0;
	try {
		iop.prop = 'again';
		fail('the flow should fail before this line on revoked proxy set');
	} catch (e) {
		if (!e || !(e instanceof TypeError)) fail('expected to have TypeError while setting revoked proxy');
	}
	if (cntr > 0) fail('observer expected NOT to be called when removed inner object changed, but called ' + cntr);

	pass();
});

suite.addTest({name: 'replacement of inner object from observable should return non-proxified original object'}, (pass, fail) => {
	let o = {inner: {prop: 'more', nested: {text: 'text'}}},
		oo = Observable.from(o),
		events = [];
	oo.observe(changes => events.push.apply(events, changes));

	oo.inner.prop = 'some';
	if (events.length !== 1 || events[0].type !== 'update' || events[0].path.length !== 2 || events[0].object !== oo.inner) {
		fail('expected to have correct update event');
	}
	events = [];

	oo.inner = {p: 'back'};
	if (events.length !== 1 || events[0].type !== 'update' || events[0].path.length !== 1 || events[0].object !== oo) {
		fail('expected to have correct update event - metadata');
	} else {
		if (!events[0].oldValue || events[0].oldValue.prop !== 'some') {
			fail('expected to have correct update event - correct oldValue present');
		}
		if (events[0].oldValue.nested.text !== 'text') {
			fail('expected to have correct update event - correct oldValue nested object present');
		}
	}

	pass();
});

suite.addTest({name: 'Object.assign on observable should raise an event/s of update with non-proxified original object'}, (pass, fail) => {
	let oldData = {b: {b1: "x", b2: "y"}},
		newData = {b: {b1: "z"}},
		observable = Observable.from(oldData),
		events = [];
	observable.observe(changes => events.push.apply(events, changes));

	Object.assign(observable, newData);

	if (events.length !== 1 || events[0].type !== 'update' || events[0].path.join('.') !== 'b' || events[0].object !== observable) {
		fail('UPDATE event metadata NOT as expected');
	} else if (!events[0].value || events[0].value.b1 !== 'z') {
		fail('UPDATE event (new) value NOT as expected');
	} else if (!events[0].oldValue || events[0].oldValue.b1 !== 'x' || events[0].oldValue.b2 !== 'y') {
		fail('UPDATE event oldValue NOT as expected');
	}

	pass();
});

suite.run();