module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: {
      options: {
        force: true
      },
      build: {
        src: ['build/']
      }
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
    },
    watch: {
      src: {
        files: ['src/js/hill.js'],
        tasks: ['jshint', 'copy:main']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');

  // dev task
  grunt.registerTask('dev', ['clean', 'jshint', 'copy', 'watch']);

  // Default task(s).
  grunt.registerTask('default', ['clean', 'jshint', 'copy', 'uglify']);

  grunt.registerTask('test', ['clean', 'copy']);

};