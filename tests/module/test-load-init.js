import {Observable} from '../../dist/object-observer.js';

let suite = Utils.JustTest.createSuite({name: 'Testing loading/initialization flavors'});

suite.addTest({name: 'test A - regular script import'}, (pass, fail) => {
	if (typeof Observable !== 'function') fail('expected to find Observable c~tor on global scope');

	pass();
});

suite.run();