const
	puppeteer = require('puppeteer'),
	autServer = require('./aut-server');

let
	port = 3000;

autServer.launchServer(port);

(async () => {
	const browser = await puppeteer.launch({
		headless: true,
		args: ['--disable-web-security']
	});

	const page = await browser.newPage();

	await page.coverage.startJSCoverage();

	await page.goto('http://localhost:' + port + '/tests/module/test.html');

	//	TODO: do some smarter await here, based on the tests statuses (nothing is running anymore)
	await new Promise(res => setTimeout(res, 10000));

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
		process.exitCode = 0;
	})
	.catch(error => {
		console.error('test suite/s done with error', error);
		process.exitCode = 1;
	});