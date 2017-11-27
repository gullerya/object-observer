'use strict';

const fs = require('fs'),
	minifier = require('./tools/build-minify.js');

module.exports = function(grunt) {
	grunt.initConfig({
		eslint: {
			options: {
				configFile: 'eslint.json'
			},
			src: ['Gruntfile.js', 'src/**/*.js']
		}
	});

	grunt.loadNpmTasks("gruntify-eslint");

	grunt.registerTask('test', ['eslint']);

	grunt.registerTask('build', 'Customized build', function() {
		grunt.log.writeln('Copy to "dist"');
		fs.writeFileSync('dist/object-observer.js', fs.readFileSync('src/object-observer.js'));
		grunt.log.ok();
		minifier.execute();
	});

	grunt.registerTask('full-ci', 'Full CI Build cycle', function() {
		grunt.task.run('build');
		grunt.task.run('test');
	});
};