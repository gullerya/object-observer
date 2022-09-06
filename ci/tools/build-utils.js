import path from 'node:path';
import fs from 'node:fs/promises';

import { mkdist } from 'mkdist';
import uglify from 'uglify-js';

import { calcIntegrity } from './integrity-utils.js';
import * as stdout from './stdout.js';

const SRC_DIR = 'src';
const DIST_DIR = 'dist';

stdout.writeGreen('Starting the build...');
stdout.writeNewline();
stdout.writeNewline();

await cleanDistDir();

await buildCJSModule();
await buildESModule();
await buildCDNResources();

stdout.writeGreen('... build done');
stdout.writeNewline();
stdout.writeNewline();

async function cleanDistDir() {
	stdout.write(`\tcleaning "dist"...`);

	await fs.rm(DIST_DIR, { recursive: true, force: true });
	await fs.mkdir(DIST_DIR);

	stdout.writeGreen('\tOK');
	stdout.writeNewline();
}

async function buildCJSModule() {
	stdout.write('\tbuilding CJS resources...');

	const { writtenFiles } = await mkdist({
		cleanDist: false,
		srcDir: SRC_DIR,
		distDir: path.join(DIST_DIR, 'cjs'),
		ext: 'js',
		format: 'cjs',
		pattern: '**/*.js'
	});

	await minify(writtenFiles);

	stdout.writeGreen('\tOK');
	stdout.writeNewline();
}

async function buildESModule() {
	stdout.write('\tbuilding ESM resources...');

	const { writtenFiles } = await mkdist({
		cleanDist: false,
		srcDir: SRC_DIR,
		distDir: path.join(DIST_DIR),
		ext: 'js',
		format: 'esm',
		pattern: '**/*.[jt]s'
	});

	await minify(writtenFiles);

	stdout.writeGreen('\tOK');
	stdout.writeNewline();
}

async function minify(files) {
	for (const file of files) {
		const content = await fs.readFile(file, { encoding: 'utf-8' });

		const pathWithoutExtension = file.split('.');
		const extension = pathWithoutExtension.pop();

		if (extension !== 'js') {
			continue;
		}

		const minified = uglify.minify(content, {
			sourceMap: true,
			toplevel: true
		});

		const minifiedPath = `${pathWithoutExtension.join('.')}.min.js`

		await fs.writeFile(minifiedPath, minified.code);
		await fs.writeFile(`${minifiedPath}.map`, minified.map);
	}
}

async function buildCDNResources() {
	stdout.write('\tbuilding CDN resources...');

	const CDN_DIR = path.join(DIST_DIR, 'cdn');

	await fs.mkdir(CDN_DIR);

	const files = await fs.readdir(DIST_DIR);

	for (const file of files) {
		const allowedExtension = file.endsWith('.js') || file.endsWith('.map');

		if (!allowedExtension) {
			continue;
		}

		const fileName = file.split('/').pop();

		await fs.copyFile(path.join(DIST_DIR, file), path.join(CDN_DIR, fileName));
	}

	const sriMap = await calcIntegrity(CDN_DIR);

	await fs.writeFile('sri.json', JSON.stringify(sriMap, null, '\t'), { encoding: 'utf-8' });

	stdout.writeGreen('\tOK');
	stdout.writeNewline();
}
