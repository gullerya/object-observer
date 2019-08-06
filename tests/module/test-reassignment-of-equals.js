import { Observable } from '../../dist/object-observer.js';

let suite = Utils.JustTest.createSuite({ name: 'Testing reassignment of equal values' });

suite.addTest({ name: 'boolean' }, (pass, fail) => {
	let oo = Observable.from({ p: true }),
		changes = null;
	oo.observe(cs => changes = cs);

	oo.p = true;
	if (changes !== null) fail('expected no events to be fired when strictly equal assigment performed');

	pass();
});

suite.addTest({ name: 'number' }, (pass, fail) => {
	let oo = Observable.from({ p: 6 }),
		changes = null;
	oo.observe(cs => changes = cs);

	oo.p = 6;
	if (changes !== null) fail('expected no events to be fired when strictly equal assigment performed');

	pass();
});

suite.addTest({ name: 'string' }, (pass, fail) => {
	let oo = Observable.from({ p: 'text' }),
		changes = null;
	oo.observe(cs => changes = cs);

	oo.p = 'text';
	if (changes !== null) fail('expected no events to be fired when strictly equal assigment performed');

	pass();
});

suite.addTest({ name: 'function' }, (pass, fail) => {
	let f = function () { },
		oo = Observable.from({ p: f }),
		changes = null;
	oo.observe(cs => changes = cs);

	oo.p = f;
	if (changes !== null) fail('expected no events to be fired when strictly equal assigment performed');

	pass();
});

suite.addTest({ name: 'Symbol' }, (pass, fail) => {
	let s = Symbol('some'),
		oo = Observable.from({ p: s }),
		changes = null;
	oo.observe(cs => changes = cs);

	oo.p = s;
	if (changes !== null) fail('expected no events to be fired when strictly equal assigment performed');

	pass();
});

suite.run();
