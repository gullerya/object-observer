import {Observable} from '../../dist/object-observer.js';

let suite = Utils.JustTest.createSuite({name: 'Testing ObjectObserver - arrays'});

suite.addTest({name: 'array push operation - primitives'}, (pass, fail) => {
	let a = [1, 2, 3, 4],
		pa,
		events = [],
		callBacks = 0;
	pa = Observable.from(a);
	pa.observe(eventsList => {
		[].push.apply(events, eventsList);
		callBacks++;
	});

	pa.push(5);
	pa.push(6, 7);

	if (events.length !== 3) fail('expected to have 3 events, found ' + events.length);
	if (callBacks !== 2) fail('expected to have 2 callbacks, found ' + callBacks);
	if (events[0].type !== 'insert' || events[0].path.join('.') !== '4' || events[0].value !== 5 || events[0].object !== pa) fail('event 0 did not fire as expected');
	if (events[1].type !== 'insert' || events[1].path.join('.') !== '5' || events[1].value !== 6 || events[1].object !== pa) fail('event 0 did not fire as expected');
	if (events[2].type !== 'insert' || events[2].path.join('.') !== '6' || events[2].value !== 7 || events[2].object !== pa) fail('event 0 did not fire as expected');

	pass();
});

suite.addTest({name: 'array push operation - objects'}, (pass, fail) => {
	let a = [],
		pa,
		events = [];
	pa = Observable.from(a);
	pa.observe(eventsList => {
		[].push.apply(events, eventsList);
	});

	pa.push({text: 'initial'}, {text: 'secondary'});
	if (events.length !== 2) fail('expected to have 2 event, found ' + events.length);
	if (events[0].type !== 'insert' || events[0].path.join('.') !== '0' || events[0].value.text !== 'initial' || events[0].object !== pa) fail('event 0 did not fire as expected');
	if (events[1].type !== 'insert' || events[1].path.join('.') !== '1' || events[1].value.text !== 'secondary' || events[1].object !== pa) fail('event 1 did not fire as expected');

	pa[0].text = 'name';
	if (events.length !== 3) fail('expected to have 3 events, found ' + events.length);
	if (events[2].type !== 'update' || events[2].path.join('.') !== '0.text' || events[2].value !== 'name' || events[2].oldValue !== 'initial' || events[2].object !== pa[0]) fail('event 2 did not fire as expected');

	pa[1].text = 'more';
	if (events.length !== 4) fail('expected to have 4 events, found ' + events.length);
	if (events[3].type !== 'update' || events[3].path.join('.') !== '1.text' || events[3].value !== 'more' || events[3].oldValue !== 'secondary' || events[3].object !== pa[1]) fail('event 3 did not fire as expected');

	pass();
});

suite.addTest({name: 'array push operation - arrays'}, (pass, fail) => {
	let a = [],
		pa,
		events = [];
	pa = Observable.from(a);
	pa.observe(eventsList => {
		[].push.apply(events, eventsList);
	});

	pa.push([], [{}]);
	if (events.length !== 2) fail('expected to have 2 event, found ' + events.length);
	if (events[0].type !== 'insert' || events[0].path.join('.') !== '0' || events[0].value.length !== 0 || events[0].object !== pa) fail('event 0 did not fire as expected');
	if (events[1].type !== 'insert' || events[1].path.join('.') !== '1' || events[1].value.length !== 1 || events[1].object !== pa) fail('event 1 did not fire as expected');

	pa[0].push('name');
	if (events.length !== 3) fail('expected to have 3 events, found ' + events.length);
	if (events[2].type !== 'insert' || events[2].path.join('.') !== '0.0' || events[2].value !== 'name' || events[2].object !== pa[0]) fail('event 2 did not fire as expected');

	pa[1][0].prop = 'more';
	if (events.length !== 4) fail('expected to have 4 events, found ' + events.length);
	if (events[3].type !== 'insert' || events[3].path.join('.') !== '1.0.prop' || events[3].value !== 'more' || events[3].object !== pa[1][0]) fail('event 3 did not fire as expected');

	pass();
});

