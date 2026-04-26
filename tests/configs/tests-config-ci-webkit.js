const config = {
	environments: [
		{
			browser: {
				type: 'webkit',
				executors: {
					type: 'iframe'
				}
			},
			tests: {
				ttl: 32000,
				maxFail: 0,
				maxSkip: 5,
				include: [
					'./tests/*'
				],
				exclude: [
					'**/configs/**',
					'**/*-performance-*.js'
				]
			}
		}
	]
};

export default config;