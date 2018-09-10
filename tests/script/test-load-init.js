(function() {
	'use strict';

	let suite = Utils.JustTest.createSuite({name: 'Testing loading/initialization flavors'});

	suite.addTest({name: 'test A - regular script import'}, function(pass, fail) {
		if (typeof window.Observable !== 'function') fail('expected to find Observable c~tor on global scope');

		pass();
	});

	suite.addTest({name: 'test B - custom namespace import'}, function(pass, fail) {
		var customNamespace = {};

		fetch('../../src/object-observer.js')
			.then(function(response) {
				if (response.status === 200) {
					response.text()
						.then(function(code) {
							Function(code).call(customNamespace);
							if (typeof customNamespace.Observable !== 'function') fail('expected to find Observable c~tor on custom scope');

							pass();
						})
						.catch(fail);
				} else {
					fail('failed to fetch the code: ' + response.status);
				}
			})
			.catch(fail);
	});

	suite.run();
})();