suite.addTest({name: 'array pop operation - primitives'}, (pass, fail) => {
	let a = ['some'],
		pa,
		popped,
		events = [];
	pa = Observable.from(a);
	pa.observe(function (eventsList) {
		[].push.apply(events, eventsList);
	});

	popped = pa.pop();

	if (events.length !== 1) fail('expected to have 1 event, found ' + events.length);
	if (events[0].type !== 'delete' || events[0].path.join('.') !== '0' || events[0].oldValue !== 'some' || events[0].object !== pa) fail('event 0 did not fire as expected');
	if (popped !== 'some') fail('pop base functionality broken');

	pass();
});

suite.addTest({name: 'array pop operation - objects'}, (pass, fail) => {
	let a = [{test: 'text'}],
		pa,
		pad,
		popped,
		events = [];
	pa = Observable.from(a);
	pad = pa[0];
	pa.observe(eventsList => {
		[].push.apply(events, eventsList);
	});

	pa[0].test = 'test';
	pad.test = 'more';
	if (events.length !== 2) fail('expected to register 2 event on observable');

	popped = pa.pop();
	if (popped.test !== 'more') fail('expected to receive original object but with updated values');
	if (events.length !== 3) fail('expected to get Deleted event on pop operation');

	popped.new = 'value';
	if (events.length !== 3) fail('expected to not receive events on popped object');
	try {
		pad.test = 'change';
		fail('expected flow to not get to this point');
	} catch (e) {
		if (!(e instanceof TypeError)) fail('expected to get TypeError of operation revoke proxy object (detached)');
	}

	pass();
});

suite.addTest({name: 'array unshift operation - primitives'}, (pass, fail) => {
	let a = [],
		pa,
		events = [],
		callBacks = 0;
	pa = Observable.from(a);
	pa.observe(eventsList => {
		[].push.apply(events, eventsList);
		callBacks++;
	});

	pa.unshift('a');
	pa.unshift('b', 'c');
	if (events.length !== 3) fail('expected to have 3 events, found ' + events.length);
	if (callBacks !== 2) fail('expected to have 2 callbacks, found ' + callBacks);
	if (events[0].type !== 'insert' || events[0].path.join('.') !== '0' || events[0].value !== 'a' || events[0].object !== pa) fail('event 0 did not fire as expected');
	if (events[1].type !== 'insert' || events[1].path.join('.') !== '0' || events[1].value !== 'b' || events[1].object !== pa) fail('event 1 did not fire as expected');
	if (events[2].type !== 'insert' || events[2].path.join('.') !== '1' || events[2].value !== 'c' || events[2].object !== pa) fail('event 2 did not fire as expected');

	pass();
});

suite.addTest({name: 'array unshift operation - objects'}, (pass, fail) => {
	let a = [{text: 'original'}],
		pa,
		events = [];
	pa = Observable.from(a);
	pa.observe(eventsList => {
		[].push.apply(events, eventsList);
	});

	pa.unshift({text: 'initial'});
	if (events.length !== 1) fail('expected to have 1 event, found ' + events.length);
	if (events[0].type !== 'insert' || events[0].path.join('.') !== '0' || events[0].value.text !== 'initial' || events[0].object !== pa) fail('event 0 did not fire as expected');
	events.splice(0);

	pa[0].text = 'name';
	pa[1].text = 'other';
	if (events.length !== 2) fail('expected to have 2 events, found ' + events.length);
	if (events[0].type !== 'update' || events[0].path.join('.') !== '0.text' || events[0].value !== 'name' || events[0].oldValue !== 'initial' || events[0].object !== pa[0]) fail('event 0 did not fire as expected');
	if (events[1].type !== 'update' || events[1].path.join('.') !== '1.text' || events[1].value !== 'other' || events[1].oldValue !== 'original' || events[1].object !== pa[1]) fail('event 1 did not fire as expected');

	pass();
});

