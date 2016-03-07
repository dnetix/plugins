module.exports = function(grunt){

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        watch: {
            dev: {
                files: ['src/js/*.js', 'src/less/*.less'],
                tasks: ['dev'],
                options: {
                    spawn: false
                }
            }
        },
        filegen: {
            version: {
                options: {
                    content: "'use strict'; module.exports = '<%= pkg.version %>';"
                },
                dest: 'src/build/version.js'
            }
        },
        browserify: {
            build: {
                options:{
                    browserifyOptions: {
                        standalone: 'StockG'
                    }
                },
                files: {
                    'src/build/bundle.js' : 'src/js/index.js'
                }
            },
            dev: {
                options:{
                    browserifyOptions: {
                        standalone: 'StockG'
                    }
                },
                files: {
                    'src/build/bundle.js' : 'src/js/index.js'
                }
            }
        },
        uglify: {
            build: {
                src: "src/build/bundle.js",
                dest: "js/stock-g.min.js"
            },
            dev: {
                options: {
                    beautify: true,
                    mangle: false,
                    compress: false,
                    preserveComments: 'all'
                },
                src: 'src/build/bundle.js',
                dest: 'js/stock-g.js'
            }
        },
        less: {
            build: {
                options: {
                    compress: true
                },
                files: {
                    'css/stock-g.min.css' : 'src/less/stock-g.less'
                }
            },
            dev: {
                options: {
                    compress: false
                },
                files: {
                    'css/stock-g.css' : 'src/less/stock-g.less'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-less');

    grunt.loadTasks('src/lib');

    grunt.registerTask('default', ['filegen:version', 'browserify:build', 'uglify:build', 'less:build']);
    grunt.registerTask('dev', ['filegen:version', 'browserify:dev', 'uglify:dev', 'less:dev']);
};