module.exports = function(grunt) {
    'use strict';
    grunt.registerMultiTask('filegen', 'Create a file with contents', function() {
        var content = this.options().content;

        this.files.forEach(function(file) {
            grunt.log.ok('File: ' + file.dest);
            grunt.file.write(file.dest, content);
        });
    });
};