suite.addTest({name: 'array unshift operation - arrays'}, (pass, fail) => {
	let a = [{text: 'original'}],
		pa,
		events = [];
	pa = Observable.from(a);
	pa.observe(eventsList => {
		[].push.apply(events, eventsList);
	});

	pa.unshift([{}]);
	if (events.length !== 1) fail('expected to have 1 event, found ' + events.length);
	if (events[0].type !== 'insert' || events[0].path.join('.') !== '0' || events[0].value.length !== 1 || events[0].object !== pa) fail('event 0 did not fire as expected');
	events.splice(0);

	pa[0][0].text = 'name';
	pa[1].text = 'other';
	if (events.length !== 2) fail('expected to have 2 events, found ' + events.length);
	if (events[0].type !== 'insert' || events[0].path.join('.') !== '0.0.text' || events[0].value !== 'name' || events[0].object !== pa[0][0]) fail('event 0 did not fire as expected');
	if (events[1].type !== 'update' || events[1].path.join('.') !== '1.text' || events[1].value !== 'other' || events[1].oldValue !== 'original' || events[1].object !== pa[1]) fail('event 1 did not fire as expected');

	pass();
});

suite.addTest({name: 'array shift operation - primitives'}, (pass, fail) => {
	let a = ['some'],
		pa,
		shifted,
		events = [];
	pa = Observable.from(a);
	pa.observe(eventsList => {
		[].push.apply(events, eventsList);
	});

	shifted = pa.shift();

	if (events.length !== 1) fail('expected to have 1 event, found ' + events.length);
	if (events[0].type !== 'delete' || events[0].path.join('.') !== '0' || events[0].oldValue !== 'some' || events[0].newValue || events[0].object !== pa) fail('event 0 did not fire as expected');
	if (shifted !== 'some') fail('shift base functionality broken');

	pass();
});

suite.addTest({name: 'array shift operation - objects'}, (pass, fail) => {
	let a = [{text: 'a', inner: {test: 'more'}}, {text: 'b'}],
		pa,
		pa0,
		pa0i,
		shifted,
		events = [];
	pa = Observable.from(a);
	pa0 = pa[0];
	pa0i = pa0.inner;
	pa.observe(eventsList => {
		[].push.apply(events, eventsList);
	});

	pa[0].text = 'b';
	pa0i.test = 'test';
	if (events.length !== 2) fail('expected to have 2 events, found ' + events.length);
	events.splice(0);

	shifted = pa.shift();
	if (shifted.text !== 'b' || shifted.inner.test !== 'test') fail('expected to receive updated original object');

	if (events.length !== 1) fail('expected to have 1 event, found ' + events.length);
	if (events[0].type !== 'delete' || events[0].path.join('.') !== '0' || events[0].oldValue.text !== 'b' || events[0].object !== pa) fail('event 0 did not fire as expected');
	events.splice(0);

	pa[0].text = 'c';
	if (events.length !== 1) fail('expected to have 1 event, found ' + events.length);
	if (events[0].type !== 'update' || events[0].path.join('.') !== '0.text' || events[0].oldValue !== 'b' || events[0].value !== 'c' || events[0].object !== pa[0]) fail('event 0 did not fire as expected');
	events.splice(0);

	shifted.text = 'd';
	if (events.length) fail('expected to not see events on revoked sub/graph');
	try {
		pa0i.test = 'dk';
		fail('expecte to not get to this point');
	} catch (e) {
		if (!(e instanceof TypeError)) fail('expected to get TypeError on revoked proxy use');
	}

	pass();
});

suite.addTest({name: 'array reverse operation - primitives (flat array)'}, (pass, fail) => {
	let a = [1, 2, 3],
		pa,
		reversed,
		events = [];
	pa = Observable.from(a);
	pa.observe(eventsList => {
		[].push.apply(events, eventsList);
	});

	reversed = pa.reverse();

	if (reversed !== pa) fail('reverse base functionality broken');
	if (events.length !== 1) fail('expected to have 1 event, found ' + events.length);
	if (events[0].type !== 'reverse' || events[0].path.length !== 0 || events[0].object !== pa) fail('event 0 did not fire as expected');
	if (pa[0] !== 3 || pa[1] !== 2 || pa[2] !== 1) fail('reverse base functionality broken');

	pass();
});

