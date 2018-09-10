import * as OL from '../../dist/module/object-observer.js';

let suite = Utils.JustTest.createSuite({name: 'Testing Observable Load'});

suite.addTest({name: 'creating 10K observables (each has 2 subgraphs)'}, function(pass, fail) {
	let o = {
		name: 'name',
		age: 7,
		address: {
			street: {
				name: 'street name',
				apt: 123
			}
		}
	}, po;

	for (var i = 0; i < 10000; i++) {
		po = OL.Observable.from(o);
	}

	pass();
});

suite.run();