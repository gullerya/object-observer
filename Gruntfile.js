var fs = require('fs');

module.exports = function (grunt) {
    grunt.initConfig({
        jshint: {
            files: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
            options: {
                esversion: 6,
                globals: {
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.registerTask('test', ['jshint']);

    grunt.registerTask('build', 'Customized build', function () {
        grunt.log.writeln('Copy to "bin"');
        fs.writeFileSync('bin/object-observer.js', fs.readFileSync('src/object-observer.js'));
        grunt.log.ok();
    });
};