suite.addTest({name: 'array reverse operation - primitives (nested array)'}, (pass, fail) => {
	let a = {a1: {a2: [1, 2, 3]}},
		pa,
		reversed,
		events = [];
	pa = Observable.from(a);
	pa.observe(eventsList => {
		[].push.apply(events, eventsList);
	});

	reversed = pa.a1.a2.reverse();

	if (reversed !== pa.a1.a2) fail('reverse base functionality broken');
	if (events.length !== 1) fail('expected to have 1 event, found ' + events.length);
	if (events[0].type !== 'reverse' || events[0].path.length !== 2 || events[0].path.join('.') !== 'a1.a2' || events[0].object !== pa.a1.a2) fail('event 0 did not fire as expected');
	if (pa.a1.a2[0] !== 3 || pa.a1.a2[1] !== 2 || pa.a1.a2[2] !== 1) fail('reverse base functionality broken');

	pass();
});

suite.addTest({name: 'array reverse operation - objects'}, (pass, fail) => {
	let a = [{name: 'a'}, {name: 'b'}, {name: 'c'}],
		pa,
		reversed,
		events = [];
	pa = Observable.from(a);
	pa.observe(eventsList => {
		[].push.apply(events, eventsList);
	});

	pa[0].name = 'A';
	reversed = pa.reverse();
	pa[0].name = 'C';

	if (reversed !== pa) fail('reverse base functionality broken');
	if (events.length !== 3) fail('expected to have 3 events, found ' + events.length);
	if (events[0].type !== 'update' || events[0].path.join('.') !== '0.name' || events[0].value !== 'A' || events[0].oldValue !== 'a' || events[0].object !== pa[2]) fail('event 0 did not fire as expected');
	if (events[1].type !== 'reverse' || events[1].path.length !== 0 || events[1].object !== pa) fail('event 1 did not fire as expected');
	if (events[2].type !== 'update' || events[2].path.join('.') !== '0.name' || events[2].value !== 'C' || events[2].oldValue !== 'c' || events[2].object !== pa[0]) fail('event 2 did not fire as expected');

	pass();
});

suite.addTest({name: 'array sort operation - primitives (flat array)'}, (pass, fail) => {
	let a = [3, 2, 1],
		pa,
		sorted,
		events = [];
	pa = Observable.from(a);
	pa.observe(eventsList => {
		[].push.apply(events, eventsList);
	});

	sorted = pa.sort();

	if (sorted !== pa) fail('sort base functionality broken');
	if (events.length !== 1) fail('expected to have 1 event, found ' + events.length);
	if (events[0].type !== 'shuffle' || events[0].object !== pa) fail('event 0 did not fire as expected');
	if (pa[0] !== 1 || pa[1] !== 2 || pa[2] !== 3) fail('sort base functionality broken');

	sorted = pa.sort((a, b) => {
		return a < b ? 1 : -1;
	});
	if (sorted !== pa) fail('sort base functionality broken');
	if (events.length !== 2) fail('expected to have 2 events, found ' + events.length);
	if (events[1].type !== 'shuffle' || events[1].path.length !== 0 || events[1].object !== pa) fail('event 1 did not fire as expected');
	if (pa[0] !== 3 || pa[1] !== 2 || pa[2] !== 1) fail('sort base functionality broken');

	pass();
});

