import os from 'os';
import fs from 'fs';
import path from 'path';
import process from 'process';
import uglifyES from 'uglify-es';
import { updateIntegrity } from './integrity-utils.js';

const
	SRC = 'src',
	DIST = 'dist',
	CDN = 'cdn',
	filesToCopy = ['object-observer.js'],
	filesToMinify = ['object-observer.js'];

process.stdout.write(`\x1B[32mStarting the build...\x1B[0m${os.EOL}`);
process.stdout.write(os.EOL);

ensureCleanDir(DIST);

process.stdout.write(`\tcopying "${SRC}" to "${DIST}"...`);
for (const fileToCopy of filesToCopy) {
	fs.copyFileSync(path.join(SRC, fileToCopy), path.join(DIST, fileToCopy));
}
process.stdout.write(`\t\x1B[32mOK\x1B[0m${os.EOL}`);

process.stdout.write('\tminifying...');
const options = {
	toplevel: true
};
for (const fileToMinify of filesToMinify) {
	const fp = path.join(DIST, fileToMinify);
	const mfp = path.join(DIST, fileToMinify.replace(/\.js$/, '.min.js'));
	const fc = fs.readFileSync(fp, { encoding: 'utf8' });
	const mfc = uglifyES.minify(fc, options).code;
	fs.writeFileSync(mfp, mfc);
}
process.stdout.write(`\t\t\t\x1B[32mOK\x1B[0m${os.EOL}`);

buildCDNDistro(DIST, CDN);

updateIntegrity(path.join(DIST, CDN));

process.stdout.write(os.EOL);
process.stdout.write(`\x1B[32mDONE\x1B[0m${os.EOL}`);

function ensureCleanDir(dir) {
	process.stdout.write(`\tcleaning "${dir}"...`);
	fs.rmdirSync(dir, { recursive: true });
	fs.mkdirSync(dir);
	process.stdout.write(`\t\t\x1B[32mOK\x1B[0m${os.EOL}`);
}

function buildCDNDistro(dir, cdn) {
	process.stdout.write('\tbuilding CDN resources...');
	fs.mkdirSync(path.join(dir, cdn), { recursive: true });
	for (const file of filesToMinify) {
		fs.copyFileSync(path.join(dir, file), path.join(dir, cdn, file));
		fs.copyFileSync(path.join(dir, file.replace('.js', '.min.js')), path.join(dir, cdn, file.replace('.js', '.min.js')));
	}
	process.stdout.write(`\t\x1B[32mOK\x1B[0m${os.EOL}`);
}