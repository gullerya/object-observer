import { Observable } from '../../src/object-observer.js';


window.runTests = suite => {
	const
		CREATE_ITERATIONS = 100000,
		MUTATE_ITERATIONS = 1000000;

	suite.runTest({ name: `creating ${CREATE_ITERATIONS} observables, ${MUTATE_ITERATIONS} deep (x3) mutations`, sync: true }, test => {
		const
			OBJECT_CREATION_TRSHLD = 0.01,
			PRIMITIVE_DEEP_MUTATION_TRSHLD = 0.001,
			PRIMITIVE_DEEP_ADDITION_TRSHLD = 0.0016,
			PRIMITIVE_DEEP_DELETION_TRSHLD = 0.0016;

		let ttl, avg;
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

	const
		ARRAY_ITERATIONS = 100000;

	suite.runTest({ name: `push ${ARRAY_ITERATIONS} observables to an array, mutate them and pop them back`, sync: true }, test => {
		const
			ARRAY_ITERATIONS = 100000,
			ARRAY_PUSH_TRSHLD = 0.015,
			ARRAY_MUTATION_TRSHLD = 0.016,
			ARRAY_POP_TRSHLD = 0.0012;

		let ttl, avg;
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
		po.observe(changes => changesCountA += changes.length);
		po.observe(changes => changesCountB += changes.length);

		//	push objects
		changesCountA = 0;
		changesCountB = 0;
		console.info(`performing ${ARRAY_ITERATIONS} objects pushes...`);
		started = performance.now();
		for (let i = 0; i < ARRAY_ITERATIONS; i++) {
			po.users.push(o);
		}
		ended = performance.now();
		ttl = ended - started;
		avg = ttl / ARRAY_ITERATIONS;
		test.assertEqual(ARRAY_ITERATIONS, po.users.length);
		test.assertEqual(ARRAY_ITERATIONS, changesCountA);
		test.assertEqual(ARRAY_ITERATIONS, changesCountB);
		console.info(`... push of ${ARRAY_ITERATIONS} objects done: total - ${ttl.toFixed(2)}ms, average - ${avg.toFixed(4)}ms`);
		test.assertTrue(avg < ARRAY_PUSH_TRSHLD, `expected ${ARRAY_PUSH_TRSHLD}, found ${avg}`);

		//	add orders array to each one of them
		changesCountA = 0;
		changesCountB = 0;
		console.info(`performing ${ARRAY_ITERATIONS} additions of arrays onto the objects...`);
		started = performance.now();
		for (let i = 0; i < ARRAY_ITERATIONS; i++) {
			po.users[i].orders = orders;
		}
		ended = performance.now();
		ttl = ended - started;
		avg = ttl / ARRAY_ITERATIONS;
		test.assertEqual(ARRAY_ITERATIONS, changesCountA);
		test.assertEqual(ARRAY_ITERATIONS, changesCountB);
		console.info(`... add of ${ARRAY_ITERATIONS} array items done: total - ${ttl.toFixed(2)}ms, average - ${avg.toFixed(4)}ms`);
		test.assertTrue(avg < ARRAY_MUTATION_TRSHLD, `expected ${ARRAY_MUTATION_TRSHLD}, found ${avg}`);

		//	pop objects
		changesCountA = 0;
		changesCountB = 0;
		console.info(`performing ${ARRAY_ITERATIONS} object pops...`);
		started = performance.now();
		for (let i = 0; i < ARRAY_ITERATIONS; i++) {
			po.users.pop();
		}
		ended = performance.now();
		ttl = ended - started;
		avg = ttl / ARRAY_ITERATIONS;
		test.assertEqual(0, po.users.length);
		test.assertEqual(ARRAY_ITERATIONS, changesCountA);
		test.assertEqual(ARRAY_ITERATIONS, changesCountB);
		console.info(`... pop of ${ARRAY_ITERATIONS} array items done: total - ${ttl.toFixed(2)}ms, average - ${avg.toFixed(4)}ms`);
		test.assertTrue(avg < ARRAY_POP_TRSHLD, `expected ${ARRAY_POP_TRSHLD}, found ${avg}`);
	});
};