suite.addTest({name: 'array sort operation - primitives (nested array)'}, (pass, fail) => {
	let a = {a1: {a2: [3, 2, 1]}},
		pa,
		sorted,
		events = [];
	pa = Observable.from(a);
	pa.observe(eventsList => {
		[].push.apply(events, eventsList);
	});

	sorted = pa.a1.a2.sort();

	if (sorted !== pa.a1.a2) fail('sort base functionality broken');
	if (events.length !== 1) fail('expected to have 1 event, found ' + events.length);
	if (events[0].type !== 'shuffle' || events[0].path.length !== 2 || events[0].path.join('.') !== 'a1.a2' || events[0].object !== pa.a1.a2) fail('event 0 did not fire as expected');
	if (pa.a1.a2[0] !== 1 || pa.a1.a2[1] !== 2 || pa.a1.a2[2] !== 3) fail('sort base functionality broken');

	sorted = pa.a1.a2.sort((a, b) => {
		return a < b ? 1 : -1;
	});
	if (sorted !== pa.a1.a2) fail('sort base functionality broken');
	if (events.length !== 2) fail('expected to have 2 events, found ' + events.length);
	if (events[1].type !== 'shuffle' || events[1].path.length !== 2 || events[1].path.join('.') !== 'a1.a2' || events[1].object !== pa.a1.a2) fail('event 1 did not fire as expected');
	if (pa.a1.a2[0] !== 3 || pa.a1.a2[1] !== 2 || pa.a1.a2[2] !== 1) fail('sort base functionality broken');

	pass();
});

suite.addTest({name: 'array sort operation - objects'}, (pass, fail) => {
	let a = [{name: 'a'}, {name: 'b'}, {name: 'c'}],
		pa,
		sorted,
		events = [];
	pa = Observable.from(a);
	pa.observe(eventsList => {
		[].push.apply(events, eventsList);
	});

	pa[0].name = 'A';
	sorted = pa.sort((a, b) => {
		return a.name < b.name ? 1 : -1;
	});
	pa[0].name = 'C';

	if (sorted !== pa) fail('sort base functionality broken');
	if (events.length !== 3) fail('expected to have 3 events, found ' + events.length);
	if (events[0].type !== 'update' || events[0].path.join('.') !== '0.name' || events[0].value !== 'A' || events[0].oldValue !== 'a' || events[0].object !== pa[2]) fail('event 0 did not fire as expected');
	if (events[1].type !== 'shuffle' || events[1].object !== pa) fail('event 1 did not fire as expected');
	if (events[2].type !== 'update' || events[2].path.join('.') !== '0.name' || events[2].value !== 'C' || events[2].oldValue !== 'c' || events[2].object !== pa[0]) fail('event 2 did not fire as expected');

	pass();
});

suite.addTest({name: 'array fill operation - primitives'}, (pass, fail) => {
	let a = [1, 2, 3],
		pa,
		filled,
		events = [];
	pa = Observable.from(a);
	pa.observe(eventsList => {
		[].push.apply(events, eventsList);
	});

	filled = pa.fill('a');
	if (filled !== pa) fail('fill base functionality broken');
	if (events.length !== 3) fail('expected to have 3 events, found ' + events.length);
	if (events[0].type !== 'update' || events[0].path.join('.') !== '0' || events[0].value !== 'a' || events[0].oldValue !== 1 || events[0].object !== pa) fail('event 0 did not fire as expected');
	if (events[1].type !== 'update' || events[1].path.join('.') !== '1' || events[1].value !== 'a' || events[1].oldValue !== 2 || events[1].object !== pa) fail('event 1 did not fire as expected');
	if (events[2].type !== 'update' || events[2].path.join('.') !== '2' || events[2].value !== 'a' || events[2].oldValue !== 3 || events[2].object !== pa) fail('event 2 did not fire as expected');
	events.splice(0);

	pa.fill('b', 1, 3);
	if (events.length !== 2) fail('expected to have 2 events, found ' + events.length);
	if (events[0].type !== 'update' || events[0].path.join('.') !== '1' || events[0].value !== 'b' || events[0].oldValue !== 'a' || events[0].object !== pa) fail('event 0 did not fire as expected');
	if (events[1].type !== 'update' || events[1].path.join('.') !== '2' || events[1].value !== 'b' || events[1].oldValue !== 'a' || events[1].object !== pa) fail('event 1 did not fire as expected');
	events.splice(0);

	pa.fill('c', -1, 3);
	if (events.length !== 1) fail('expected to have 1 events, found ' + events.length);
	if (events[0].type !== 'update' || events[0].path.join('.') !== '2' || events[0].value !== 'c' || events[0].oldValue !== 'b' || events[0].object !== pa) fail('event 0 did not fire as expected');
	events.splice(0);

	//	simulating insertion of a new item into array (fill does not extend an array, so we may do it only on internal items)
	delete pa[1];
	pa.fill('d', 1, 2);
	if (events.length !== 2) fail('expected to have 2 events, found ' + events.length);
	if (events[0].type !== 'delete' || events[0].path.join('.') !== '1' || typeof events[0].value !== 'undefined' || events[0].oldValue !== 'b' || events[0].object !== pa) fail('event 0 did not fire as expected');
	if (events[1].type !== 'insert' || events[1].path.join('.') !== '1' || events[1].value !== 'd' || typeof events[1].oldValue !== 'undefined' || events[1].object !== pa) fail('event 1 did not fire as expected');

	pass();
});

