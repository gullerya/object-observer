/* eslint-disable unicode-bom */
import os from 'os';
import fs from 'fs';
import fsExtra from 'fs-extra';
import uglifyES from 'uglify-es';

process.stdout.write('cleaning "dist"...');
fsExtra.emptyDirSync('./dist');
process.stdout.write(`\t\t\t\x1B[32mOK\x1B[0m${os.EOL}`);

process.stdout.write('copying "src" to "dist"...');
fsExtra.copySync('./src', './dist');
process.stdout.write(`\t\t\x1B[32mOK\x1B[0m${os.EOL}`);

process.stdout.write(`postprocessing "dist"...${os.EOL}`);

//	TODO: to be removed when NodeJS start LTS of ES modules
process.stdout.write('rewriting export definition for NodeJS distribution (temporary, until ES6 modules become fully supported)');
const baseCode = fs.readFileSync('./dist/object-observer.js', { encoding: 'utf8' });
fsExtra.outputFileSync('./dist/node/object-observer.js', baseCode.replace('export { Observable };', 'exports.Observable = Observable;'));
process.stdout.write(`\t\x1B[32mOK\x1B[0m${os.EOL}`);

process.stdout.write('minifying...');
const options = {
	toplevel: true
};
fs.writeFileSync(
	'./dist/object-observer.min.js',
	uglifyES.minify(fs.readFileSync('./dist/object-observer.js', { encoding: 'utf8' }), options).code
);

//	TODO: to be removed when NodeJS start LTS of ES modules
fs.writeFileSync(
	'./dist/node/object-observer.min.js',
	uglifyES.minify(fs.readFileSync('./dist/node/object-observer.js', { encoding: 'utf8' }), options).code
);
process.stdout.write(`\t\t\t\t\x1B[32mOK\x1B[0m${os.EOL}`);