import os from 'os';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import readline from 'readline';

export {
	updateIntegrity
};

function updateIntegrity(dir) {
	const version = getVersion();
	const hashesMap = getHashesMap(dir);

	const inputFS = fs.createReadStream('docs/cdn.md', { encoding: 'utf-8' });
	const outputFS = fs.createWriteStream('docs/tmp.md', { encoding: 'utf-8' });

	const rl = readline.createInterface(inputFS);

	rl.on('line', line => {
		let output;
		if (line === '|<!--INSERT-MARKER-->') {
			output = Object.entries(hashesMap)
				.map(([fileName, hash]) => `| ${version} | \`${fileName}\` | \`${hash}\` |`)
				.join(os.EOL);
			output = '|<!--INSERT-MARKER-->' + os.EOL + output;
		} else {
			output = line;
		}
		outputFS.write(output + os.EOL);
	});

	fs.rmSync('docs/cdn.md');
	fs.renameSync('docs/tmp.md', 'docs/cdn.md');
}

function getVersion() {
	const text = fs.readFileSync('package.json', { encoding: 'utf-8' });
	const json = JSON.parse(text);
	return json.version;
}

function getHashesMap(dir) {
	const result = {};
	const files = fs.readdirSync(dir);
	const hashingAlgoritm = 'sha512';
	for (const file of files) {
		const text = fs.readFileSync(path.join(dir, file), { encoding: 'utf-8' });
		const algo = crypto.createHash(hashingAlgoritm);
		const hash = algo.update(text, 'utf-8').digest().toString('base64');
		result[file] = `${hashingAlgoritm}-${hash}`;
	}
	return result;
}