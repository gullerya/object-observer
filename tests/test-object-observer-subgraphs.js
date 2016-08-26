(function () {
	'use strict';

	var suite = window.Utils.JustTest.createSuite({ name: 'Testing Observable - subgraphs' });


	suite.addTest({ name: 'removal of inner object from observable should disable it\'s proxy' }, function (pass, fail) {
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
		iop.prop = 'again';
		if (cntr > 0) fail('observer expected NOT to be called when removed inner object changed, but called ' + cntr);

		pass();
	});

	suite.run();
})();