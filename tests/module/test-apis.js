import Observable from '../../dist/module/object-observer.js';

let suite = Utils.JustTest.createSuite({name: 'Testing Observable APIs'});

suite.addTest({name: 'test A'}, function(pass, fail) {
	if (typeof Observable !== 'function') fail('expected to find Observable c~tor on global scope');
	if (typeof Observable.from !== 'function') fail('expected to find "from" function on Observable');

	pass();
});

suite.addTest({name: 'negative tests - invalid parameters'}, function(pass, fail) {
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

	bo = function() { };
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

suite.addTest({name: 'test observable APIs presence on object/array'}, function(pass, fail) {
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

suite.addTest({name: 'test observable APIs - ensure APIs are not enumerables'}, function(pass, fail) {
	let o = {}, a = [], oo, aa;

	oo = Observable.from(o);

	if (Object.keys(oo).length) fail('expected to not see any enumerable keys on the empty observable object');

	aa = Observable.from(a);

	if (Object.keys(aa).length) fail('expected to not see any enumerable keys on the empty observable array');

	pass();
});

suite.addTest({name: 'test observable APIs - nested objects/arrays have no observable APIs'}, function(pass, fail) {
	let o = {n: {}}, a = [[]], oo, aa;

	oo = Observable.from(o);

	if (typeof oo.n.revoke === 'function' || typeof oo.n.observe === 'function' || typeof oo.n.unobserve === 'function') fail('expected to not see any APIs on the nested object of observable object');

	aa = Observable.from(a);

	if (typeof aa[0].revoke === 'function' || typeof aa[0].observe === 'function' || typeof aa[0].unobserve === 'function') fail('expected to not see any APIs on the nested array of observable array');

	pass();
});

suite.run();
