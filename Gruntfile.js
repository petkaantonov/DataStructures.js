module.exports = function( grunt ) {

    var BUILD_DEST = '.dist/data_structures.js',
        MIN_DEST = '.dist/data_structures.min.js',
        COMPRESSED_DEST = '.dist/data_structures.min.js.gz';

    var gruntConfig = {};

    gruntConfig.pkg = grunt.file.readJSON("package.json");

    gruntConfig.concat = {
        options: {
            separator: ';\n',

            stripBanners: {
                block: true,
                line: true
            }
        },

        dist: {
            src: [
                "./build/begin.js",

                "./src/core.js",
                "./src/object.js",

                "./src/red_black_tree_util.js",
                "./src/red_black_tree_node.js",
                "./src/red_black_tree.js",

                "./src/map.js",
                "./src/orderedmap.js",
                "./src/sortedmap.js",
                "./src/set.js",
                "./src/orderedset.js",
                "./src/sortedset.js",

                "./src/export.js",

                "./build/end.js"
            ],

            nonull: true,

            dest: BUILD_DEST
        }

    };

    gruntConfig.watch = {
        scripts: {
            files: [
                "./src/**/*"
            ],
            tasks: ['concat'],
            options: {
              interrupt: true,
              debounceDelay: 2500
            }
        }
    };

    gruntConfig.jshint = {
        all: {
            options: {
                jshintrc: "./jshint.json"
            },

            files: {
                src: [
                    './src/**/*.js',
                    './test/**/*.js'
                ]
            }
        }
    };

    gruntConfig.qunit = {
        all: [ './test/*.html']
    };

    gruntConfig["closure-compiler"] = {
        frontend: {
            closurePath: '../closure_compiler',
            js: BUILD_DEST,
            jsOutputFile: MIN_DEST,
            maxBuffer: 8192,
            options: {
                compilation_level: 'SIMPLE_OPTIMIZATIONS',
                language_in: 'ECMASCRIPT5',
                charset: "UTF-8",
                debug: false
            },
            noreport: true
        }
    };

    gruntConfig.compress = {
        dist: {
            options: {
                mode: "gzip"
            },

            files: [{
                src: MIN_DEST,
                dest: COMPRESSED_DEST
            }]
        }
    };

    grunt.initConfig(gruntConfig);

    grunt.registerTask( "default", ["concat"] );
    grunt.registerTask( "test", ["jshint", "concat", "qunit"] );
    grunt.registerTask( "production", ["test", "closure-compiler", "compress"] );

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-closure-compiler');
    grunt.loadNpmTasks('grunt-contrib-compress');


};