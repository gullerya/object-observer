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
		oou = Observable.from(oo.user, { experiments: { nestedObservable: true } }),
		ooua = Observable.from(oo.user.address, { experiments: { nestedObservable: true } });

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
		}, { experiments: { nestedObservable: true } }
	),
		oou = Observable.from(oo.user, { experiments: { nestedObservable: true } }),
		ooua = Observable.from(oo.user.address, { experiments: { nestedObservable: true } });

	test.assertTrue('observe' in oou);
	test.assertTrue('unobserve' in oou);
	test.assertTrue('observe' in ooua);
	test.assertTrue('unobserve' in ooua);
});
