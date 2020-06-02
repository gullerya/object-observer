import { getSuite } from '../../node_modules/just-test/dist/just-test.min.js';
import { Observable } from '../../dist/object-observer.js';

const suite = getSuite({ name: 'Testing ObjectObserver - arrays' });

suite.runTest({ name: 'array copyWithin - primitives' }, test => {
	let a = [1, 2, 3, 4, 5, 6],
		pa,
		copied,
		events = [],
		callbacks = 0;
	pa = Observable.from(a);
	pa.observe(eventsList => {
		[].push.apply(events, eventsList);
		callbacks++;
	});

	copied = pa.copyWithin(2, 0, 3);
	test.assertEqual(pa, copied);
	if (events.length !== 3) throw new Error('expected to have 3 events, found ' + events.length);
	if (callbacks !== 1) throw new Error('expected to have 1 callback, found ' + callbacks);
	if (events[0].type !== 'update' || events[0].path.join('.') !== '2' || events[0].value !== 1 || events[0].oldValue !== 3 || events[0].object !== pa) throw new Error('event 0 did not fire as expected');
	if (events[1].type !== 'update' || events[1].path.join('.') !== '3' || events[1].value !== 2 || events[1].oldValue !== 4 || events[1].object !== pa) throw new Error('event 1 did not fire as expected');
	if (events[2].type !== 'update' || events[2].path.join('.') !== '4' || events[2].value !== 3 || events[2].oldValue !== 5 || events[2].object !== pa) throw new Error('event 1 did not fire as expected');
	events.splice(0);
	callbacks = 0;

	//  pa = [1,2,1,2,3,6]
	copied = pa.copyWithin(-3);
	test.assertEqual(pa, copied);
	if (events.length !== 3) throw new Error('expected to have 3 events, found ' + events.length);
	if (callbacks !== 1) throw new Error('expected to have 1 callback, found ' + callbacks);
	if (events[0].type !== 'update' || events[0].path.join('.') !== '3' || events[0].value !== 1 || events[0].oldValue !== 2 || events[0].object !== pa) throw new Error('event 0 did not fire as expected');
	if (events[1].type !== 'update' || events[1].path.join('.') !== '4' || events[1].value !== 2 || events[1].oldValue !== 3 || events[1].object !== pa) throw new Error('event 1 did not fire as expected');
	if (events[2].type !== 'update' || events[2].path.join('.') !== '5' || events[2].value !== 1 || events[2].oldValue !== 6 || events[2].object !== pa) throw new Error('event 2 did not fire as expected');
	events.splice(0);
	callbacks = 0;

	//  pa = [1,2,1,1,2,1]
	copied = pa.copyWithin(1, -3, 9);
	test.assertEqual(pa, copied);
	if (events.length !== 2) throw new Error('expected to have 2 events, found ' + events.length);
	if (callbacks !== 1) throw new Error('expected to have 1 callback, found ' + callbacks);
	if (events[0].type !== 'update' || events[0].path.join('.') !== '1' || events[0].value !== 1 || events[0].oldValue !== 2 || events[0].object !== pa) throw new Error('event 0 did not fire as expected');
	if (events[1].type !== 'update' || events[1].path.join('.') !== '2' || events[1].value !== 2 || events[1].oldValue !== 1 || events[1].object !== pa) throw new Error('event 1 did not fire as expected');
	//	update at index 4 should not be evented, since 1 === 1
	events.splice(0);
	callbacks = 0;
});

