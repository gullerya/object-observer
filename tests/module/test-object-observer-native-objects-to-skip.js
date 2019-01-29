import {Observable} from '../../dist/object-observer.js';

let suite = Utils.JustTest.createSuite({name: 'Testing Observable - non-observables'});

suite.addTest({name: 'creating observable from non-observable should throw an error'}, (pass, fail) => {
	let objectsToTest = [
			new Date(),
			new Blob(),
			new Number(),
			new String(),
			new Boolean(),
			new Error(),
			new Function(),
			new RegExp(),
			new Promise(function () {
			})],
		o;

	objectsToTest.forEach(function (one) {
		try {
			o = Observable.from(one);
			fail('should not get to this point');
		} catch (e) {
			//	do nothing here
		}
	});

	pass();
});

suite.addTest({name: 'non-observable in an object subgraph should stay unchanged'}, (pass, fail) => {
	let o = {
		data: new Date(),
		blob: new Blob(),
		number: new Number(),
		string: new String(),
		boolean: new Boolean(),
		error: new Error(),
		func: new Function(),
		regexp: new RegExp(),
		promise: new Promise(function () {
		}),
		object: {}
	}, po;

	po = Observable.from(o);
	Object.keys(o).forEach(function (key) {
		if (key === 'object') {
			if (o[key] === po[key]) fail('proxification on regular object failed - test is malfunctioning');
		} else {
			if (o[key] !== po[key]) fail('expected non-observable key ' + key + ' to remain the same in the Observable');
		}
	});

	pass();
});

suite.addTest({name: 'non-observable in an array subgraph should stay unchanged'}, (pass, fail) => {
	let a = [
			{},
			new Date(),
			new Blob(),
			new Number(),
			new String(),
			new Boolean(),
			new Error(),
			new Function(),
			new RegExp(),
			new Promise(function () {
			})],
		o;

	o = Observable.from(a);
	a.forEach(function (elem, index) {
		if (index === 0) {
			if (a[index] === o[index]) fail('proxification on regular object failed - test is malfunctioning');
		} else {
			if (a[index] !== o[index]) fail('expected non-observable index ' + index + ' to remain the same in the Observable');
		}
	});

	pass();
});

suite.addTest({name: 'non-observable should be handled correctly when replaced'}, (pass, fail) => {
	let o = {
		date: new Date()
	}, oo = Observable.from(o);

	oo.observe(function () {
	});
	oo.date = null;

	pass();
});

suite.addTest({name: 'non-observable should be handled correctly when deleted'}, (pass, fail) => {
	let o = {
		date: new Date()
	}, oo = Observable.from(o);

	oo.observe(function () {
	});
	delete oo.date;

	pass();
});

suite.run();