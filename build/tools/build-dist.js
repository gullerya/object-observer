const
	os = require('os'),
	fs = require('fs'),
	fsExtra = require('fs-extra'),
	uglifyES = require('uglify-es');

process.stdout.write('cleaning "dist"...');
fsExtra.emptyDirSync('./dist');
process.stdout.write('\t\t\t\x1B[32mOK\x1B[0m' + os.EOL);

process.stdout.write('copying "src" to "dist"...');
fsExtra.copySync('./src', './dist');
process.stdout.write('\t\x1B[32mOK\x1B[0m' + os.EOL);
process.stdout.write('postprocessing "dist"...' + os.EOL);
process.stdout.write('\trewriting export definition for NodeJS distribution (temporary, until ES6 modules become fully supported)');
let baseCode = fs.readFileSync('./dist/object-observer.js', {encoding: 'utf8'});
fsExtra.outputFileSync('./dist/node/object-observer.js', baseCode.replace("export {Observable}", 'exports.Observable = Observable'));
process.stdout.write('\t\x1B[32mOK\x1B[0m' + os.EOL);

process.stdout.write('minifying...');
let options = {
	toplevel: true
};
fs.writeFileSync(
	'./dist/object-observer.min.js',
	uglifyES.minify(fs.readFileSync('./dist/object-observer.js', {encoding: 'utf8'}), options).code
);
fs.writeFileSync(
	'./dist/node/object-observer.min.js',
	uglifyES.minify(fs.readFileSync('./dist/node/object-observer.js', {encoding: 'utf8'}), options).code
);
process.stdout.write('\t\t\t\t\x1B[32mOK\x1B[0m' + os.EOL);