suite.runTest({ name: 'array copyWithin - objects' }, test => {
	let a = [{ text: 'a' }, { text: 'b' }, { text: 'c' }, { text: 'd' }],
		pa,
		copied,
		detached,
		events = [];
	pa = Observable.from(a);
	pa.observe(eventsList => {
		[].push.apply(events, eventsList);
	});

	detached = pa[1];
	copied = pa.copyWithin(1, 2, 3);
	test.assertEqual(pa, copied);
	if (events.length !== 1) throw new Error('expected to have 1 events, found ' + events.length);
	if (events[0].type !== 'update' || events[0].path.join('.') !== '1' || events[0].value.text !== 'c' || events[0].oldValue.text !== 'b' || events[0].object !== pa) throw new Error('event 0 did not fire as expected');
	events.splice(0);

	pa[1].text = 'B';
	pa[2].text = 'D';
	if (events.length !== 2) throw new Error('expected to have 2 events, found ' + events.length);
	if (events[0].type !== 'update' || events[0].path.join('.') !== '1.text' || events[0].value !== 'B' || events[0].oldValue !== 'c' || events[0].object !== pa[1]) throw new Error('event 0 did not fire as expected');
	if (events[1].type !== 'update' || events[1].path.join('.') !== '2.text' || events[1].value !== 'D' || events[1].oldValue !== 'c' || events[1].object !== pa[2]) throw new Error('event 1 did not fire as expected');
	events.splice(0);

	detached.observe(eventsList => {
		[].push.apply(events, eventsList);
	});
	detached.text = '1';
	test.assertEqual(events.length, 1);
	if (events[0].type !== 'update' || events[0].path.join('.') !== 'text' || events[0].value !== '1' || events[0].oldValue !== 'b' || events[0].object !== detached) throw new Error('event 0 did not fire as expected');
});

suite.runTest({ name: 'array copyWithin - arrays' }, () => {
	let a = [{ text: 'a' }, { text: 'b' }, { text: 'c' }, { text: 'd' }],
		pa,
		spliced,
		events = [];
	pa = Observable.from(a);
	pa.observe(eventsList => {
		[].push.apply(events, eventsList);
	});

	pa.splice(1, 2, [{ text: '1' }]);
	if (events.length !== 2) throw new Error('expected to have 2 events, found ' + events.length);
	if (events[0].type !== 'update' || events[0].path.join('.') !== '1' || events[0].value[0].text !== '1' || events[0].oldValue.text !== 'b' || events[0].object !== pa) throw new Error('event 0 did not fire as expected');
	if (events[1].type !== 'delete' || events[1].path.join('.') !== '2' || events[1].oldValue.text !== 'c' || events[1].object !== pa) throw new Error('event 1 did not fire as expected');
	events.splice(0);

	pa[1][0].text = 'B';
	pa[2].text = 'D';
	if (events.length !== 2) throw new Error('expected to have 2 events, found ' + events.length);
	if (events[0].type !== 'update' || events[0].path.join('.') !== '1.0.text' || events[0].value !== 'B' || events[0].oldValue !== '1' || events[0].object !== pa[1][0]) throw new Error('event 0 did not fire as expected');
	if (events[1].type !== 'update' || events[1].path.join('.') !== '2.text' || events[1].value !== 'D' || events[1].oldValue !== 'd' || events[1].object !== pa[2]) throw new Error('event 1 did not fire as expected');
	events.splice(0);

	spliced = pa.splice(1, 1, { text: 'A' }, [{ text: 'B' }]);
	if (events.length !== 2) throw new Error('expected to have 2 events, found ' + events.length);
	if (spliced.length !== 1) throw new Error('expected to have 1 spliced object');
	if (spliced[0].length !== 1 || spliced[0][0].text !== 'B') throw new Error('spliced object is not as expected');
	if (events[0].type !== 'update' || events[0].path.join('.') !== '1' || events[0].value.text !== 'A' || events[0].oldValue[0].text !== 'B' || events[0].object !== pa) throw new Error('event 0 did not fire as expected');
	if (events[1].type !== 'insert' || events[1].path.join('.') !== '2' || events[1].value[0].text !== 'B' || typeof events[1].oldValue !== 'undefined' || events[1].object !== pa) throw new Error('event 1 did not fire as expected');
	events.splice(0);

	pa[3].text = 'C';
	if (events.length !== 1) throw new Error('expected to have 1 events, found ' + events.length);
	if (events[0].type !== 'update' || events[0].path.join('.') !== '3.text' || events[0].value !== 'C' || events[0].oldValue !== 'D' || events[0].object !== pa[3]) throw new Error('event 0 did not fire as expected');
});