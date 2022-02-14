import { getSuite } from '../../node_modules/just-test/dist/just-test.js';
import { Observable } from '../../src/object-observer.js';

const suite = getSuite({ name: 'Testing nested observable' });

suite.runTest({ name: 'nested of observable should be observable too' }, test => {
	const oo = Observable.from({
		user: {
			address: {
				street: 'street',
				block: 'block',
				city: 'city'
			}
		}
	});

	test.assertTrue(Observable.isObservable(oo));
	test.assertTrue(Observable.isObservable(oo.user));
	test.assertTrue(Observable.isObservable(oo.user.address));
	test.assertFalse(Observable.isObservable(oo.user.address.street));
});

suite.runTest({ name: 'observable from nested stays the same object reference' }, test => {
	const oo = Observable.from({
		user: {
			address: {
				street: 'street',
				block: 'block',
				city: 'city'
			}
		}
	});
	const oou = Observable.from(oo.user),
		ooua = Observable.from(oo.user.address);

	test.assertEqual(oo.user, oou);
	test.assertEqual(oo.user.address, oou.address);
	test.assertEqual(oo.user.address, ooua);
	test.assertEqual(oou.address, ooua);
});

suite.runTest({ name: 'observable from nested can be observed' }, test => {
	const oo = Observable.from({
		user: {
			address: {
				street: 'street',
				block: 'block',
				city: 'city'
			}
		}
	});
	const oou = Observable.from(oo.user),
		ooua = Observable.from(oo.user.address);

	test.assertTrue(Observable.isObservable(oou));
	test.assertTrue(Observable.isObservable(ooua));

	const rootEvents = [];
	const rootObs = changes => Array.prototype.push.apply(rootEvents, changes);
	const nestedEvents = [];
	const nestedObs = changes => Array.prototype.push.apply(nestedEvents, changes);

	Observable.observe(oou, nestedObs);
	oou.address.city = 'cityA';
	test.assertEqual(1, nestedEvents.length);

	Observable.observe(oo, rootObs);
	oo.user.address.city = 'cityB';
	test.assertEqual(1, rootEvents.length);
	test.assertEqual(2, nestedEvents.length);

	oou.address.city = 'cityC';
	test.assertEqual(2, rootEvents.length);
	test.assertEqual(3, nestedEvents.length);

	Observable.unobserve(oou, nestedObs);
	oou.address.city = 'cityD';
	test.assertEqual(3, rootEvents.length);
	test.assertEqual(3, nestedEvents.length);

	Observable.observe(oou, nestedObs);
	oou.address.city = 'cityE';
	test.assertEqual(4, rootEvents.length);
	test.assertEqual(4, nestedEvents.length);

	Observable.unobserve(oou);
	oou.address.city = 'cityF';
	test.assertEqual(5, rootEvents.length);
	test.assertEqual(4, nestedEvents.length);
});

suite.runTest({ name: 'nested observable should handle errors', expectError: 'observer MUST be a function' }, () => {
	const oo = Observable.from({
		user: {
			address: {
				street: 'street',
				block: 'block',
				city: 'city'
			}
		}
	})
	const oou = Observable.from(oo.user);

	Observable.observe(oou, 'invalid observer');
});

suite.runTest({ name: 'nested observable should handle duplicate' }, test => {
	const oo = Observable.from({
		user: {
			address: {
				street: 'street',
				block: 'block',
				city: 'city'
			}
		}
	});
	const
		oou = Observable.from(oo.user),
		events = [],
		observer = changes => Array.prototype.push.apply(events, changes);

	Observable.observe(oou, observer);
	Observable.observe(oou, observer);
	oou.address.street = 'streetA';
	test.assertEqual(1, events.length);
});

suite.runTest({ name: 'nested observable should provide correct path (relative to self)' }, test => {
	const oo = Observable.from({
		user: {
			address: {
				street: 'street',
				block: 'block',
				city: 'city'
			}
		}
	})
	const
		oou = Observable.from(oo.user),
		ooua = Observable.from(oo.user.address),
		events = [],
		eventsU = [],
		eventsUA = [];

	Observable.observe(oo, changes => Array.prototype.push.apply(events, changes));
	Observable.observe(oou, changes => Array.prototype.push.apply(eventsU, changes));
	Observable.observe(ooua, changes => Array.prototype.push.apply(eventsUA, changes));

	ooua.street = 'streetA';
	test.assertEqual(1, events.length);
	test.assertEqual('user.address.street', events[0].path.join('.'));
	test.assertEqual(1, eventsU.length);
	test.assertEqual('address.street', eventsU[0].path.join('.'));
	test.assertEqual(1, eventsUA.length);
	test.assertEqual('street', eventsUA[0].path.join('.'));
});

suite.runTest({ name: 'nested observable should continue to function when detached' }, test => {
	const oo = Observable.from({
		user: {
			address: {
				street: 'street',
				block: 'block',
				city: 'city'
			}
		}
	});
	const
		oou = Observable.from(oo.user),
		ooua = Observable.from(oo.user.address),
		events = [],
		eventsU = [],
		eventsUA = [];

	Observable.observe(oo, changes => Array.prototype.push.apply(events, changes));
	Observable.observe(oou, changes => Array.prototype.push.apply(eventsU, changes));
	Observable.observe(ooua, changes => Array.prototype.push.apply(eventsUA, changes));

	ooua.street = 'streetA';
	test.assertEqual(1, events.length);
	test.assertEqual(1, eventsU.length);
	test.assertEqual(1, eventsUA.length);

	//	dettaching user
	oo.user = {};
	test.assertEqual(2, events.length);
	test.assertEqual(1, eventsU.length);
	test.assertEqual(1, eventsUA.length);

	ooua.street = 'streetB';
	test.assertEqual(2, events.length);
	test.assertEqual(2, eventsU.length);
	test.assertEqual(2, eventsUA.length);

	//	dettaching address
	oou.address = {};
	ooua.street = 'streetC';
	test.assertEqual(2, events.length);
	test.assertEqual(3, eventsU.length);
	test.assertEqual(3, eventsUA.length);
});

suite.runTest({ name: 'nested observable is still cloned when moved' }, test => {
	const
		u = { user: { address: { street: 'street', block: 'block', city: 'city' } } },
		oo = Observable.from([u, u]),
		oou = Observable.from(oo[0].user),
		ooua = Observable.from(oo[0].user.address),
		events = [],
		eventsU = [],
		eventsUA = [];

	Observable.observe(oo, changes => Array.prototype.push.apply(events, changes));
	Observable.observe(oou, changes => Array.prototype.push.apply(eventsU, changes));
	Observable.observe(ooua, changes => Array.prototype.push.apply(eventsUA, changes));

	ooua.street = 'streetA';
	test.assertEqual(1, events.length);
	test.assertEqual('0.user.address.street', events[0].path.join('.'));
	test.assertEqual(1, eventsU.length);
	test.assertEqual('address.street', eventsU[0].path.join('.'));
	test.assertEqual(1, eventsUA.length);
	test.assertEqual('street', eventsUA[0].path.join('.'));

	//	moving the subgraph
	oo[1].user = oou;
	ooua.street = 'streetB';
	test.assertEqual(3, events.length);
	test.assertEqual('0.user.address.street', events[2].path.join('.'));
	test.assertEqual(2, eventsU.length);
	test.assertEqual('address.street', eventsU[1].path.join('.'));
	test.assertEqual(2, eventsUA.length);
	test.assertEqual('street', eventsUA[1].path.join('.'));

	test.assertFalse(oo[0].user === oo[1].user);
	test.assertFalse(oo[0].user.address === oo[1].user.address);
});