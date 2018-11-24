const
	puppeteer = require('puppeteer'),
	autServer = require('./aut-server'),
	coverageToLcov = require('./coverage-to-lcov');

let
	port = 3000,
	testResults = {};

autServer.launchServer(port);

(async () => {
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

	const jsCoverage = await page.coverage.stopJSCoverage();

	for (const entry of jsCoverage) {
		if (entry.url.indexOf('object-observer.js') < 0) continue;
		let totalBytes = entry.text.length;
		let totalNeto = totalBytes;
		let usedBytes = 0;
		let missedLines = [];
		for (let i = 0, l = entry.ranges.length; i < l; i++) {
			let range = entry.ranges[i];
			let prevRange = i > 0 ? entry.ranges[i - 1] : null;
			usedBytes += range.end - range.start;
			if (i === 0 && range.start > 0) {
				missedLines.push(entry.text.substr(0, range.start));
			}
			if (i === l - 1 && range.end < entry.text.length) {
				missedLines.push(entry.text.substr(range.end, entry.text.length - range.end));
			}
			if (prevRange && range.start - entry.ranges[i - 1].end > 1) {
				let missedTextCandidate = entry.text.substr(prevRange.end, range.start - prevRange.end);
				if (/^\s*$/.test(missedTextCandidate)) {
					totalNeto -= missedTextCandidate.length;
				} else {
					missedLines.push(missedTextCandidate);
				}
			}
		}

		console.info('COVERAGE of ' + entry.url + ':');
		console.info('total: ' + totalBytes);
		console.info('coverable: ' + totalNeto);
		console.info('covered: ' + usedBytes);
		console.info('missed: ' + (totalBytes - usedBytes));
		console.info('covered ' + (usedBytes / totalNeto * 100));

		console.dir(missedLines);
	}

	await browser.close();
	autServer.closeServer();
})()
	.then(() => {
		console.info('test suite/s done, no errors');
		process.exitCode = testResults.failed ? 1 : 0;
	})
	.catch(error => {
		console.error('test suite/s done with error', error);
		process.exitCode = 1;
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