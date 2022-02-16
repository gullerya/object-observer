import { Observable } from '../../src/object-observer.js';

export default setup => {
	const {
		TOLERANCE_MULTIPLIER,
		CREATE_ITERATIONS,
		MUTATE_ITERATIONS,
		OBJECT_CREATION_TRSHLD,
		PRIMITIVE_DEEP_MUTATION_TRSHLD,
		PRIMITIVE_DEEP_ADDITION_TRSHLD,
		PRIMITIVE_DEEP_DELETION_TRSHLD
	} = setup;

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
	if (avg > OBJECT_CREATION_TRSHLD * TOLERANCE_MULTIPLIER) {
		throw new Error(`create perf assert failed, expected at most ${OBJECT_CREATION_TRSHLD * TOLERANCE_MULTIPLIER}, got ${avg}`);
	} else {
		console.info(`CREATE: expected - ${OBJECT_CREATION_TRSHLD}, measured - ${avg.toFixed(4)}: PASSED`);
	}

	//	add listeners/callbacks
	Observable.observe(po, changes => changesCountA += changes.length);
	Observable.observe(po, changes => changesCountB += changes.length);

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
	if (changesCountA !== MUTATE_ITERATIONS) throw new Error(`expected ${MUTATE_ITERATIONS}, got ${changesCountA}`);
	if (changesCountA !== MUTATE_ITERATIONS) throw new Error(`expected ${MUTATE_ITERATIONS}, got ${changesCountB}`);
	console.info(`... mutate of ${MUTATE_ITERATIONS} X3 deep done: total - ${ttl.toFixed(2)}ms, average - ${avg.toFixed(4)}ms`);
	if (avg > PRIMITIVE_DEEP_MUTATION_TRSHLD * TOLERANCE_MULTIPLIER) {
		throw new Error(`mutate perf assert failed, expected at most ${PRIMITIVE_DEEP_MUTATION_TRSHLD * TOLERANCE_MULTIPLIER}, got ${avg}`);
	} else {
		console.info(`UPDATE: expected - ${PRIMITIVE_DEEP_MUTATION_TRSHLD}, measured - ${avg.toFixed(4)}: PASSED`);
	}

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
	if (changesCountA !== MUTATE_ITERATIONS) throw new Error(`expected ${MUTATE_ITERATIONS}, got ${changesCountA}`);
	if (changesCountA !== MUTATE_ITERATIONS) throw new Error(`expected ${MUTATE_ITERATIONS}, got ${changesCountB}`);
	console.info(`... add of ${MUTATE_ITERATIONS} X3 deep done: total - ${ttl.toFixed(2)}ms, average - ${avg.toFixed(4)}ms`);
	if (avg > PRIMITIVE_DEEP_ADDITION_TRSHLD * TOLERANCE_MULTIPLIER) {
		throw new Error(`add perf assert failed, expected at most ${PRIMITIVE_DEEP_ADDITION_TRSHLD * TOLERANCE_MULTIPLIER}, got ${avg}`);
	} else {
		console.info(`INSERT: expected - ${PRIMITIVE_DEEP_ADDITION_TRSHLD}, measured - ${avg.toFixed(4)}: PASSED`);
	}

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
	if (changesCountA !== MUTATE_ITERATIONS) throw new Error(`expected ${MUTATE_ITERATIONS}, got ${changesCountA}`);
	if (changesCountA !== MUTATE_ITERATIONS) throw new Error(`expected ${MUTATE_ITERATIONS}, got ${changesCountB}`);
	console.info(`... delete of ${MUTATE_ITERATIONS} X3 deep done: total - ${ttl.toFixed(2)}ms, average - ${avg.toFixed(4)}ms`);
	if (avg > PRIMITIVE_DEEP_DELETION_TRSHLD * TOLERANCE_MULTIPLIER) {
		throw new Error(`delete perf assert failed, expected at most ${PRIMITIVE_DEEP_DELETION_TRSHLD * TOLERANCE_MULTIPLIER}, got ${avg}`);
	} else {
		console.info(`DELETE: expected - ${PRIMITIVE_DEEP_DELETION_TRSHLD}, measured - ${avg.toFixed(4)}: PASSED`);
	}
};