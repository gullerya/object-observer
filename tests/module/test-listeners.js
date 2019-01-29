import {Observable} from '../../dist/object-observer.js';

let suite = Utils.JustTest.createSuite({name: 'Testing listeners APIs'});

suite.addTest({name: 'test listeners invocation - single listener'}, (pass, fail) => {
	let o = {}, oo = Observable.from(o);
	let events = [];

	oo.observe(changes => events = events.concat(changes));

	oo.some = 'test';
	oo.some = 'else';
	delete oo.some;

	if (events.length !== 3) fail('expected to find 3 events');
	if (events[0].type !== 'insert' ||
		events[0].path[0] !== 'some' ||
		typeof events[0].oldValue !== 'undefined' ||
		events[0].value !== 'test' ||
		events[0].object !== oo
	) {
		fail('event 0 is not as expected');
	}
	if (events[1].type !== 'update' ||
		events[1].path[0] !== 'some' ||
		events[1].oldValue !== 'test' ||
		events[1].value !== 'else' ||
		events[1].object !== oo
	) {
		fail('event 1 is not as expected');
	}
	if (events[2].type !== 'delete' ||
		events[2].path[0] !== 'some' ||
		events[2].oldValue !== 'else' ||
		typeof events[2].value !== 'undefined' ||
		events[2].object !== oo
	) {
		fail('event 2 is not as expected');
	}

	pass();
});

suite.addTest({name: 'test listeners invocation - multiple listeners'}, (pass, fail) => {
	let o = {}, oo = Observable.from(o);
	let eventsA = [], eventsB = [], eventsC = [];

	oo.observe(changes => eventsA = eventsA.concat(changes));
	oo.observe(changes => eventsB = eventsB.concat(changes));
	oo.observe(changes => eventsC = eventsC.concat(changes));

	oo.some = 'test';
	oo.some = 'else';
	delete oo.some;

	if (eventsA.length !== 3 || eventsB.length !== 3 || eventsC.length !== 3) {
		fail('some of events listeners got wrong number of events');
	}

	pass();
});

suite.addTest({name: 'test listeners invocation - multiple listeners and one is throwing'}, (pass, fail) => {
	let o = {}, oo = Observable.from(o);
	let eventsA = [], eventsB = [];

	oo.observe(changes => {
		throw new Error('intentional disrupt');
	});
	oo.observe(changes => eventsA = eventsA.concat(changes));
	oo.observe(changes => eventsB = eventsB.concat(changes));

	oo.some = 'test';
	oo.some = 'else';
	delete oo.some;

	if (eventsA.length !== 3 || eventsB.length !== 3) {
		fail('some of events listeners got wrong number of events');
	}

	pass();
});

suite.addTest({name: 'test listeners invocation - multiple times same listener'}, (pass, fail) => {
	let o = {}, oo = Observable.from(o);
	let eventsA = [];
	let listener = changes => eventsA = eventsA.concat(changes);

	oo.observe(listener);
	oo.observe(listener);

	oo.some = 'test';
	oo.some = 'else';
	delete oo.some;

	if (eventsA.length !== 3) {
		fail('some of events listeners got wrong number of events');
	}

	pass();
});

suite.addTest({name: 'test listeners invocation - listener is corrupted'}, (pass, fail) => {
	let o = {}, oo = Observable.from(o);

	try {
		oo.observe(null);
		fail('the flow should fail due to listener being NULL');
	} catch (e) {
	}

	try {
		oo.observe('some non function');
		fail('the flow should fail due to listener being STRING');
	} catch (e) {

	}

	pass();
});

suite.addTest({name: 'test listeners invocation - observing revoked Observable should throw'}, (pass, fail) => {
	let o = {}, oo = Observable.from(o);

	oo.revoke();
	try {
		oo.observe(() => {
		});
		fail('the flow should fail due to listener being NULL');
	} catch (e) {
	}

	pass();
});

suite.run();
