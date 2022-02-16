import { Observable } from '../../src/object-observer.js';

export default async setup => {
	const {
		TOLERANCE_MULTIPLIER,
		ARRAY_ITERATIONS,
		ARRAY_PUSH_TRSHLD,
		ARRAY_MUTATION_TRSHLD,
		ARRAY_POP_TRSHLD
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
	const po = Observable.from({ users: [] }, { async: true });

	//	add listeners/callbacks
	Observable.observe(po, changes => changesCountA += changes.length);
	Observable.observe(po, changes => changesCountB += changes.length);

	//	push objects
	changesCountA = 0;
	changesCountB = 0;
	console.info(`[async] performing ${ARRAY_ITERATIONS} objects pushes...`);
	started = performance.now();
	for (let i = 0; i < ARRAY_ITERATIONS; i++) {
		po.users.push(o);
	}
	await new Promise(r => setTimeout(r, 0));
	ended = performance.now();
	ttl = ended - started;
	avg = ttl / ARRAY_ITERATIONS;
	if (po.users.length !== ARRAY_ITERATIONS) throw new Error(`expected ${ARRAY_ITERATIONS}, got ${po.users.length}`);
	if (changesCountA !== ARRAY_ITERATIONS) throw new Error(`expected ${ARRAY_ITERATIONS}, got ${changesCountA}`);
	if (changesCountA !== ARRAY_ITERATIONS) throw new Error(`expected ${ARRAY_ITERATIONS}, got ${changesCountB}`);
	console.info(`... [async] push of ${ARRAY_ITERATIONS} objects done: total - ${ttl.toFixed(2)}ms, average - ${avg.toFixed(4)}ms`);
	if (avg > ARRAY_PUSH_TRSHLD * TOLERANCE_MULTIPLIER) {
		throw new Error(`create perf assert failed, expected at most ${ARRAY_PUSH_TRSHLD * TOLERANCE_MULTIPLIER}, got ${avg}`);
	} else {
		console.info(`PUSH [async]: expected - ${ARRAY_PUSH_TRSHLD}, measured - ${avg.toFixed(4)}: PASSED`);
	}

	//	add orders array to each one of them
	changesCountA = 0;
	changesCountB = 0;
	console.info(`[async] performing ${ARRAY_ITERATIONS} additions of arrays onto the objects...`);
	started = performance.now();
	for (let i = 0; i < ARRAY_ITERATIONS; i++) {
		po.users[i].orders = orders;
	}
	await new Promise(r => setTimeout(r, 0));
	ended = performance.now();
	ttl = ended - started;
	avg = ttl / ARRAY_ITERATIONS;
	if (changesCountA !== ARRAY_ITERATIONS) throw new Error(`expected ${ARRAY_ITERATIONS}, got ${changesCountA}`);
	if (changesCountA !== ARRAY_ITERATIONS) throw new Error(`expected ${ARRAY_ITERATIONS}, got ${changesCountB}`);
	console.info(`... [async] add of ${ARRAY_ITERATIONS} array items done: total - ${ttl.toFixed(2)}ms, average - ${avg.toFixed(4)}ms`);
	if (avg > ARRAY_MUTATION_TRSHLD * TOLERANCE_MULTIPLIER) {
		throw new Error(`create perf assert failed, expected at most ${ARRAY_MUTATION_TRSHLD * TOLERANCE_MULTIPLIER}, got ${avg}`);
	} else {
		console.info(`ARRAY UPDATE [async]: expected - ${ARRAY_MUTATION_TRSHLD}, measured - ${avg.toFixed(4)}: PASSED`);
	}

	//	pop objects
	changesCountA = 0;
	changesCountB = 0;
	console.info(`[async] performing ${ARRAY_ITERATIONS} object pops...`);
	started = performance.now();
	for (let i = 0; i < ARRAY_ITERATIONS; i++) {
		po.users.pop();
	}
	await new Promise(r => setTimeout(r, 0));
	ended = performance.now();
	ttl = ended - started;
	avg = ttl / ARRAY_ITERATIONS;
	if (po.users.length !== 0) throw new Error(`expected ${0}, got ${po.users.length}`);
	if (changesCountA !== ARRAY_ITERATIONS) throw new Error(`expected ${ARRAY_ITERATIONS}, got ${changesCountA}`);
	if (changesCountA !== ARRAY_ITERATIONS) throw new Error(`expected ${ARRAY_ITERATIONS}, got ${changesCountB}`);
	console.info(`... [async] pop of ${ARRAY_ITERATIONS} array items done: total - ${ttl.toFixed(2)}ms, average - ${avg.toFixed(4)}ms`);
	if (avg > ARRAY_POP_TRSHLD * TOLERANCE_MULTIPLIER) {
		throw new Error(`create perf assert failed, expected at most ${ARRAY_POP_TRSHLD * TOLERANCE_MULTIPLIER}, got ${avg}`);
	} else {
		console.info(`POP [async]: expected - ${ARRAY_POP_TRSHLD}, measured - ${avg.toFixed(4)}: PASSED`);
	}
};