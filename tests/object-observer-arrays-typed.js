import { getSuite } from '../../node_modules/just-test/dist/just-test.js';
import { Observable } from '../../src/object-observer.js';

const suite = getSuite({ name: 'Testing ObjectObserver - typed arrays' });

suite.runTest({ name: 'typed array reverse - Int8Array' }, () => {
	const
		pa = Observable.from(new Int8Array([1, 2, 3])),
		events = [];

	Observable.observe(pa, eventsList => {
		[].push.apply(events, eventsList);
	});

	const reversed = pa.reverse();

	if (reversed !== pa) throw new Error('reverse base functionality broken');
	if (events.length !== 1) throw new Error('expected to have 1 event, found ' + events.length);
	if (events[0].type !== 'reverse' || events[0].path.length !== 0 || events[0].object !== pa) throw new Error('event 0 did not fire as expected');
	if (pa[0] !== 3 || pa[1] !== 2 || pa[2] !== 1) throw new Error('reverse base functionality broken');
});

suite.runTest({ name: 'typed array sort - Int16Array' }, () => {
	const
		pa = Observable.from(new Int16Array([3, 2, 1])),
		events = [];

	Observable.observe(pa, eventsList => {
		[].push.apply(events, eventsList);
	});

	let sorted = pa.sort();

	if (sorted !== pa) throw new Error('sort base functionality broken');
	if (events.length !== 1) throw new Error('expected to have 1 event, found ' + events.length);
	if (events[0].type !== 'shuffle' || events[0].object !== pa) throw new Error('event 0 did not fire as expected');
	if (pa[0] !== 1 || pa[1] !== 2 || pa[2] !== 3) throw new Error('sort base functionality broken');

	sorted = pa.sort((a, b) => {
		return a < b ? 1 : -1;
	});
	if (sorted !== pa) throw new Error('sort base functionality broken');
	if (events.length !== 2) throw new Error('expected to have 2 events, found ' + events.length);
	if (events[1].type !== 'shuffle' || events[1].path.length !== 0 || events[1].object !== pa) throw new Error('event 1 did not fire as expected');
	if (pa[0] !== 3 || pa[1] !== 2 || pa[2] !== 1) throw new Error('sort base functionality broken');
});

suite.runTest({ name: 'typed array fill - Int32Array' }, () => {
	const
		pa = Observable.from(new Int32Array([1, 2, 3])),
		events = [];

	Observable.observe(pa, eventsList => {
		[].push.apply(events, eventsList);
	});

	const filled = pa.fill(256);
	if (filled !== pa) throw new Error('fill base functionality broken');
	if (events.length !== 3) throw new Error('expected to have 3 events, found ' + events.length);
	if (events[0].type !== 'update' || events[0].path.join('.') !== '0' || events[0].value !== 256 || events[0].oldValue !== 1 || events[0].object !== pa) throw new Error('event 0 did not fire as expected');
	if (events[1].type !== 'update' || events[1].path.join('.') !== '1' || events[1].value !== 256 || events[1].oldValue !== 2 || events[1].object !== pa) throw new Error('event 1 did not fire as expected');
	if (events[2].type !== 'update' || events[2].path.join('.') !== '2' || events[2].value !== 256 || events[2].oldValue !== 3 || events[2].object !== pa) throw new Error('event 2 did not fire as expected');
	events.splice(0);

	pa.fill(1024, 1, 3);
	if (events.length !== 2) throw new Error('expected to have 2 events, found ' + events.length);
	if (events[0].type !== 'update' || events[0].path.join('.') !== '1' || events[0].value !== 1024 || events[0].oldValue !== 256 || events[0].object !== pa) throw new Error('event 0 did not fire as expected');
	if (events[1].type !== 'update' || events[1].path.join('.') !== '2' || events[1].value !== 1024 || events[1].oldValue !== 256 || events[1].object !== pa) throw new Error('event 1 did not fire as expected');
	events.splice(0);

	pa.fill(9024, -1, 3);
	if (events.length !== 1) throw new Error('expected to have 1 events, found ' + events.length);
	if (events[0].type !== 'update' || events[0].path.join('.') !== '2' || events[0].value !== 9024 || events[0].oldValue !== 1024 || events[0].object !== pa) throw new Error('event 0 did not fire as expected');
	events.splice(0);

	//	simulating insertion of a new item into array (fill does not extend an array, so we may do it only on internal items)
	pa[1] = 0;
	pa.fill(12056, 1, 2);
	if (events.length !== 2) throw new Error('expected to have 2 events, found ' + events.length);
	if (events[0].type !== 'update' || events[0].path.join('.') !== '1' || events[0].value !== 0 || events[0].oldValue !== 1024 || events[0].object !== pa) throw new Error('event 0 did not fire as expected');
	if (events[1].type !== 'update' || events[1].path.join('.') !== '1' || events[1].value !== 12056 || events[1].oldValue !== 0 || events[1].object !== pa) throw new Error('event 1 did not fire as expected');
});

