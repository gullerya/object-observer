import { getSuite } from '../../node_modules/just-test/dist/just-test.js';

getIFrame()
	.then(frame => {
		const suite = getSuite({ name: 'Testing Observable Load - sync' });
		frame.contentWindow.runTests(suite);
	});

async function getIFrame() {
	return new Promise(r => {
		const f = document.createElement('iframe');
		f.src = './frame-htmls/perf-sync.html';
		document.body.appendChild(f);
		f.addEventListener('load', () => r(f));
	});
}