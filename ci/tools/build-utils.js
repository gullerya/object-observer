import path from 'node:path';
import fs from 'node:fs/promises';

import esbuild from 'esbuild';

import { calcIntegrity } from './integrity-utils.js';
import * as stdout from './stdout.js';

const SRC_DIR = 'src';
const DIST_DIR = 'dist';
const MAIN_FILE = 'object-observer.ts';
const ENTRY_POINT = path.join(SRC_DIR, MAIN_FILE);

stdout.writeGreen('Starting the build...');
stdout.writeNewline();

try {
	await cleanDistDir();
	await buildESModule();
	await buildCDNResources();
} catch (e) {
	console.error(e);
}

stdout.writeGreen('... done');
stdout.writeNewline();
stdout.writeNewline();

async function cleanDistDir() {
	stdout.write(`- cleaning "dist"...`);

	await fs.rm(DIST_DIR, { recursive: true, force: true });
	await fs.mkdir(DIST_DIR);

	stdout.writeGreen('\t\tOK');
	stdout.writeNewline();
}

async function buildESModule() {
	stdout.write('- building ESM resources...');

	const config = {
		entryPoints: [ENTRY_POINT],
		bundle: true,
		outdir: DIST_DIR,
		format: 'esm',
		minify: false,
		sourcemap: true,
		sourcesContent: false
	};
	await esbuild.build(config);
	await esbuild.build({ ...config, minify: true, outExtension: { '.js': '.min.js' } });
	// await fs.copyFile(path.join(SRC_DIR, 'object-observer.d.ts'), path.join(DIST_DIR, 'object-observer.d.ts'));

	stdout.writeGreen('\tOK');
	stdout.writeNewline();
}

async function buildCDNResources() {
	stdout.write('- building CDN resources...');

	const CDN_DIR = path.join(DIST_DIR, 'cdn');
	await fs.mkdir(CDN_DIR);

	const files = (await fs.readdir(DIST_DIR))
		.filter(file => file.endsWith('.js') || file.endsWith('.map'));

	for (const file of files) {
		await fs.copyFile(path.join(DIST_DIR, file), path.join(CDN_DIR, file));
	}

	const sriMap = await calcIntegrity(CDN_DIR);
	await fs.writeFile('sri.json', JSON.stringify(sriMap, null, '\t'), { encoding: 'utf-8' });

	stdout.writeGreen('\tOK');
	stdout.writeNewline();
}
