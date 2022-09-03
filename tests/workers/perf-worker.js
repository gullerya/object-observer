import { parentPort } from 'node:worker_threads';

parentPort.on('message', async message => {
	const { testUrl, testParams } = message;
	console.log(`executing test from '${testUrl}' with params ${JSON.stringify(testParams)}`);
	try {
		const test = (await import(`./${testUrl}`)).default;
		const result = await Promise.resolve(test(testParams));
		parentPort.postMessage(result);
	} catch (error) {

		console.error(error);

		parentPort.postMessage({ error: { name: error.name, message: error.message, stack: error.stack } });
	}
});

parentPort.unref();