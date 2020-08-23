import { getSuite } from '../../node_modules/just-test/dist/just-test.js';
import { Observable } from '../../dist/object-observer.js';

const suite = getSuite({ name: 'Testing listeners APIs' });

suite.runTest({ name: 'test listeners invocation - single listener' }, () => {
	let o = {}, oo = Observable.from(o);
	let events = [];

	oo.observe(changes => events = events.concat(changes));

	oo.some = 'test';
	oo.some = 'else';
	delete oo.some;

	if (events.length !== 3) throw new Error('expected to find 3 events');
	if (events[0].type !== 'insert' ||
		events[0].path[0] !== 'some' ||
		typeof events[0].oldValue !== 'undefined' ||
		events[0].value !== 'test' ||
		events[0].object !== oo
	) {
		throw new Error('event 0 is not as expected');
	}
	if (events[1].type !== 'update' ||
		events[1].path[0] !== 'some' ||
		events[1].oldValue !== 'test' ||
		events[1].value !== 'else' ||
		events[1].object !== oo
	) {
		throw new Error('event 1 is not as expected');
	}
	if (events[2].type !== 'delete' ||
		events[2].path[0] !== 'some' ||
		events[2].oldValue !== 'else' ||
		typeof events[2].value !== 'undefined' ||
		events[2].object !== oo
	) {
		throw new Error('event 2 is not as expected');
	}
});

suite.runTest({ name: 'test listeners invocation - multiple listeners' }, () => {
	let o = {}, oo = Observable.from(o);
	let eventsA = [], eventsB = [], eventsC = [];

	oo.observe(changes => eventsA = eventsA.concat(changes));
	oo.observe(changes => eventsB = eventsB.concat(changes));
	oo.observe(changes => eventsC = eventsC.concat(changes));

	oo.some = 'test';
	oo.some = 'else';
	delete oo.some;

	if (eventsA.length !== 3 || eventsB.length !== 3 || eventsC.length !== 3) {
		throw new Error('some of events listeners got wrong number of events');
	}
});

suite.runTest({ name: 'test listeners invocation - multiple listeners and one is throwing' }, () => {
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
		throw new Error('some of events listeners got wrong number of events');
	}
});

suite.runTest({ name: 'test listeners invocation - multiple times same listener' }, () => {
	let o = {}, oo = Observable.from(o);
	let eventsA = [];
	let listener = changes => eventsA = eventsA.concat(changes);

	oo.observe(listener);
	oo.observe(listener);

	oo.some = 'test';
	oo.some = 'else';
	delete oo.some;

	if (eventsA.length !== 3) {
		throw new Error('some of events listeners got wrong number of events');
	}
});

suite.runTest({ name: 'test listeners invocation - listener is corrupted' }, () => {
	let o = {}, oo = Observable.from(o);

	try {
		oo.observe(null);
		throw new Error('the flow should fail due to listener being NULL');
	} catch (e) {
	}

	try {
		oo.observe('some non function');
		throw new Error('the flow should fail due to listener being STRING');
	} catch (e) {
	}
});
