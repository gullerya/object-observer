import { Observable } from '../../src/object-observer.js';

const
	CREATE_ITERATIONS = 100000,
	MUTATE_ITERATIONS = 1000000,
	OBJECT_CREATION_TRSHLD = 0.0099,
	PRIMITIVE_DEEP_MUTATION_TRSHLD = 0.00099,
	PRIMITIVE_DEEP_ADDITION_TRSHLD = 0.00099,
	PRIMITIVE_DEEP_DELETION_TRSHLD = 0.00099;

window.runTests = suite => {
	suite.runTest({ name: `creating ${CREATE_ITERATIONS} observables, ${MUTATE_ITERATIONS} deep (x3) mutations`, sync: true }, test => {
		let ttl;
		let avg;
		const
			o = {
				name: 'Anna Guller',
				accountCreated: new Date(),
				age: 20,
				address: {
					city: 'Dreamland',
					street: {
						name: 'Hope',
						apt: 123
					}
				},
				orders: []
			};
		let po,
			changesCountA,
			changesCountB,
			started,
			ended;

		//	creation of Observable
		console.info(`creating ${CREATE_ITERATIONS} observables from object...`);
		started = performance.now();
		for (let i = 0; i < CREATE_ITERATIONS; i++) {
			po = Observable.from(o);
		}
		ended = performance.now();
		ttl = ended - started;
		avg = ttl / CREATE_ITERATIONS;
		console.info(`... create of ${CREATE_ITERATIONS} observables done: total - ${ttl.toFixed(2)}ms, average - ${avg.toFixed(4)}ms`);
		test.assertTrue(avg < OBJECT_CREATION_TRSHLD, `expected ${OBJECT_CREATION_TRSHLD}, found ${avg}`);

		//	add listeners/callbacks
		po.observe(changes => changesCountA += changes.length);
		po.observe(changes => changesCountB += changes.length);

		//	mutation of existing property
		changesCountA = 0;
		changesCountB = 0;
		console.info(`performing ${MUTATE_ITERATIONS} deep (x3) primitive mutations...`);
		started = performance.now();
		for (let i = 0; i < MUTATE_ITERATIONS; i++) {
			po.address.street.apt = i;
		}
		ended = performance.now();
		ttl = ended - started;
		avg = ttl / MUTATE_ITERATIONS;
		test.assertEqual(MUTATE_ITERATIONS, changesCountA);
		test.assertEqual(MUTATE_ITERATIONS, changesCountB);
		console.info(`... mutate of ${MUTATE_ITERATIONS} X3 deep done: total - ${ttl.toFixed(2)}ms, average - ${avg.toFixed(4)}ms`);
		test.assertTrue(avg < PRIMITIVE_DEEP_MUTATION_TRSHLD, `expected ${PRIMITIVE_DEEP_MUTATION_TRSHLD}, found ${avg}`);

		//	adding new property
		changesCountA = 0;
		changesCountB = 0;
		console.info(`performing ${MUTATE_ITERATIONS} deep (x3) primitive additions...`);
		started = performance.now();
		for (let i = 0; i < MUTATE_ITERATIONS; i++) {
			po.address.street[i] = i;
		}
		ended = performance.now();
		ttl = ended - started;
		avg = ttl / MUTATE_ITERATIONS;
		test.assertEqual(MUTATE_ITERATIONS, changesCountA);
		test.assertEqual(MUTATE_ITERATIONS, changesCountB);
		console.info(`... add of ${MUTATE_ITERATIONS} X3 deep done: total - ${ttl.toFixed(2)}ms, average - ${avg.toFixed(4)}ms`);
		test.assertTrue(avg < PRIMITIVE_DEEP_ADDITION_TRSHLD, `expected ${PRIMITIVE_DEEP_ADDITION_TRSHLD}, found ${avg}`);

		//	removing new property
		changesCountA = 0;
		changesCountB = 0;
		console.info(`performing ${MUTATE_ITERATIONS} deep (x3) primitive deletions...`);
		started = performance.now();
		for (let i = 0; i < MUTATE_ITERATIONS; i++) {
			delete po.address.street[i];
		}
		ended = performance.now();
		ttl = ended - started;
		avg = ttl / MUTATE_ITERATIONS;
		test.assertEqual(MUTATE_ITERATIONS, changesCountA);
		test.assertEqual(MUTATE_ITERATIONS, changesCountB);
		console.info(`... delete of ${MUTATE_ITERATIONS} X3 deep done: total - ${ttl.toFixed(2)}ms, average - ${avg.toFixed(4)}ms`);
		test.assertTrue(avg < PRIMITIVE_DEEP_DELETION_TRSHLD, `expected ${PRIMITIVE_DEEP_DELETION_TRSHLD}, found ${avg}`);
	});

	suite.runTest({ name: 'push 100,000 observables to an array, mutate them and pop them back', sync: true }, () => {
		const
			mutationIterations = 100000,
			o = {
				name: 'Anna Guller',
				accountCreated: new Date(),
				age: 20,
				address: {
					city: 'Dreamland',
					street: {
						name: 'Hope',
						apt: 123
					}
				},
				orders: []
			},
			orders = [
				{ id: 1, description: 'some description', sum: 1234, date: new Date() },
				{ id: 2, description: 'some description', sum: 1234, date: new Date() },
				{ id: 3, description: 'some description', sum: 1234, date: new Date() }
			];
		let changesCountA,
			changesCountB,
			started,
			ended;

		//	creation of Observable
		const po = Observable.from({ users: [] });

		//	add listeners/callbacks
		po.observe(changes => {
			if (!changes.length) throw new Error('expected to have at least one change in the list');
			else changesCountA += changes.length;
		});
		po.observe(changes => {
			if (!changes) throw new Error('expected changes list to be defined');
			else changesCountB += changes.length;
		});

		//	push objects
		changesCountA = 0;
		changesCountB = 0;
		console.info('performing ' + mutationIterations + ' objects pushes...');
		started = performance.now();
		for (let i = 0; i < mutationIterations; i++) {
			po.users.push(o);
		}
		ended = performance.now();
		if (po.users.length !== mutationIterations) throw new Error('expected to have total of ' + mutationIterations + ' elements in pushed array, but got ' + po.length);
		if (changesCountA !== mutationIterations) throw new Error('expected to have ' + mutationIterations + ' changes counted A, but got ' + changesCountA);
		if (changesCountB !== mutationIterations) throw new Error('expected to have ' + mutationIterations + ' changes counted B, but got ' + changesCountB);
		console.info('\tdone: total time - ' + (ended - started) + 'ms, average operation time: ' + Math.round((ended - started) / mutationIterations * 10000) / 10000 + 'ms');

		//	add orders array to each one of them
		changesCountA = 0;
		changesCountB = 0;
		console.info('performing ' + mutationIterations + ' additions of arrays onto the objects...');
		started = performance.now();
		for (let i = 0; i < mutationIterations; i++) {
			po.users[i].orders = orders;
		}
		ended = performance.now();
		if (changesCountA !== mutationIterations) throw new Error('expected to have ' + mutationIterations + ' changes counted A, but got ' + changesCountA);
		if (changesCountB !== mutationIterations) throw new Error('expected to have ' + mutationIterations + ' changes counted B, but got ' + changesCountB);
		console.info('\tdone: total time - ' + (ended - started) + 'ms, average operation time: ' + Math.round((ended - started) / mutationIterations * 10000) / 10000 + 'ms');

		//	pop objects
		changesCountA = 0;
		changesCountB = 0;
		console.info('performing ' + mutationIterations + ' object pops...');
		started = performance.now();
		for (let i = 0; i < mutationIterations; i++) {
			po.users.pop();
		}
		ended = performance.now();
		if (po.users.length !== 0) throw new Error('expected to have total of 0 elements in pushed array, but got ' + po.length);
		if (changesCountA !== mutationIterations) throw new Error('expected to have ' + mutationIterations + ' changes counted A, but got ' + changesCountA);
		if (changesCountB !== mutationIterations) throw new Error('expected to have ' + mutationIterations + ' changes counted B, but got ' + changesCountB);
		console.info('\tdone: total time - ' + (ended - started) + 'ms, average operation time: ' + Math.round((ended - started) / mutationIterations * 10000) / 10000 + 'ms');
	});
};