import { assert } from 'chai';
import { getSuite } from 'just-test/suite';
import { Observable } from '../src/object-observer.js';

const suite = getSuite('Testing nested observable');

suite.test('nested of observable should be observable too', () => {
	const oo = Observable.from({
		user: {
			address: {
				street: 'street',
				block: 'block',
				city: 'city'
			}
		}
	});

	assert.isTrue(Observable.isObservable(oo));
	assert.isTrue(Observable.isObservable(oo.user));
	assert.isTrue(Observable.isObservable(oo.user.address));
	assert.isFalse(Observable.isObservable(oo.user.address.street));
});

suite.test('observable from nested stays the same object reference', () => {
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

	assert.equal(oo.user, oou);
	assert.equal(oo.user.address, oou.address);
	assert.equal(oo.user.address, ooua);
	assert.equal(oou.address, ooua);
});

suite.test('observable from nested can be observed', () => {
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

	assert.isTrue(Observable.isObservable(oou));
	assert.isTrue(Observable.isObservable(ooua));

	const rootEvents = [];
	const rootObs = changes => Array.prototype.push.apply(rootEvents, changes);
	const nestedEvents = [];
	const nestedObs = changes => Array.prototype.push.apply(nestedEvents, changes);

	Observable.observe(oou, nestedObs);
	oou.address.city = 'cityA';
	assert.equal(1, nestedEvents.length);

	Observable.observe(oo, rootObs);
	oo.user.address.city = 'cityB';
	assert.equal(1, rootEvents.length);
	assert.equal(2, nestedEvents.length);

	oou.address.city = 'cityC';
	assert.equal(2, rootEvents.length);
	assert.equal(3, nestedEvents.length);

	Observable.unobserve(oou, nestedObs);
	oou.address.city = 'cityD';
	assert.equal(3, rootEvents.length);
	assert.equal(3, nestedEvents.length);

	Observable.observe(oou, nestedObs);
	oou.address.city = 'cityE';
	assert.equal(4, rootEvents.length);
	assert.equal(4, nestedEvents.length);

	Observable.unobserve(oou);
	oou.address.city = 'cityF';
	assert.equal(5, rootEvents.length);
	assert.equal(4, nestedEvents.length);
});

suite.test('nested observable should handle errors', () => {
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
	assert.throws(
		() => Observable.observe(oou, 'invalid observer'),
		'observer MUST be a function'
	);
});

suite.test('nested observable should handle duplicate', () => {
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
	assert.equal(1, events.length);
});

suite.test('nested observable should provide correct path (relative to self)', () => {
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
	assert.equal(1, events.length);
	assert.equal('user.address.street', events[0].path.join('.'));
	assert.equal(1, eventsU.length);
	assert.equal('address.street', eventsU[0].path.join('.'));
	assert.equal(1, eventsUA.length);
	assert.equal('street', eventsUA[0].path.join('.'));
});

suite.test('nested observable should continue to function when detached', () => {
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
	assert.equal(1, events.length);
	assert.equal(1, eventsU.length);
	assert.equal(1, eventsUA.length);

	//	dettaching user
	oo.user = {};
	assert.equal(2, events.length);
	assert.equal(1, eventsU.length);
	assert.equal(1, eventsUA.length);

	ooua.street = 'streetB';
	assert.equal(2, events.length);
	assert.equal(2, eventsU.length);
	assert.equal(2, eventsUA.length);

	//	dettaching address
	oou.address = {};
	ooua.street = 'streetC';
	assert.equal(2, events.length);
	assert.equal(3, eventsU.length);
	assert.equal(3, eventsUA.length);
});

suite.test('nested observable is still cloned when moved', () => {
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
	assert.equal(1, events.length);
	assert.equal('0.user.address.street', events[0].path.join('.'));
	assert.equal(1, eventsU.length);
	assert.equal('address.street', eventsU[0].path.join('.'));
	assert.equal(1, eventsUA.length);
	assert.equal('street', eventsUA[0].path.join('.'));

	//	moving the subgraph
	oo[1].user = oou;
	ooua.street = 'streetB';
	assert.equal(3, events.length);
	assert.equal('0.user.address.street', events[2].path.join('.'));
	assert.equal(2, eventsU.length);
	assert.equal('address.street', eventsU[1].path.join('.'));
	assert.equal(2, eventsUA.length);
	assert.equal('street', eventsUA[1].path.join('.'));

	assert.isFalse(oo[0].user === oo[1].user);
	assert.isFalse(oo[0].user.address === oo[1].user.address);
});