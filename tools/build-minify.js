'use strict';

const os = require('os'),
	fs = require('fs'),
	uglifyES = require('uglify-es');

module.exports.execute = function() {
	process.stdout.write('starting minification...' + os.EOL);

	fs.writeFileSync(
		'dist/object-observer.min.js',
		uglifyES.minify({'dist/object-observer.min.js': fs.readFileSync('dist/object-observer.js', {encoding: 'utf8'})}).code
	);
	process.stdout.write('\tdist/object-observer.min.js\t\t\t\x1B[32mOK\x1B[0m' + os.EOL);

	process.stdout.write('minification completed' + os.EOL + os.EOL);
};