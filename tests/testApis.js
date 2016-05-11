(function () {
	'use strict';

	var suite = window.Utils.JustTest.createSuite({ name: 'Testing ObjectObserver APIs' });

	suite.addTest({ name: 'test A' }, function (pass, fail) {
		if (typeof ObjectObserver !== 'object') fail('expected to find ObjectObserver on global scope');
		if (typeof ObjectObserver.observableFrom !== 'function') fail('expected to find "observableFrom" function on ObjectObserver');

		pass();
	});

	suite.addTest({ name: 'negative tests - invalid parameters' }, function (pass, fail) {
		var bo,
			safeToContinue = false;
		try {
			ObjectObserver.observableFrom(bo);
		} catch (e) {
			safeToContinue = true;
		}
		if (!safeToContinue) fail('expected to catch error on undefined parameter');

		bo = null;
		safeToContinue = false;
		try {
			ObjectObserver.observableFrom(bo);
		} catch (e) {
			safeToContinue = true;
		}
		if (!safeToContinue) fail('expected to catch error on null parameter');

		bo = true;
		safeToContinue = false;
		try {
			ObjectObserver.observableFrom(bo);
		} catch (e) {
			safeToContinue = true;
		}
		if (!safeToContinue) fail('expected to catch error on boolean parameter');

		bo = 1;
		safeToContinue = false;
		try {
			ObjectObserver.observableFrom(bo);
		} catch (e) {
			safeToContinue = true;
		}
		if (!safeToContinue) fail('expected to catch error on number parameter');

		bo = 'string';
		safeToContinue = false;
		try {
			ObjectObserver.observableFrom(bo);
		} catch (e) {
			safeToContinue = true;
		}
		if (!safeToContinue) fail('expected to catch error on string parameter');

		bo = function () { };
		safeToContinue = false;
		try {
			ObjectObserver.observableFrom(bo);
		} catch (e) {
			safeToContinue = true;
		}
		if (!safeToContinue) fail('expected to catch error on function parameter');

		bo = {
			observe: null
		};
		safeToContinue = false;
		try {
			ObjectObserver.observableFrom(bo);
		} catch (e) {
			safeToContinue = true;
		}
		if (!safeToContinue) fail('expected to catch error on object parameter having "observe" key defined');

		bo = {
			unobserve: null
		};
		safeToContinue = false;
		try {
			ObjectObserver.observableFrom(bo);
		} catch (e) {
			safeToContinue = true;
		}
		if (!safeToContinue) fail('expected to catch error on object parameter having "unobserve" key defined');

		pass();
	});

	suite.addTest({ name: 'test observable APIs' }, function (pass, fail) {
		var o = {},
			oo;

		oo = ObjectObserver.observableFrom(o);

		if (typeof oo.observe !== 'function') fail('expected to find "observe" function on created observable');
		if (typeof oo.unobserve !== 'function') fail('expected to find "unobserve" function on created observable');

		pass();
	});

	suite.run();
})();