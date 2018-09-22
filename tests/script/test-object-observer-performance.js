(function() {
	'use strict';

	let suite = Utils.JustTest.createSuite({name: 'Testing Observable Load'});

	suite.addTest({name: 'creating 10K observables, 1M deep mutations X 3'}, function(pass, fail) {
		let mutationIterations = 1000000,
			o = {
				name: 'name',
				age: 7,
				address: {
					street: {
						name: 'street name',
						apt: 123
					}
				}
			},
			po,
			changesCountA,
			changesCountB;

		//	creation of Observable
		for (let i = 0; i < 10000; i++) {
			po = Observable.from(o);
		}

		//	add listeners/callbacks
		po.observe(changes => {
			if (!changes.length) {
				throw new Error('expected to have at least one change in the list');
			} else {
				changesCountA += changes.length;
			}
		});
		po.observe(changes => {
			if (!changes) {
				throw new Error('expected changes list to be defined');
			} else {
				changesCountB += changes.length;
			}
		});

		//	mutation of existing property
		changesCountA = 0;
		changesCountB = 0;
		console.info('performing ' + mutationIterations + ' deep mutations...');
		for (let i = 0; i < mutationIterations; i++) {
			po.address.street.apt = i;
		}
		if (changesCountA !== mutationIterations) fail('expected to have ' + mutationIterations + ' changes counted A, but got ' + changesCountA);
		if (changesCountB !== mutationIterations) fail('expected to have ' + mutationIterations + ' changes counted B, but got ' + changesCountB);
		console.info('\tdone');

		//	adding new property
		changesCountA = 0;
		changesCountB = 0;
		console.info('performing ' + mutationIterations + ' deep additions...');
		for (let i = 0; i < mutationIterations; i++) {
			po.address.street[i] = i;
		}
		if (changesCountA !== mutationIterations) fail('expected to have ' + mutationIterations + ' changes counted A, but got ' + changesCountA);
		if (changesCountB !== mutationIterations) fail('expected to have ' + mutationIterations + ' changes counted B, but got ' + changesCountB);
		console.info('\tdone');

		//	removing new property
		changesCountA = 0;
		changesCountB = 0;
		console.info('performing ' + mutationIterations + ' deep deletions...');
		for (let i = 0; i < mutationIterations; i++) {
			delete po.address.street[i];
		}
		if (changesCountA !== mutationIterations) fail('expected to have ' + mutationIterations + ' changes counted A, but got ' + changesCountA);
		if (changesCountB !== mutationIterations) fail('expected to have ' + mutationIterations + ' changes counted B, but got ' + changesCountB);
		console.info('\tdone');

		pass();
	});

	suite.addTest({name: 'push 100K observables to an array, then pop them back'}, function(pass, fail) {
		let mutationIterations = 100000,
			o = {
				name: 'name',
				age: 7,
				address: {
					street: {
						name: 'street name',
						apt: 123
					}
				}
			},
			po,
			changesCountA,
			changesCountB;

		//	creation of Observable
		po = Observable.from([]);

		//	add listeners/callbacks
		po.observe(changes => {
			if (!changes.length) {
				throw new Error('expected to have at least one change in the list');
			} else {
				changesCountA += changes.length;
			}
		});
		po.observe(changes => {
			if (!changes) {
				throw new Error('expected changes list to be defined');
			} else {
				changesCountB += changes.length;
			}
		});

		//	push objects
		changesCountA = 0;
		changesCountB = 0;
		console.info('performing ' + mutationIterations + ' pushes...');
		for (let i = 0; i < mutationIterations; i++) {
			po.push(o);
		}
		if (po.length !== mutationIterations) fail('expected to have total of ' + mutationIterations + ' elements in pushed array, but got ' + po.length);
		if (changesCountA !== mutationIterations) fail('expected to have ' + mutationIterations + ' changes counted A, but got ' + changesCountA);
		if (changesCountB !== mutationIterations) fail('expected to have ' + mutationIterations + ' changes counted B, but got ' + changesCountB);
		console.info('\tdone');

		//	pop objects
		changesCountA = 0;
		changesCountB = 0;
		console.info('performing ' + mutationIterations + ' pops...');
		for (let i = 0; i < mutationIterations; i++) {
			po.pop(o);
		}
		if (po.length !== 0) fail('expected to have total of 0 elements in pushed array, but got ' + po.length);
		if (changesCountA !== mutationIterations) fail('expected to have ' + mutationIterations + ' changes counted A, but got ' + changesCountA);
		if (changesCountB !== mutationIterations) fail('expected to have ' + mutationIterations + ' changes counted B, but got ' + changesCountB);
		console.info('\tdone');

		pass();
	});

	suite.run();
})();