(function () {
	'use strict';

	var suite = window.Utils.JustTest.createSuite({ name: 'Testing DataObserver' }), observer = new DataObserver();

	if (observer.details.description.indexOf('Proxy') < 0) {
		console.info('data observer not of a Proxy implementation - skipping non relevant tests');
		return;
	}

	suite.addTest({ name: 'test A - plain object operations' }, function (pass, fail) {
		var o = {
			name: 'name',
			age: 7,
			address: null
		}, po, events = [], tmpAddress = { street: 'some' };

		po = observer.getObserved(o, function (path, value, oldValue) {
			events.push({
				p: path,
				v: value,
				o: oldValue
			});
		});

		po.name = 'new name';
		po.age = 9;
		po.address = tmpAddress;
		po.address = null;
		po.sex = 'male';
		delete po.sex;

		if (events.length !== 6) fail('expected to have 6 data change events but counted ' + events.length);
		if (events[0].p !== 'name' || events[0].o !== 'name' || events[0].v !== 'new name') fail('event 0 did not fire as expected');
		if (events[1].p !== 'age' || events[1].o !== 7 || events[1].v !== 9) fail('event 1 did not fire as expected');
		if (events[2].p !== 'address' || events[2].o !== null || events[2].v !== tmpAddress) fail('event 2 did not fire as expected');
		if (events[3].p !== 'address' || events[3].v !== null) fail('event 3 did not fire as expected');
		if (events[4].p !== 'sex' || typeof events[4].o !== 'undefined' || events[4].v !== 'male') fail('event 4 did not fire as expected');
		if (events[5].p !== 'sex' || events[5].o !== 'male' || typeof events[5].v !== 'undefined') fail('event 5 did not fire as expected');

		pass();
	});

	suite.addTest({ name: 'test A - sub tree object operations' }, function (pass, fail) {
		var o = {
			name: 'name',
			age: 7,
			address: null
		}, po, events = [], newAddress = {};

		po = observer.getObserved(o, function (path, value, oldValue) {
			events.push({
				p: path,
				v: value,
				o: oldValue
			});
		});

		po.address = newAddress;
		po.address.street = 'street';

		if (events.length !== 2) fail('expected to have 2 data change events but counted ' + events.length);
		if (events[0].p !== 'address' || events[0].o !== null || events[0].v !== newAddress) fail('event 0 did not fire as expected');
		if (events[1].p !== 'address.street' || typeof events[1].o !== 'undefined' || events[1].v !== 'street') fail('event 1 did not fire as expected');

		pass();
	});

	suite.run();
})();