suite.addTest({name: 'array fill operation - objects'}, (pass, fail) => {
	let a = [{some: 'text'}, {some: 'else'}, {some: 'more'}],
		pa,
		filled,
		events = [];
	pa = Observable.from(a);
	pa.observe(eventsList => {
		[].push.apply(events, eventsList);
	});

	filled = pa.fill({name: 'Niv'});
	if (filled !== pa) fail('fill base functionality broken');
	if (events.length !== 3) fail('expected to have 3 events, found ' + events.length);
	if (events[0].type !== 'update' || events[0].path.join('.') !== '0' || events[0].value.name !== 'Niv' || events[0].oldValue.some !== 'text' || events[0].object !== pa) fail('event 0 did not fire as expected');
	if (events[1].type !== 'update' || events[1].path.join('.') !== '1' || events[1].value.name !== 'Niv' || events[1].oldValue.some !== 'else' || events[1].object !== pa) fail('event 1 did not fire as expected');
	if (events[2].type !== 'update' || events[2].path.join('.') !== '2' || events[2].value.name !== 'Niv' || events[2].oldValue.some !== 'more' || events[2].object !== pa) fail('event 2 did not fire as expected');
	events.splice(0);

	pa[1].name = 'David';
	if (events.length !== 1) fail('expected to have 1 events, found ' + events.length);
	if (events[0].type !== 'update' || events[0].path.join('.') !== '1.name' || events[0].value !== 'David' || events[0].oldValue !== 'Niv' || events[0].object !== pa[1]) fail('event 0 did not fire as expected');

	pass();
});

suite.addTest({name: 'array fill operation - arrays'}, (pass, fail) => {
	let a = [{some: 'text'}, {some: 'else'}, {some: 'more'}],
		pa,
		filled,
		events = [];
	pa = Observable.from(a);
	pa.observe(eventsList => {
		[].push.apply(events, eventsList);
	});

	filled = pa.fill([{name: 'Niv'}]);
	if (filled !== pa) fail('fill base functionality broken');
	if (events.length !== 3) fail('expected to have 3 events, found ' + events.length);
	if (events[0].type !== 'update' || events[0].path.join('.') !== '0' || events[0].value[0].name !== 'Niv' || events[0].oldValue.some !== 'text' || events[0].object !== pa) fail('event 0 did not fire as expected');
	if (events[1].type !== 'update' || events[1].path.join('.') !== '1' || events[1].value[0].name !== 'Niv' || events[1].oldValue.some !== 'else' || events[1].object !== pa) fail('event 1 did not fire as expected');
	if (events[2].type !== 'update' || events[2].path.join('.') !== '2' || events[2].value[0].name !== 'Niv' || events[2].oldValue.some !== 'more' || events[2].object !== pa) fail('event 2 did not fire as expected');
	events.splice(0);

	pa[1][0].name = 'David';
	if (events.length !== 1) fail('expected to have 1 events, found ' + events.length);
	if (events[0].type !== 'update' || events[0].path.join('.') !== '1.0.name' || events[0].value !== 'David' || events[0].oldValue !== 'Niv' || events[0].object !== pa[1][0]) fail('event 0 did not fire as expected');

	pass();
});

