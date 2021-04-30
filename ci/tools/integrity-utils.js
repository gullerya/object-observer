import os from 'os';
import fs from 'fs';
import readline from 'readline';

run();

function run() {
	const inputFS = fs.createReadStream('docs/cdn.md', { encoding: 'utf-8' });
	const outputFS = fs.createWriteStream('docs/tmp.md', { encoding: 'utf-8' });

	const rl = readline.createInterface(inputFS);

	rl.on('line', line => {
		outputFS.write(line + os.EOL);
	});
}