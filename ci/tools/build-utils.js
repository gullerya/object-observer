import os from 'node:os';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import uglify from 'uglify-js';
import { calcIntegrity } from './integrity-utils.js';

const
	isCDN = process.argv.some(a => a === '--cdn'),
	SRC = 'src',
	DIST = 'dist',
	CDN = 'cdn',
	filesToCopy = ['object-observer.js', 'object-observer.d.ts'],
	filesToMinify = ['object-observer.js'];

process.stdout.write(`\x1B[32mStarting the build...\x1B[0m${os.EOL}`);
process.stdout.write(os.EOL);

await ensureCleanDir(DIST);

process.stdout.write(`\tcopying "${SRC}" to "${DIST}"...`);
for (const fileToCopy of filesToCopy) {
	await fs.copyFile(path.join(SRC, fileToCopy), path.join(DIST, fileToCopy));
}
process.stdout.write(`\t\x1B[32mOK\x1B[0m${os.EOL}`);

process.stdout.write('\tminifying...');
const options = {
	toplevel: true
};
for (const fileToMinify of filesToMinify) {
	const fp = path.join(DIST, fileToMinify);
	const mfp = path.join(DIST, fileToMinify.replace(/\.js$/, '.min.js'));
	const fc = await fs.readFile(fp, { encoding: 'utf8' });
	const mfc = uglify.minify(fc, options).code;
	await fs.writeFile(mfp, mfc);
}
process.stdout.write(`\t\t\t\x1B[32mOK\x1B[0m${os.EOL}`);

if (isCDN) {
	await buildCDNDistro(DIST, CDN);
	const sriMap = await calcIntegrity(path.join(DIST, CDN));
	await fs.writeFile('sri.json', JSON.stringify(sriMap, null, '\t'), { encoding: 'utf-8' });
}

process.stdout.write(os.EOL);
process.stdout.write(`\x1B[32mDONE\x1B[0m${os.EOL}`);

async function ensureCleanDir(dir) {
	process.stdout.write(`\tcleaning "${dir}"...`);
	await fs.rm(dir, { recursive: true, force: true });
	await fs.mkdir(dir);
	process.stdout.write(`\t\t\x1B[32mOK\x1B[0m${os.EOL}`);
}

async function buildCDNDistro(dir, cdn) {
	process.stdout.write('\tbuilding CDN resources...');
	await fs.mkdir(path.join(dir, cdn), { recursive: true });
	for (const file of filesToMinify) {
		await Promise.all([
			fs.copyFile(path.join(dir, file), path.join(dir, cdn, file)),
			fs.copyFile(path.join(dir, file.replace('.js', '.min.js')), path.join(dir, cdn, file.replace('.js', '.min.js')))
		]);
	}
	process.stdout.write(`\t\x1B[32mOK\x1B[0m${os.EOL}`);
}