(function () {
	'use strict';

	var suite = window.Utils.JustTest.createSuite({ name: 'Testing ObjectObserver APIs' });

	suite.addTest({ name: 'test A' }, function (pass, fail) {
		if (typeof ObjectObserver !== 'object') fail('expected to find ObjectObserver on global scope');
		if (typeof ObjectObserver.createObservable !== 'function') fail('expected to find "createObservable" function on ObjectObserver');
		if (typeof ObjectObserver.observe !== 'function') fail('expected to find "observe" function on ObjectObserver');
		if (typeof ObjectObserver.unobserve !== 'function') fail('expected to find "unobserve" function on ObjectObserver');

		pass();
	});

	suite.run();
})();