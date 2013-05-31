module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: {
      folder: "build/"
    },
    copy: {
      main: {
        files: [
          {expand: true, cwd: 'src/', flatten: false, src: ['**'], dest: 'build/'}
        ]
      }
    },
    uglify: {
      my_target: {
        files: {
          'build/js/hill.js': ['src/js/hill.js']
        }
      }
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        eqnull: true,
        browser: true,
        evil: true
      },
      all: ['Gruntfile.js', 'src/js/*.js']
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib');

  // Default task(s).
  grunt.registerTask('default', ['clean', 'jshint', 'copy', 'uglify']);

  grunt.registerTask('test', ['clean', 'copy']);

  };