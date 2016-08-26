(function () {
	'use strict';

	var suite = window.Utils.JustTest.createSuite({ name: 'Testing unobserving/removal of observed object' });

	suite.addTest({ name: 'test unobserve - single observer - explicit unobserve' }, function (pass, fail) {
		var o = { some: 'text' },
			oo = Observable.from(o),
			cntr = 0,
			observer = function () { cntr++; };

		oo.observe(observer);

		oo.some = 'thing';
		if (cntr !== 1) fail('preliminary check failed - observer was not invoked');

		cntr = 0;
		oo.unobserve(observer);
		oo.some = 'true';
		if (cntr > 0) fail('unobserve failed, expected 0 callbacks, found ' + cntr);

		pass();
	});

	suite.addTest({ name: 'test unobserve - few observers - explicit unobserve' }, function (pass, fail) {
		var o = { some: 'text' },
			oo = Observable.from(o),
			cntrA = 0,
			cntrB = 0,
			observerA = function () { cntrA++; },
			observerB = function () { cntrB++; };

		oo.observe(observerA);
		oo.observe(observerB);

		oo.some = 'thing';
		if (cntrA !== 1) fail('preliminary check failed - observerA was not invoked');
		if (cntrB !== 1) fail('preliminary check failed - observerB was not invoked');

		cntrA = 0;
		cntrB = 0;
		oo.unobserve(observerA);
		oo.some = 'true';
		if (cntrA > 0) fail('unobserve failed, expected 0 callbacks for unobserved, found ' + cntr);
		if (cntrB !== 1) fail('unobserve failed, expected 1 callback for the left alone after unobserve, found ' + cntr);

		cntrA = 0;
		cntrB = 0;
		oo.unobserve(observerB);
		oo.some = 'back';
		if (cntrA > 0) fail('unobserve failed, expected 0 callbacks for unobserved, found ' + cntr);
		if (cntrB > 0) fail('unobserve failed, expected 0 callbacks for unobserved, found ' + cntr);

		pass();
	});

	suite.addTest({ name: 'test unobserve - unobserve few' }, function (pass, fail) {
		var o = { some: 'text' },
			oo = Observable.from(o),
			cntrA = 0,
			cntrB = 0,
			observerA = function () { cntrA++; },
			observerB = function () { cntrB++; };

		oo.observe(observerA);
		oo.observe(observerB);

		oo.some = 'thing';
		if (cntrA !== 1) fail('preliminary check failed - observerA was not invoked');
		if (cntrB !== 1) fail('preliminary check failed - observerB was not invoked');

		cntrA = 0;
		cntrB = 0;
		oo.unobserve(observerA, observerB);
		oo.some = 'true';
		if (cntrA > 0) fail('unobserve failed, expected 0 callbacks for unobserved, found ' + cntr);
		if (cntrB > 0) fail('unobserve failed, expected 0 callbacks for unobserved, found ' + cntr);

		pass();
	});

	suite.addTest({ name: 'test unobserve - unobserve all' }, function (pass, fail) {
		var o = { some: 'text' },
			oo = Observable.from(o),
			cntrA = 0,
			cntrB = 0,
			observerA = function () { cntrA++; },
			observerB = function () { cntrB++; };

		oo.observe(observerA);
		oo.observe(observerB);

		oo.some = 'thing';
		if (cntrA !== 1) fail('preliminary check failed - observerA was not invoked');
		if (cntrB !== 1) fail('preliminary check failed - observerB was not invoked');

		cntrA = 0;
		cntrB = 0;
		oo.unobserve();
		oo.some = 'true';
		if (cntrA > 0) fail('unobserve failed, expected 0 callbacks for unobserved, found ' + cntr);
		if (cntrB > 0) fail('unobserve failed, expected 0 callbacks for unobserved, found ' + cntr);

		pass();
	});

	suite.addTest({ name: 'test unobserve - observe, unobserve and observe again' }, function (pass, fail) {
		var o = { some: 'text' },
			oo = Observable.from(o),
			cntr = 0,
			observer = function () { cntr++; };

		oo.observe(observer);
		oo.some = 'thing';
		if (cntr !== 1) fail('preliminary check failed - observer was not invoked');

		oo.unobserve();
		oo.some = 'true';
		if (cntr !== 1) fail('unobserve failed, expected callbacks for unobserved to remain 1, found ' + cntr);

		oo.observe(observer);
		oo.some = 'again';
		if (cntr !== 2) fail('preliminary check failed - observer was not invoked being added anew');

		pass();
	});

	suite.run();
})();