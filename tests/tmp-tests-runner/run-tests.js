const
	os = require('os'),
	{performance} = require('perf_hooks'),
	puppeteer = require('puppeteer'),
	autServer = require('./aut-server'),
	coverageToLcov = require('./coverage-to-lcov'),
	fsExtra = require('fs-extra');

let
	port = 3000,
	testResults = {};

(async () => {
	fsExtra.emptyDirSync(__dirname + '/../reports');

	autServer.launchServer(port);

	const browser = await puppeteer.launch();

	const page = await browser.newPage();

	await page.coverage.startJSCoverage();

	//	open the page
	await page.goto('http://localhost:' + port + '/tests/module/test.html');

	//	wait till all of the tests settled (no running classes), TODO: configurable timeout
	await waitTestsToFinish(page, 0);

	//	analyze test results, create report
	await processTestResults(page);

	//	analyze coverage, create report
	const
		jsCoverage = await page.coverage.stopJSCoverage(),
		coverageData = {
			tests: [{
				testName: 'anonymous.anonymous',
				coverage: {
					files: []
				}
			}]
		};
	for (const entry of jsCoverage) {
		if (entry.url.indexOf('object-observer.js') < 0) continue;

		let fileCoverage = {
			path: entry.url.replace('http://localhost:' + port, ''),
			lines: {},
			ranges: []
		};

		//	existing ranges are a COVERED sections
		//	ranges' in-between parts are a NON-COVERED sections
		let positionInCode = 0,
			currentLine = 1;
		entry.ranges.forEach(range => {
			fileCoverage.ranges.push(range);

			//	handle missed section
			if (range.start > positionInCode) {
				let missedCode = entry.text.substring(positionInCode, range.start);
				if (missedCode.indexOf(os.EOL) >= 0) {
					let missedLines = missedCode.split(os.EOL);
					missedLines.forEach(line => {
						if (!/^\s*$/.test(line) && (!fileCoverage.lines[currentLine] || !fileCoverage.lines[currentLine].hits)) {
							fileCoverage.lines[currentLine] = {hits: 0};
						}
						currentLine++;
					});
					currentLine--;
				} else {
					if (!fileCoverage.lines[currentLine] && !/^\s*$/.test(missedCode)) {
						fileCoverage.lines[currentLine] = {hits: 0};
					}
				}
			}

			//	handle covered section
			let hitCode = entry.text.substring(range.start, range.end);
			if (hitCode.indexOf(os.EOL) >= 0) {
				let hitLines = hitCode.split(os.EOL);
				if (hitLines[0] === '') {
					hitLines.shift();
					currentLine++;
				}
				hitLines.forEach(line => {
					if (!/^\s*$/.test(line)) {
						fileCoverage.lines[currentLine] = {hits: 1};
					}
					currentLine++;
				});
				currentLine--;
			} else {
				fileCoverage.lines[currentLine].hits++;
			}

			positionInCode = range.end;
		});
		coverageData.tests[0].coverage.files.push(fileCoverage);
	}
	let lcovReport = coverageToLcov.convert(coverageData);
	fsExtra.outputFileSync(__dirname + '/../reports/coverage.lcov', lcovReport);

	await browser.close();
})()
	.then(() => {
		autServer.closeServer();
		console.info('test suite/s DONE');
		process.exit(testResults.failed ? 1 : 0);
	})
	.catch(error => {
		autServer.closeServer();
		console.error('test suite/s run DONE (with error)', error);
		process.exit(1);
	});

async function waitTestsToFinish(page, timeoutInMillis) {
	let started = performance.now(),
		passed,
		stillRunning;

	console.info('waiting for tests to finish...');
	do {
		stillRunning = (await page.$$('.status.running')).length;
		console.info('found ' + stillRunning.length + ' running tests');
		await new Promise(resolve => setTimeout(resolve, 100));
		passed = performance.now() - started;
	} while (stillRunning > 0 && passed < timeoutInMillis);

	if (!stillRunning) {
		console.info('tests done in ' + passed + 'ms');
	} else {
		console.error('timed out after ' + passed + 'ms');
	}
}

async function processTestResults(page) {
	testResults.passed = (await page.$$('.status.passed')).length;
	testResults.failed = (await page.$$('.status.failed')).length;

	console.info('passed: ' + testResults.passed);
	console.info('failed: ' + testResults.failed);
}