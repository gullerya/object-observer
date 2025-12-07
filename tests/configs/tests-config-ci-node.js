const config = {
	environments: [
		{
			node: true,
			tests: {
				ttl: 32000,
				maxFail: 0,
				maxSkip: 5,
				include: [
					'./tests/*'
				],
				exclude: [
					'**/configs/**',
					'**/browser-host-objects.js',
					'**/*-performance-*.js'
				]
			},
			coverage: {
				include: [
					'./src/**/*'
				]
			}
		}
	]
};

export default config;