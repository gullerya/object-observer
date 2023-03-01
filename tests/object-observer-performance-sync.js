import { getSuite } from 'just-test/suite';

const suite = getSuite('Testing Observable load - sync');

const TOLERANCE_MULTIPLIER = 5;

const
	CREATE_ITERATIONS = 100000,
	MUTATE_ITERATIONS = 1000000;

suite.test(`creating ${CREATE_ITERATIONS} observables, ${MUTATE_ITERATIONS} deep (x3) mutations`, {
	// skip: true,
	ttl: 15000
}, async () => {
	await executeInWorker('perf-sync-test-a.js', {
		TOLERANCE_MULTIPLIER: TOLERANCE_MULTIPLIER,
		CREATE_ITERATIONS: CREATE_ITERATIONS,
		MUTATE_ITERATIONS: MUTATE_ITERATIONS,
		OBJECT_CREATION_TRSHLD: 0.005,
		PRIMITIVE_DEEP_MUTATION_TRSHLD: 0.0003,
		PRIMITIVE_DEEP_ADDITION_TRSHLD: 0.0006,
		PRIMITIVE_DEEP_DELETION_TRSHLD: 0.0006
	});
});

const ARRAY_ITERATIONS = 100000;

suite.test(`push ${ARRAY_ITERATIONS} observables to an array, mutate them and pop them back`, {
	// skip: true,
	ttl: 15000
}, async () => {
	await executeInWorker('perf-sync-test-b.js', {
		TOLERANCE_MULTIPLIER: TOLERANCE_MULTIPLIER,
		ARRAY_ITERATIONS: ARRAY_ITERATIONS,
		ARRAY_PUSH_TRSHLD: 0.005,
		ARRAY_MUTATION_TRSHLD: 0.005,
		ARRAY_POP_TRSHLD: 0.001
	});
});

async function executeInWorker(testUrl, testParams) {
	// return (await import(testUrl)).default(testParams);

	let CrossPlatformWorker = globalThis.Worker;
	if (!CrossPlatformWorker) {
		CrossPlatformWorker = (await import('node:worker_threads')).default.Worker;
	}

	return new Promise((resolve, reject) => {
		const w = new CrossPlatformWorker('./tests/workers/perf-worker.js');
		w.on('message', message => {
			w.terminate();
			if (message?.error) {
				reject(new Error(message.error.message));
			} else {
				resolve();
			}
		});
		w.on('error', error => {
			w.terminate();
			reject(error);
		});
		w.postMessage({ testUrl: testUrl, testParams: testParams });
	});
}