suite.addTest({name: 'array splice operation - primitives'}, (pass, fail) => {
	let a = [1, 2, 3, 4, 5, 6],
		pa,
		spliced,
		events = [],
		callbacks = 0;
	pa = Observable.from(a);
	pa.observe(eventsList => {
		[].push.apply(events, eventsList);
		callbacks++;
	});

	spliced = pa.splice(2, 2, 'a');
	if (!Array.isArray(spliced) || spliced.length !== 2 || spliced[0] !== 3 || spliced[1] !== 4) fail('splice base functionality broken');
	if (events.length !== 2) fail('expected to have 2 events, found ' + events.length);
	if (callbacks !== 1) fail('expected to have 1 callback, found ' + callbacks);
	if (events[0].type !== 'update' || events[0].path.join('.') !== '2' || events[0].value !== 'a' || events[0].oldValue !== 3 || events[0].object !== pa) fail('event 0 did not fire as expected');
	if (events[1].type !== 'delete' || events[1].path.join('.') !== '3' || events[1].oldValue !== 4 || events[1].object !== pa) fail('event 1 did not fire as expected');
	events.splice(0);
	callbacks = 0;

	//  pa = [1,2,'a',5,6]
	pa.splice(-3);
	if (events.length !== 3) fail('expected to have 3 events, found ' + events.length);
	if (callbacks !== 1) fail('expected to have 1 callback, found ' + callbacks);
	if (events[0].type !== 'delete' || events[0].path.join('.') !== '2' || events[0].oldValue !== 'a' || events[0].object !== pa) fail('event 0 did not fire as expected');
	if (events[1].type !== 'delete' || events[1].path.join('.') !== '3' || events[1].oldValue !== 5 || events[1].object !== pa) fail('event 1 did not fire as expected');
	if (events[2].type !== 'delete' || events[2].path.join('.') !== '4' || events[2].oldValue !== 6 || events[2].object !== pa) fail('event 2 did not fire as expected');
	events.splice(0);
	callbacks = 0;

	//  pa = [1,2]
	pa.splice(0);
	if (events.length !== 2) fail('expected to have 2 events, found ' + events.length);
	if (callbacks !== 1) fail('expected to have 1 callback, found ' + callbacks);
	if (events[0].type !== 'delete' || events[0].path.join('.') !== '0' || events[0].oldValue !== 1 || events[0].object !== pa) fail('event 0 did not fire as expected');
	if (events[1].type !== 'delete' || events[1].path.join('.') !== '1' || events[1].oldValue !== 2 || events[1].object !== pa) fail('event 1 did not fire as expected');
	events.splice(0);
	callbacks = 0;

	pass();
});

suite.addTest({name: 'array splice operation - objects'}, (pass, fail) => {
	let a = [{text: 'a'}, {text: 'b'}, {text: 'c'}, {text: 'd'}],
		pa,
		spliced,
		events = [];
	pa = Observable.from(a);
	pa.observe(eventsList => {
		[].push.apply(events, eventsList);
	});

	pa.splice(1, 2, {text: '1'});
	if (events.length !== 2) fail('expected to have 2 events, found ' + events.length);
	if (events[0].type !== 'update' || events[0].path.join('.') !== '1' || events[0].value.text !== '1' || events[0].oldValue.text !== 'b' || events[0].object !== pa) fail('event 0 did not fire as expected');
	if (events[1].type !== 'delete' || events[1].path.join('.') !== '2' || events[1].oldValue.text !== 'c' || events[1].object !== pa) fail('event 1 did not fire as expected');
	events.splice(0);

	pa[1].text = 'B';
	pa[2].text = 'D';
	if (events.length !== 2) fail('expected to have 2 events, found ' + events.length);
	if (events[0].type !== 'update' || events[0].path.join('.') !== '1.text' || events[0].value !== 'B' || events[0].oldValue !== '1' || events[0].object !== pa[1]) fail('event 0 did not fire as expected');
	if (events[1].type !== 'update' || events[1].path.join('.') !== '2.text' || events[1].value !== 'D' || events[1].oldValue !== 'd' || events[1].object !== pa[2]) fail('event 1 did not fire as expected');
	events.splice(0);

	spliced = pa.splice(1, 1, {text: 'A'}, {text: 'B'});
	if (events.length !== 2) fail('expected to have 2 events, found ' + events.length);
	if (events[0].type !== 'update' || events[0].path.join('.') !== '1' || events[0].value.text !== 'A' || events[0].oldValue.text !== 'B' || events[0].object !== pa) fail('event 0 did not fire as expected');
	if (events[1].type !== 'insert' || events[1].path.join('.') !== '2' || events[1].value.text !== 'B' || typeof events[1].oldValue !== 'undefined' || events[1].object !== pa) fail('event 1 did not fire as expected');
	events.splice(0);

	pa[3].text = 'C';
	if (events.length !== 1) fail('expected to have 1 events, found ' + events.length);
	if (events[0].type !== 'update' || events[0].path.join('.') !== '3.text' || events[0].value !== 'C' || events[0].oldValue !== 'D' || events[0].object !== pa[3]) fail('event 0 did not fire as expected');

	pass();
});

