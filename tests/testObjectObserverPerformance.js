(function () {
	'use strict';

	var suite = window.Utils.JustTest.createSuite({ name: 'Testing ObjectObserver Load' });

	suite.addTest({ name: 'creating 10K observables' }, function (pass, fail) {
		var o = {
			name: 'name',
			age: 7,
			address: {
				street: {
					name: 'street name',
					apt: 123
				}
			}
		}, po;

		for (var i = 0; i < 10000; i++) {
			po = ObjectObserver.createObservable(o);
		}

		pass();
	});

	suite.run();
})();