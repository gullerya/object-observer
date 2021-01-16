/**
 * Usage:
 * 
 * 	set version			node version-utils.js -v=<version>
 * 	snapshot version	node version-utils.js -v=<version> -s
 * 	remove snapshot		node version-utils.js -r
 * 
 * Params:
 * 
 * 	-v | --version
 * 		sets version as per following:
 * 			major - increase current version as '{x + 1}.0.0'
 * 			minor - increase current version as 'x.{y + 1}.0'
 * 			patch - increase current version as 'x.y.{z + 1}'
 * 			x.y.z - set current version to 'x.y.z'
 * 		MAY NOT decrease version
 * 
 * 	-s | --snapshot
 * 		adds '-snapshot' to the new version
 * 		MAY ONLY be used with '-v'
 * 
 *  -r | --release
 * 		removes '-snapshot' from the current version, if present
 * 		MAY NOT be used with '-v'
 */

import os from 'os';
import fs from 'fs';

// execution

const args = translateCLArguments(process.argv);
console.info(`params: ${JSON.stringify(args)}${os.EOL}`);
main(args);
console.info(`${os.EOL}done${os.EOL}`);

// definitions

function main() {
	const version = args['-v'] || args['--version'];
	const release = '-r' in args || '--release' in args;
	const snapshot = '-s' in args || '--snapshot' in args;

	if (!version && !release) {
		console.warn('\trequired param (-v | -r) missing');
		return;
	}
	if (release && version) {
		console.warn(`\t'-r' MAY NOT be used with '-v'`);
		return;
	}
	if (snapshot && !version) {
		console.warn(`\t'-s' MAY ONLY be used with '-v'`);
		return;
	}

	const [oldPlain, oldParsed] = getCurrentPackageVersion();

	let newPlain, newParsed;
	if (version) {
		switch (version) {
			case 'major':
				newParsed = [oldParsed[0] + 1, 0, 0];
				break;
			case 'minor':
				newParsed = [oldParsed[0], oldParsed[1] + 1, 0];
				break;
			case 'patch':
				newParsed = [oldParsed[0], oldParsed[1], oldParsed[2] + 1];
				break;
			default:
				newParsed = parseAndValidate(version);
				validateAgainstExisting(newParsed, snapshot, oldParsed, oldPlain.endsWith('snapshot'));
		}
		newPlain = newParsed.join('.') + (snapshot ? '-snapshot' : '');
	} else if (release) {
		newPlain = oldPlain.replace(/-snapshot$/, '');
	} else {
		throw new Error(`something when wrong with arguments validation; file issue and cite this: 'failed on args: [${process.argv.join(' ')}]'`);
	}

	console.info(`\tupdate: ${oldPlain} => ${newPlain}`);
	updatePackageVersion(newPlain, oldPlain);
}

function translateCLArguments(input) {
	const result = {};
	for (const arg of input.slice(2)) {
		if (!arg || !arg.startsWith('-')) { continue; }
		const [key, val] = arg.split('=');
		if (key in result) {
			throw new Error(`duplicate param '${key}'`);
		}
		result[key] = val || '';
	}
	return result;
}

function parseAndValidate(targetVersion) {
	if (!targetVersion) {
		throw new Error(`target version unspecified`);
	}
	const parts = targetVersion.split('.');
	if (parts.length !== 3) {
		throw new Error(`expected tripartite sem-ver format, but got '${parts}'`);
	}
	const semVers = parts.map((p, i) => {
		const sv = parseInt(p, 10);
		if (isNaN(sv)) {
			throw new Error(`part number ${i} (zero based index) of the target version is NaN ('${p}')`);
		}
		return sv;
	});
	return semVers;
}

function getCurrentPackageVersion() {
	const packageJson = readPackageJson();
	const packageVersion = JSON.parse(packageJson).version;
	return [packageVersion, packageVersion.split('.').map(v => parseInt(v, 10))];
}

function validateAgainstExisting(newVer, newSnapshot, oldVer, oldSnapshot) {
	const compareMark = newVer.reduce((mark, nv, i) => {
		if (mark === 0) {
			mark = nv > oldVer[i] ? 1 : (nv < oldVer[i] ? -1 : 0);
		}
		return mark;
	}, 0);

	if (compareMark === 0 && !(oldSnapshot && !newSnapshot)) {
		throw new Error(`new version (${newVer}) and old version (${oldVer}) are equal`);
	} else if (compareMark < 0) {
		throw new Error(`new version (${newVer}) is lower than old version (${oldVer})`);
	}
}

function updatePackageVersion(newVer, oldVer) {
	const packageJson = readPackageJson();
	const updatedContent = packageJson.replace(oldVer, newVer);
	writePackageJson(updatedContent);
}

function readPackageJson() {
	return fs.readFileSync('package.json', { encoding: 'utf-8' });
}

function writePackageJson(content) {
	return fs.writeFileSync('package.json', content, { encoding: 'utf-8' });
}