suite.addTest({name: 'array splice operation - arrays'}, (pass, fail) => {
	let a = [{text: 'a'}, {text: 'b'}, {text: 'c'}, {text: 'd'}],
		pa,
		spliced,
		events = [];
	pa = Observable.from(a);
	pa.observe(eventsList => {
		[].push.apply(events, eventsList);
	});

	pa.splice(1, 2, [{text: '1'}]);
	if (events.length !== 2) fail('expected to have 2 events, found ' + events.length);
	if (events[0].type !== 'update' || events[0].path.join('.') !== '1' || events[0].value[0].text !== '1' || events[0].oldValue.text !== 'b' || events[0].object !== pa) fail('event 0 did not fire as expected');
	if (events[1].type !== 'delete' || events[1].path.join('.') !== '2' || events[1].oldValue.text !== 'c' || events[1].object !== pa) fail('event 1 did not fire as expected');
	events.splice(0);

	pa[1][0].text = 'B';
	pa[2].text = 'D';
	if (events.length !== 2) fail('expected to have 2 events, found ' + events.length);
	if (events[0].type !== 'update' || events[0].path.join('.') !== '1.0.text' || events[0].value !== 'B' || events[0].oldValue !== '1' || events[0].object !== pa[1][0]) fail('event 0 did not fire as expected');
	if (events[1].type !== 'update' || events[1].path.join('.') !== '2.text' || events[1].value !== 'D' || events[1].oldValue !== 'd' || events[1].object !== pa[2]) fail('event 1 did not fire as expected');
	events.splice(0);

	spliced = pa.splice(1, 1, {text: 'A'}, [{text: 'B'}]);
	if (events.length !== 2) fail('expected to have 2 events, found ' + events.length);
	if (spliced.length !== 1) fail('expected to have 1 spliced object');
	if (spliced[0].length !== 1 || spliced[0][0].text !== 'B') fail('spliced object is not as expected');
	if (events[0].type !== 'update' || events[0].path.join('.') !== '1' || events[0].value.text !== 'A' || events[0].oldValue[0].text !== 'B' || events[0].object !== pa) fail('event 0 did not fire as expected');
	if (events[1].type !== 'insert' || events[1].path.join('.') !== '2' || events[1].value[0].text !== 'B' || typeof events[1].oldValue !== 'undefined' || events[1].object !== pa) fail('event 1 did not fire as expected');
	events.splice(0);

	pa[3].text = 'C';
	if (events.length !== 1) fail('expected to have 1 events, found ' + events.length);
	if (events[0].type !== 'update' || events[0].path.join('.') !== '3.text' || events[0].value !== 'C' || events[0].oldValue !== 'D' || events[0].object !== pa[3]) fail('event 0 did not fire as expected');

	pass();
});

suite.run();