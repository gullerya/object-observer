import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export {
	calcIntegrity
};

const HASHING_ALGO = 'sha512';

async function calcIntegrity(dir) {
	const result = {};
	const files = await getFlatFilesList(dir);
	for (const file of files) {
		const text = await fs.readFile(path.join(file), { encoding: 'utf-8' });
		const algo = crypto.createHash(HASHING_ALGO);
		const hash = algo.update(text, 'utf-8').digest().toString('base64');
		result[file] = `${HASHING_ALGO}-${hash}`;
	}
	return Object.freeze(result);
}

async function getFlatFilesList(rootDir) {
	const result = [];
	const entries = await fs.readdir(rootDir, { withFileTypes: true });
	for (const e of entries) {
		const ePath = path.join(rootDir, e.name);
		result.push(e.isDirectory() ? getFlatFilesList(ePath) : ePath);
	}
	return result.flat(Number.MAX_VALUE);
}