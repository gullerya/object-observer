import { getSuite } from '../../node_modules/just-test/dist/just-test.js';

const suite = getSuite({ name: 'Testing Observable load - async' });

const TOLERANCE_MULTIPLIER = 5;

const
	CREATE_ITERATIONS = 100000,
	MUTATE_ITERATIONS = 1000000;

suite.runTest({
	name: `creating ${CREATE_ITERATIONS} observables, ${MUTATE_ITERATIONS} deep (x3) mutations`,
	sync: true,
	timeout: 15000
}, async () => {
	await executeInWorker('/tests/workers/perf-async-test-a.js', {
		TOLERANCE_MULTIPLIER: TOLERANCE_MULTIPLIER,
		CREATE_ITERATIONS: CREATE_ITERATIONS,
		MUTATE_ITERATIONS: MUTATE_ITERATIONS,
		OBJECT_CREATION_TRSHLD: 0.001,
		PRIMITIVE_DEEP_MUTATION_TRSHLD: 0.0006,
		PRIMITIVE_DEEP_ADDITION_TRSHLD: 0.001,
		PRIMITIVE_DEEP_DELETION_TRSHLD: 0.001
	});
});

const ARRAY_ITERATIONS = 100000;

suite.runTest({
	name: `push ${ARRAY_ITERATIONS} observables to an array, mutate them and pop them back`,
	sync: true,
	timeout: 15000
}, async () => {
	return executeInWorker('/tests/workers/perf-async-test-b.js', {
		TOLERANCE_MULTIPLIER: TOLERANCE_MULTIPLIER,
		ARRAY_ITERATIONS: ARRAY_ITERATIONS,
		ARRAY_PUSH_TRSHLD: 0.0025,
		ARRAY_MUTATION_TRSHLD: 0.0025,
		ARRAY_POP_TRSHLD: 0.0006
	});
});

async function executeInWorker(testUrl, testParams) {
	// return (await import(testUrl)).default(testParams);
	return new Promise((resolve, reject) => {
		const w = new Worker('./workers/perf-worker.js');
		w.onmessage = message => {
			w.terminate();
			if (message.data && message.data.error) {
				console.error(`failed in worker; name: '${message.data.error.name}', message: '${message.data.error.message}'`);
				reject(new Error(message.data.error.message));
			} else {
				resolve();
			}
		};
		w.onerror = error => {
			w.terminate();
			reject(error);
		};
		w.postMessage({ testUrl: testUrl, testParams: testParams });
	});
}
