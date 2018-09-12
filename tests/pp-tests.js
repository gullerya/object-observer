const puppeteer = require('puppeteer');

(async () => {
	const browser = await puppeteer.launch();

	const page = await browser.newPage();

	await page.coverage.startJSCoverage();

	await page.goto('http://localhost:63342/object-observer/tests/module/test.html?_ijt=80p3l3otved9c1ab8q8fh4oiqp');

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
		console.info('total: ' + totalBytes + ' (neto: ' + totalNeto + ')');
		console.info('used: ' + usedBytes);
		console.info('missed: ' + (totalBytes - usedBytes) + ' (from neto: ' + (totalNeto - usedBytes) + ')');
		console.info('covered ' + (usedBytes / totalBytes * 100) + ' (from neto: ' + (usedBytes / totalNeto * 100) + ')');

		console.dir(missedLines);
	}

	await browser.close();
})();