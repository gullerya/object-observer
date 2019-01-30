import {Observable} from '../../dist/object-observer.js';

let suite = Utils.JustTest.createSuite({name: 'Testing Observable APIs'});

suite.addTest({name: 'ensure Observable object is frozen with only defined API'}, (pass, fail) => {
	if (typeof Observable !== 'function') fail('expected to find Observable function imported');
	if (typeof Observable.from !== 'function') fail('expected to find "from" function on Observable');
	if (typeof Observable.isObservable !== 'function') fail('expected to find "isObservable" function on Observable');
	try {
		Observable.some = 'prop';
		if (Observable.some) fail('expected Observable to be frozen');
		pass();
	} catch (e) {
		pass();
	}
});

suite.addTest({name: 'negative tests - invalid parameters'}, (pass, fail) => {
	let bo,
		safeToContinue = false;
	try {
		Observable.from(bo);
	} catch (e) {
		safeToContinue = true;
	}
	if (!safeToContinue) fail('expected to catch error on undefined parameter');

	bo = null;
	safeToContinue = false;
	try {
		Observable.from(bo);
	} catch (e) {
		safeToContinue = true;
	}
	if (!safeToContinue) fail('expected to catch error on null parameter');

	bo = true;
	safeToContinue = false;
	try {
		Observable.from(bo);
	} catch (e) {
		safeToContinue = true;
	}
	if (!safeToContinue) fail('expected to catch error on boolean parameter');

	bo = 1;
	safeToContinue = false;
	try {
		Observable.from(bo);
	} catch (e) {
		safeToContinue = true;
	}
	if (!safeToContinue) fail('expected to catch error on number parameter');

	bo = 'string';
	safeToContinue = false;
	try {
		Observable.from(bo);
	} catch (e) {
		safeToContinue = true;
	}
	if (!safeToContinue) fail('expected to catch error on string parameter');

	bo = function () {
	};
	safeToContinue = false;
	try {
		Observable.from(bo);
	} catch (e) {
		safeToContinue = true;
	}
	if (!safeToContinue) fail('expected to catch error on function parameter');

	bo = {
		observe: null
	};
	safeToContinue = false;
	try {
		Observable.from(bo);
	} catch (e) {
		safeToContinue = true;
	}
	if (!safeToContinue) fail('expected to catch error on object parameter having "observe" key defined');

	bo = {
		unobserve: null
	};
	safeToContinue = false;
	try {
		Observable.from(bo);
	} catch (e) {
		safeToContinue = true;
	}
	if (!safeToContinue) fail('expected to catch error on object parameter having "unobserve" key defined');

	pass();
});

suite.addTest({name: 'isObservable tests'}, (pass, fail) => {
	if (Observable.isObservable('some')) fail('expected to have negative result when non-object tested');
	if (Observable.isObservable(null)) fail('expected to have negative result when NULL object tested');
	if (Observable.isObservable({})) fail('expected to have negative result when {} object tested');
	if (!Observable.isObservable(Observable.from({}))) fail('expected to have positive result when truly Observable tested');

	let oo = Observable.from({nested: {}});
	if (!Observable.isObservable(oo)) fail('expected Observable to be detected as indeed Observable');
	if (Observable.isObservable(oo.nested)) fail('inner objects from observable graph should not be considered as observables themselves');

	pass();
});

suite.addTest({name: 'test observable APIs presence on object/array'}, (pass, fail) => {
	let o = {}, a = [], oo, aa;

	oo = Observable.from(o);

	if (typeof oo.revoke !== 'function') fail('expected to find "revoke" function on the created Observable');
	if (typeof oo.observe !== 'function') fail('expected to find "observe" function on the created Observable');
	if (typeof oo.unobserve !== 'function') fail('expected to find "unobserve" function on the created Observable');

	aa = Observable.from(a);

	if (typeof aa.revoke !== 'function') fail('expected to find "revoke" function on the created Observable');
	if (typeof aa.observe !== 'function') fail('expected to find "observe" function on the created Observable');
	if (typeof aa.unobserve !== 'function') fail('expected to find "unobserve" function on the created Observable');

	pass();
});

suite.addTest({name: 'test observable APIs - ensure APIs are not enumerables'}, (pass, fail) => {
	let o = {}, a = [], oo, aa;

	oo = Observable.from(o);

	if (Object.keys(oo).length) fail('expected to not see any enumerable keys on the empty observable object');

	aa = Observable.from(a);

	if (Object.keys(aa).length) fail('expected to not see any enumerable keys on the empty observable array');

	pass();
});

suite.addTest({name: 'test observable APIs - nested objects/arrays have no observable APIs'}, (pass, fail) => {
	let o = {n: {}}, a = [[]], oo, aa;

	oo = Observable.from(o);

	if (typeof oo.n.revoke === 'function' || typeof oo.n.observe === 'function' || typeof oo.n.unobserve === 'function') fail('expected to not see any APIs on the nested object of observable object');

	aa = Observable.from(a);

	if (typeof aa[0].revoke === 'function' || typeof aa[0].observe === 'function' || typeof aa[0].unobserve === 'function') fail('expected to not see any APIs on the nested array of observable array');

	pass();
});

suite.addTest({name: 'test observable APIs - Observable can not be used via constructor'}, (pass, fail) => {
	try {
		let o = new Observable();
		fail('should not get to this point');
	} catch (e) {
		pass();
	}
});

suite.run();
