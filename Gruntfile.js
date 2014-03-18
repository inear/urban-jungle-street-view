'use strict';

var fs = require('fs');
var path = require('path');
var json = require('component-json');

var stringToJs = require('component-string');

function server() {
  var path = require('path');
  var express = require('express');
  var app = express();

  app.use(express.static(path.resolve(path.join(__dirname, 'static'))));

  app.get('*', function(request, response) {
    response.sendfile(path.join(__dirname, 'static/index.html'));
  });

  app.listen(5010);
}

module.exports = function(grunt) {

  var _ = grunt.util._;

  var defaultComponentOpts = {
    output: 'static/build',
    base: '',
    name: 'app',
    scripts: true,
    styles: false,
    sourceUrls: true,
    configure: function(builder) {
      builder.use(json());
      builder.use(stringToJs);
    }
  };

  grunt.initConfig({

    // This will load in our package.json file so we can have access
    // to the project name and version number.
    pkg: grunt.file.readJSON('package.json'),

    BASE_PATH: './',
    DEVELOPMENT_PATH: './static/',
    PRODUCTION_PATH: './prod/',

    env: {
      options: {
        //Shared Options Hash
      },
      dev: {
        NODE_ENV: 'dev',
        DEST: 'build'
      },
      prod: {
        NODE_ENV: 'prod',
        DEST: 'prod'
      }
    },

    clean: {
      all: ['prod'],
      prod: ['prod']

    },

    banner: [
      '/*',
      '* Project: <%= pkg.name %>',
      '* Version: <%= pkg.version %> (<%= grunt.template.today("yyyy-mm-dd") %>)',
      '* Development By: <%= pkg.developedBy %>',
      '* Copyright(c): <%= grunt.template.today("yyyy") %>',
      '*/'
    ],

    // Install component.js dependencies.
    shell: {
      installcomponents: {
        command: 'component install -f'
      }
    },

    // Rebuild when we save a file.
    watch: {
      css: {
        files: ['static/**/*.scss'],

        tasks: ['compass:dev']
      },
      component: {
        files: [
          'static/app/**/*.js',
          'static/**/*.glsl'
        ],
        tasks: ['component_build:dev']
      }
    },

    // Start local server.
    connect: {
      // localhost:4000
      dev: {
        options: {
          hostname: '*',
          port: 4040,
          base: 'static'
        }
      }
    },

    // To keep your code clean, cowboy !
    jshint: {
      all: ['Gruntfile.js', 'static/app/**/*.js'],
      options: {
        jshintrc: '.jshintrc',
      }
    },

    // Build sass/compass styles.
    compass: {
      dev: {
        options: {
          config: 'config/compass-dev.rb',
        }
      },
      prod: {
        options: {
          config: 'config/compass-prod.rb',
          environment: 'production',
          force: true
        }
      },
    },

    // Build component.js module.
    component_build: {
      dev: _.defaults({}, defaultComponentOpts),
      prod: _.defaults({
        sourceUrls: false,
        verbose: false
      }, defaultComponentOpts)
    },

    copy: {
      prod: {
        files: [{
          expand: true,
          filter: 'isFile',
          cwd: 'static/',
          src: ['assets/**'],
          dest: 'prod'
        }]
      }
    },

    preprocess: {
      options: {
        context: {
          DEBUG: true
        }
      },
      html: {
        src: 'static/index.html',
        dest: 'prod/index.html'
      }
    },

    useminPrepare: {
      html: 'static/index.html',
      options: {
        dest: 'prod'
      }
    },

    usemin: {
      html: 'prod/index.html'
    }

  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-compass');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-component-build');
  grunt.loadNpmTasks('grunt-env');
  grunt.loadNpmTasks('grunt-preprocess');
  grunt.loadNpmTasks('grunt-usemin');
  grunt.loadNpmTasks('grunt-shell');

  grunt.registerTask('default', ['dev']);

  grunt.registerTask('prod', [
    'env:prod',
    //'clean:prod',
    'compass:prod',
    'component_build:prod',
    'copy:prod',
    'preprocess',
    'useminPrepare',
    'concat',
    'uglify',
    'usemin',
  ]);

  grunt.registerTask('dev', function(opt) {
    if (opt === 'server') {
      grunt.log.ok('Start server: http://localhost:5010');
      server();
    }

    grunt.task.run([
      'env:dev',
      'compass:dev',
      'component_build:dev',
      'watch'
    ]);
  });
};
