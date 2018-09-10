import Observable from '../../dist/module/object-observer.js';

let suite = Utils.JustTest.createSuite({name: 'Testing loading/initialization flavors'});

suite.addTest({name: 'test A - regular script import'}, function(pass, fail) {
	if (typeof Observable !== 'function') fail('expected to find Observable c~tor on global scope');

	pass();
});

suite.run();