(function () {
	'use strict';

	var suite = window.Utils.JustTest.createSuite({ name: 'Testing Observable - subgraphs' });

	suite.addTest({ name: 'inner object from observable should fire events as usual' }, function (pass, fail) {
		var o = { inner: { prop: 'more' } },
			oo = Observable.from(o),
			iop = oo.inner,
			events = [],
			observer = function (changes) { events.push.apply(events, changes); };

		oo.observe(observer);
		iop.prop = 'else';
		iop.new = 'prop';

		if (events.length !== 2) fail('expected 2 callbacks on inner observer graph (subgraph), but found ' + events.length);
		if (events[0].type !== 'update' || events[0].path.join('.') !== 'inner.prop' || events[0].oldValue !== 'more' || events[0].value !== 'else') fail('event 0 did not fire as expected');
		if (events[1].type !== 'insert' || events[1].path.join('.') !== 'inner.new' || typeof events[1].oldValue !== 'undefined' || events[1].value !== 'prop') fail('event 1 did not fire as expected');

		pass();
	});

	suite.addTest({ name: 'removal (detaching) of inner object from observable should disable it\'s proxy/events generating' }, function (pass, fail) {
		var o = { inner: { prop: 'more' } },
			oo = Observable.from(o),
			iop = oo.inner,
			cntr = 0,
			observer = function () { cntr++; };

		oo.observe(observer);
		iop.prop = 'text';
		if (cntr !== 1) fail('preliminary check failed, observer expected to be called 1 time, called ' + cntr);

		oo.inner = null;
		cntr = 0;
		try {
			iop.prop = 'again';
			fail('the flow should fail before this line on revoked proxy set');
		} catch (e) {
			if (!e || !(e instanceof TypeError)) fail('expected to have TypeError while setting revoked proxy');
		}
		if (cntr > 0) fail('observer expected NOT to be called when removed inner object changed, but called ' + cntr);

		pass();
	});

	suite.run();
})();