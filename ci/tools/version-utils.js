/**
 * usage examples:
 * 	release version		- node version-utils.js -v=<version>
 * 	snapshot version	- node version-utils.js -v=<version> -s
 * 
 * acceptible params:
 * 	-v | --version
 * 		x.y.z - validate the new version and bump to 'x.y.z'
 * 		patch - extract the old version and auto bump to 'x.y.{z + 1}'
 * 		minor - extract the old version and auto bump to 'x.{y + 1}.0'
 * 		major - extract the old version and auto bump to '{x + 1}.0.0'
 * 	-s | --snapshot
 */

import fs from 'fs';

// execution

const args = translateCLArguments(process.argv);
console.info(`params: ${JSON.stringify(args)}`);
main(args);
console.info('done');

// definitions

function main() {
	const version = args['-v'] || args['--version'];
	const snapshot = '-s' in args || '--snapshot' in args;

	if (!version) {
		console.warn('no relevant params found');
		return;
	}

	const [oldPlain, oldParsed] = getCurrentPackageVersion();

	let newPlain, newParsed;
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
	console.info(`update: ${oldPlain} => ${newPlain}`);
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
		result[key] = val;
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