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
process.stdout.write('postprocessing "dist"...');
let baseCode = fs.readFileSync('./dist/module/object-observer.js', {encoding: 'utf8'});
fsExtra.outputFileSync('./dist/module/object-observer.js', baseCode + os.EOL + 'export default Observable;');
fsExtra.outputFileSync('./dist/node-module/object-observer.js', baseCode + os.EOL + 'module.exports = Observable;');
process.stdout.write('\t\x1B[32mOK\x1B[0m' + os.EOL);

process.stdout.write('minifying...');
let options = {
	toplevel: true
};
fs.writeFileSync(
	'./dist/module/object-observer.min.js',
	uglifyES.minify(fs.readFileSync('./dist/module/object-observer.js', {encoding: 'utf8'}), options).code
);
fs.writeFileSync(
	'./dist/node-module/object-observer.min.js',
	uglifyES.minify(fs.readFileSync('./dist/node-module/object-observer.js', {encoding: 'utf8'}), options).code
);
fs.writeFileSync(
	'./dist/object-observer.min.js',
	uglifyES.minify(fs.readFileSync('./dist/object-observer.js', {encoding: 'utf8'}), options).code
);
process.stdout.write('\t\t\t\t\x1B[32mOK\x1B[0m' + os.EOL);