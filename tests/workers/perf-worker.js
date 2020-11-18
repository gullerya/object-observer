globalThis.onmessage = async message => {
	const { testUrl, testParams } = message.data;
	console.log(`executing test from '${testUrl}' with params ${JSON.stringify(testParams)}`);
	try {
		const test = (await import(testUrl)).default;
		const result = await Promise.resolve(test(testParams));
		globalThis.postMessage(result);
	} catch (error) {
		globalThis.postMessage({ error });
	}
};