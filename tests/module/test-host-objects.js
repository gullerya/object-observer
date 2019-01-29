import {Observable} from '../../dist/object-observer.js';

let suite = Utils.JustTest.createSuite({name: 'Testing host object (native)'});

suite.addTest({name: 'test DOMStringMap'}, function (pass, fail) {
	let e = document.createElement('div'),
		oo = Observable.from(e.dataset),
		events = [],
		observer = changes => {
			events.push.apply(events, changes);
		};

	oo.observe(observer);

	oo.some = 'thing';

	pass();
});

suite.run();
