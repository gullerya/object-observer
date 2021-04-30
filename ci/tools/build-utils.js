/* eslint-disable unicode-bom */
import os from 'os';
import fs from 'fs';
import path from 'path';
import process from 'process';
import uglifyES from 'uglify-es';

const
	filesToCopy = ['object-observer.js'],
	filesToMinify = ['object-observer.js'];

process.stdout.write(`\x1B[32mStarting the build...\x1B[0m${os.EOL}${os.EOL}`);

process.stdout.write('\tcleaning "dist"...');
fs.rmdirSync('./dist', { recursive: true });
fs.mkdirSync('./dist');
process.stdout.write(`\t\t\x1B[32mOK\x1B[0m${os.EOL}`);

process.stdout.write('\tcopying "src" to "dist"...');
for (const fileToCopy of filesToCopy) {
	fs.copyFileSync(path.join('./src', fileToCopy), path.join('./dist', fileToCopy));
}
process.stdout.write(`\t\x1B[32mOK\x1B[0m${os.EOL}`);

process.stdout.write('\tminifying...');
const options = {
	toplevel: true
};
for (const fileToMinify of filesToMinify) {
	const fp = path.join('./dist', fileToMinify);
	const mfp = path.join('./dist', fileToMinify.replace(/\.js$/, '.min.js'));
	const fc = fs.readFileSync(fp, { encoding: 'utf8' });
	const mfc = uglifyES.minify(fc, options).code;
	fs.writeFileSync(mfp, mfc);
}
process.stdout.write(`\t\t\t\x1B[32mOK\x1B[0m${os.EOL}${os.EOL}`);

process.stdout.write(`\x1B[32mDONE\x1B[0m${os.EOL}`);
