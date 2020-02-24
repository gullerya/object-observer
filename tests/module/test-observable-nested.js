import { getSuite } from '../../node_modules/just-test/dist/just-test.min.js';
import { Observable } from '../../dist/object-observer.js';

const suite = getSuite({ name: 'Testing nested observable' });

suite.runTest({ name: 'nested of observable should be observable too' }, test => {
	let oo = Observable.from({
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
	let oo = Observable.from(
		{
			user: {
				address: {
					street: 'street',
					block: 'block',
					city: 'city'
				}
			}
		}),
		oou = Observable.from(oo.user),
		ooua = Observable.from(oo.user.address);

	test.assertEqual(oo.user, oou);
	test.assertEqual(oo.user.address, oou.address);
	test.assertEqual(oo.user.address, ooua);
	test.assertEqual(oou.address, ooua);
});

suite.runTest({ name: 'observable from nested can be observed' }, test => {
	let oo = Observable.from(
		{
			user: {
				address: {
					street: 'street',
					block: 'block',
					city: 'city'
				}
			}
		}),
		oou = Observable.from(oo.user),
		ooua = Observable.from(oo.user.address);

	test.assertTrue('observe' in oou);
	test.assertTrue('unobserve' in oou);
	test.assertTrue('observe' in ooua);
	test.assertTrue('unobserve' in ooua);

	const rootEvents = [];
	const rootObs = changes => Array.prototype.push.apply(rootEvents, changes);
	const nestedEvents = [];
	const nestedObs = changes => Array.prototype.push.apply(nestedEvents, changes);

	oou.observe(nestedObs);
	oou.address.city = 'cityA';
	test.assertEqual(1, nestedEvents.length);

	oo.observe(rootObs);
	oo.user.address.city = 'cityB';
	test.assertEqual(1, rootEvents.length);
	test.assertEqual(2, nestedEvents.length);

	oou.address.city = 'cityC';
	test.assertEqual(2, rootEvents.length);
	test.assertEqual(3, nestedEvents.length);

	oou.unobserve(nestedObs);
	oou.address.city = 'cityD';
	test.assertEqual(3, rootEvents.length);
	test.assertEqual(3, nestedEvents.length);

	oou.observe(nestedObs);
	oou.address.city = 'cityE';
	test.assertEqual(4, rootEvents.length);
	test.assertEqual(4, nestedEvents.length);

	oou.unobserve();
	oou.address.city = 'cityF';
	test.assertEqual(5, rootEvents.length);
	test.assertEqual(4, nestedEvents.length);
});

suite.runTest({ name: 'nested observable should handle errors', expectError: 'observer parameter MUST be a function' }, () => {
	let oo = Observable.from(
		{
			user: {
				address: {
					street: 'street',
					block: 'block',
					city: 'city'
				}
			}
		}),
		oou = Observable.from(oo.user);

	oou.observe('invalid observer');
});

suite.runTest({ name: 'nested observable should handle duplicate' }, test => {
	let oo = Observable.from(
		{
			user: {
				address: {
					street: 'street',
					block: 'block',
					city: 'city'
				}
			}
		}),
		oou = Observable.from(oo.user),
		events = [],
		observer = changes => Array.prototype.push.apply(events, changes);

	oou.observe(observer);
	oou.observe(observer);
	oou.address.street = 'streetA';
	test.assertEqual(1, events.length);
});