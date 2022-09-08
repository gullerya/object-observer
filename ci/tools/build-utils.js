import path from 'node:path';
import fs from 'node:fs/promises';

import esbuild from 'esbuild';

import { calcIntegrity } from './integrity-utils.js';
import * as stdout from './stdout.js';

const SRC_DIR = 'src';
const DIST_DIR = 'dist';

stdout.writeGreen('Starting the build...');
stdout.writeNewline();
stdout.writeNewline();

try {
	await cleanDistDir();
	await buildESModule();
	await buildCJSModule();
	await buildCDNResources();
} catch (e) {
	console.error(e);
}

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

async function buildESModule() {
	stdout.write('\tbuilding ESM resources...');

	await fs.copyFile(path.join(SRC_DIR, 'object-observer.d.ts'), path.join(DIST_DIR, 'object-observer.d.ts'));
	await fs.copyFile(path.join(SRC_DIR, 'object-observer.js'), path.join(DIST_DIR, 'object-observer.js'));
	await esbuild.build({
		entryPoints: [path.join(DIST_DIR, 'object-observer.js')],
		outdir: DIST_DIR,
		minify: true,
		sourcemap: true,
		sourcesContent: false,
		outExtension: { '.js': '.min.js' }
	});

	stdout.writeGreen('\tOK');
	stdout.writeNewline();
}

async function buildCJSModule() {
	stdout.write('\tbuilding CJS resources...');

	const baseConfig = {
		entryPoints: [path.join(SRC_DIR, 'object-observer.js')],
		outdir: path.join(DIST_DIR, 'cjs'),
		format: 'cjs',
		outExtension: { '.js': '.cjs' }
	};
	await esbuild.build(baseConfig);
	await esbuild.build({
		...baseConfig,
		entryPoints: [path.join(DIST_DIR, 'cjs', 'object-observer.cjs')],
		minify: true,
		sourcemap: true,
		sourcesContent: false,
		outExtension: { '.js': '.min.cjs' }
	});

	stdout.writeGreen('\tOK');
	stdout.writeNewline();
}

async function buildCDNResources() {
	stdout.write('\tbuilding CDN resources...');

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
