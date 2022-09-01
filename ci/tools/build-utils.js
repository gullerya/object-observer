import os from 'node:os';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import uglify from 'uglify-js';
import { calcIntegrity } from './integrity-utils.js';
import { transformFileAsync } from '@babel/core';

const
	isCDN = process.argv.some(a => a === '--cdn'),
	SRC = 'src',
	DIST = 'dist',
	CJS = 'cjs',
	MJS = 'mjs',
	CDN = 'cdn',
	filesToCopy = ['object-observer.d.ts'],
	filesToProcess = ['object-observer.js'];

process.stdout.write(`\x1B[32mStarting the build...\x1B[0m${os.EOL}`);
process.stdout.write(os.EOL);

await ensureCleanDir(DIST);

process.stdout.write(`\tcopying "${SRC}" to "${DIST}"...`);
for (const fileToCopy of filesToCopy) {
	await fs.copyFile(path.join(SRC, fileToCopy), path.join(DIST, fileToCopy));
}
process.stdout.write(`\t\x1B[32mOK\x1B[0m${os.EOL}`);

await buildMJSModule(DIST, MJS);
await buildCJSModule(DIST, CJS);

process.stdout.write('\tminifying...');
const options = {
	toplevel: true
};
for (const fileToMinify of filesToProcess) {
	const fp = path.join(DIST, MJS, fileToMinify);
	const mfp = path.join(DIST, MJS, fileToMinify.replace(/\.js$/, '.min.js'));
	const fc = await fs.readFile(fp, { encoding: 'utf8' });
	const mfc = uglify.minify(fc, options).code;
	await fs.writeFile(mfp, mfc);
}
process.stdout.write(`\t\t\t\x1B[32mOK\x1B[0m${os.EOL}`);

if (isCDN) {
	await buildCDNDistro(DIST, MJS, CDN);
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

async function buildCDNDistro(dir, mjs, cdn) {
	process.stdout.write('\tbuilding CDN resources...');
	await fs.mkdir(path.join(dir, cdn), { recursive: true });
	for (const file of filesToProcess) {
		await Promise.all([
			fs.copyFile(path.join(dir, mjs, file), path.join(dir, cdn, file)),
			fs.copyFile(path.join(dir, mjs, file.replace('.js', '.min.js')), path.join(dir, cdn, file.replace('.js', '.min.js')))
		]);
	}
	process.stdout.write(`\t\x1B[32mOK\x1B[0m${os.EOL}`);
}

async function buildCJSModule(dir, cjs) {
	process.stdout.write('\tbuilding CJS resources...');
	await fs.mkdir(path.join(dir, cjs), { recursive: true });

	for (const file of filesToProcess) {
		const transformedFile = await transformFileAsync(path.join(SRC, file), {
			"plugins": ["@babel/plugin-transform-modules-commonjs"],
		});

		await fs.writeFile(path.join(dir, cjs, file), transformedFile.code);
	}

	fs.writeFile(path.join(dir, cjs, 'package.json'), JSON.stringify({
		"type": "commonjs"
	}, undefined, 2))

	process.stdout.write(`\t\x1B[32mOK\x1B[0m${os.EOL}`);
}

async function buildMJSModule(dir, mjs) {
	process.stdout.write('\tbuilding CJS resources...');
	await fs.mkdir(path.join(dir, mjs), { recursive: true });

	for (const file of filesToProcess) {
		const destFile = path.join(DIST, mjs, file);

		await fs.copyFile(path.join(SRC, file), destFile);

		const minifyOptions = {
			toplevel: true
		};

		const fc = await fs.readFile(destFile, { encoding: 'utf8' });
		const mfc = uglify.minify(fc, minifyOptions).code;

		await fs.writeFile(path.join(DIST, mjs, file).replace(/\.js$/, '.min.js'), mfc)
	}

	fs.writeFile(path.join(dir, mjs, 'package.json'), JSON.stringify({
		"type": "module"
	}, undefined, 2))

	process.stdout.write(`\t\x1B[32mOK\x1B[0m${os.EOL}`);
}
