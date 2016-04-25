(function () {
	'use strict';

	var suite = window.Utils.JustTest.createSuite({ name: 'Testing ObjectObserver' });

	suite.addTest({ name: 'creating observable remain original object as is' }, function (pass, fail) {
		var person = {
			name: 'name',
			age: 7
		},
		address = { city: 'city' },
		street = { name: 'street', apt: 234 },
		po;

		address.street = street;
		person.address = address;

		po = ObjectObserver.createObservable(person);

		if (person.address !== address) {
			fail('internal address object should remain the same');
		}
		if (address.street !== street) {
			fail('internal street object should remain the same');
		}

		pass();
	});

	suite.addTest({ name: 'plain object operations' }, function (pass, fail) {
		var o = {
			name: 'name',
			age: 7,
			address: null
		}, po, events = [], tmpAddress = { street: 'some' };

		po = ObjectObserver.createObservable(o);
		ObjectObserver.observe(po, function (changes) {
			[].push.apply(events, changes);
		});

		po.name = 'new name';
		po.age = 9;
		po.address = tmpAddress;
		po.address = null;
		po.sex = 'male';
		delete po.sex;

		if (events.length !== 6) {
			fail('expected to have 6 data change events but counted ' + events.length);
		}
		if (events[0].path !== 'name' || events[0].oldValue !== 'name' || events[0].value !== 'new name') {
			fail('event 0 did not fire as expected');
		}
		if (events[1].path !== 'age' || events[1].oldValue !== 7 || events[1].value !== 9) {
			fail('event 1 did not fire as expected');
		}
		if (events[2].path !== 'address' || events[2].oldValue !== null || events[2].value !== tmpAddress) {
			fail('event 2 did not fire as expected');
		}
		if (events[3].path !== 'address' || events[3].value !== null) {
			fail('event 3 did not fire as expected');
		}
		if (events[4].path !== 'sex' || typeof events[4].oldValue !== 'undefined' || events[4].value !== 'male') {
			fail('event 4 did not fire as expected');
		}
		if (events[5].path !== 'sex' || events[5].oldValue !== 'male' || typeof events[5].value !== 'undefined') {
			fail('event 5 did not fire as expected');
		}

		pass();
	});

	suite.addTest({ name: 'sub tree object operations' }, function (pass, fail) {
		var o = {
			name: 'name',
			age: 7,
			address: null,
			addressB: {
				street: {
					name: 'street name',
					apt: 123
				}
			}
		}, po, events = [], newAddress = {};

		po = ObjectObserver.createObservable(o);
		ObjectObserver.observe(po, function (changes) {
			[].push.apply(events, changes);
		});

		po.address = newAddress;
		po.address.street = 'street';
		po.addressB.street.name = 'new street name';

		if (events.length !== 3) {
			fail('expected to have 3 data change events but counted ' + events.length);
		}
		if (events[0].path !== 'address' || events[0].oldValue !== null || events[0].value !== newAddress) {
			fail('event 0 did not fire as expected');
		}
		if (events[1].path !== 'address.street' || typeof events[1].oldValue !== 'undefined' || events[1].value !== 'street') {
			fail('event 1 did not fire as expected');
		}
		if (events[2].path !== 'addressB.street.name' || events[2].oldValue !== 'street name' || events[2].value !== 'new street name') {
			fail('event 2 did not fire as expected');
		}

		pass();
	});

	suite.run();
})();