suite.runTest({ name: 'typed array set - Float32Array' }, () => {
	const
		pa = Observable.from(new Float32Array(8)),
		events = [];

	Observable.observe(pa, eventsList => {
		[].push.apply(events, eventsList);
	});

	//	basic set
	pa.set([1, 2, 3], 3);
	if (events.length !== 3) throw new Error('expected to have 3 events, found ' + events.length);
	if (events[0].type !== 'update' || events[0].path.join('.') !== '3' || events[0].value !== 1 || events[0].oldValue !== 0 || events[0].object !== pa) throw new Error('event 0 did not fire as expected');
	if (events[1].type !== 'update' || events[1].path.join('.') !== '4' || events[1].value !== 2 || events[1].oldValue !== 0 || events[1].object !== pa) throw new Error('event 1 did not fire as expected');
	if (events[2].type !== 'update' || events[2].path.join('.') !== '5' || events[2].value !== 3 || events[2].oldValue !== 0 || events[2].object !== pa) throw new Error('event 2 did not fire as expected');
	events.splice(0);

	//	set no offset - effectively 0
	pa.set([1, 1, 1]);
	if (events.length !== 3) throw new Error('expected to have 3 events, found ' + events.length);
	if (events[0].type !== 'update' || events[0].path.join('.') !== '0' || events[0].value !== 1 || events[0].oldValue !== 0 || events[0].object !== pa) throw new Error('event 0 did not fire as expected');
	if (events[1].type !== 'update' || events[1].path.join('.') !== '1' || events[1].value !== 1 || events[1].oldValue !== 0 || events[1].object !== pa) throw new Error('event 1 did not fire as expected');
	if (events[2].type !== 'update' || events[2].path.join('.') !== '2' || events[2].value !== 1 || events[2].oldValue !== 0 || events[2].object !== pa) throw new Error('event 2 did not fire as expected');
	events.splice(0);

	//	set from TypedArray
	pa.set(new Int8Array([5, 6, 7]), 2);
	if (events.length !== 3) throw new Error('expected to have 3 events, found ' + events.length);
	if (events[0].type !== 'update' || events[0].path.join('.') !== '2' || events[0].value !== 5 || events[0].oldValue !== 1 || events[0].object !== pa) throw new Error('event 0 did not fire as expected');
	if (events[1].type !== 'update' || events[1].path.join('.') !== '3' || events[1].value !== 6 || events[1].oldValue !== 1 || events[1].object !== pa) throw new Error('event 1 did not fire as expected');
	if (events[2].type !== 'update' || events[2].path.join('.') !== '4' || events[2].value !== 7 || events[2].oldValue !== 2 || events[2].object !== pa) throw new Error('event 2 did not fire as expected');
	events.splice(0);
});

suite.runTest({ name: 'typed array copyWithin - Float64Array' }, test => {
	const
		pa = Observable.from(new Float64Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])),
		events = [];

	Observable.observe(pa, eventsList => {
		[].push.apply(events, eventsList);
	});

	//	basic case
	let copied = pa.copyWithin(5, 7, 9);
	test.assertEqual(pa, copied);
	if (events.length !== 2) throw new Error('expected to have 2 events, found ' + events.length);
	if (events[0].type !== 'update' || events[0].path.join('.') !== '5' || events[0].value !== 7 || events[0].oldValue !== 5 || events[0].object !== pa) throw new Error('event 0 did not fire as expected');
	if (events[1].type !== 'update' || events[1].path.join('.') !== '6' || events[1].value !== 8 || events[1].oldValue !== 6 || events[1].object !== pa) throw new Error('event 1 did not fire as expected');
	events.splice(0);

	//	negative dest, missing end
	copied = pa.copyWithin(-2, 6);
	test.assertEqual(pa, copied);
	if (events.length !== 1) throw new Error('expected to have 1 events, found ' + events.length);
	//	we do not expect of 8, since 8 replaced with 8
	if (events[0].type !== 'update' || events[0].path.join('.') !== '9' || events[0].value !== 7 || events[0].oldValue !== 9 || events[0].object !== pa) throw new Error('event 1 did not fire as expected');
	events.splice(0);

	//	positive dest, missing start, end
	copied = pa.copyWithin(7);
	test.assertEqual(pa, copied);
	if (events.length !== 3) throw new Error('expected to have 3 events, found ' + events.length);
	if (events[0].type !== 'update' || events[0].path.join('.') !== '7' || events[0].value !== 0 || events[0].oldValue !== 7 || events[0].object !== pa) throw new Error('event 1 did not fire as expected');
	if (events[1].type !== 'update' || events[1].path.join('.') !== '8' || events[1].value !== 1 || events[1].oldValue !== 8 || events[1].object !== pa) throw new Error('event 1 did not fire as expected');
	if (events[2].type !== 'update' || events[2].path.join('.') !== '9' || events[2].value !== 2 || events[2].oldValue !== 7 || events[2].object !== pa) throw new Error('event 1 did not fire as expected');
	events.splice(0);
});

suite.runTest({ name: 'typed array as nested - Uint8Array' }, () => {
	const
		po = Observable.from({ a: new Uint8Array([1, 2, 3]) }),
		events = [];

	Observable.observe(po, eventsList => {
		[].push.apply(events, eventsList);
	});

	po.a[1] = 7;
	if (events.length !== 1) throw new Error('expected to have 1 event, found ' + events.length);
	if (events[0].type !== 'update' || events[0].path.join('.') !== 'a.1' || events[0].value !== 7 || events[0].oldValue !== 2 || events[0].object !== po.a) throw new Error('event 0 did not fire as expected');
});
