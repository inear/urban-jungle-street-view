'use strict';

var fs = require('fs');
var varStream = require('varstream');
var cfg = varStream.parse(fs.readFileSync(__dirname + '/config.dat'));

// Gulp plugins
var gulp = require('gulp');
var prefix = require('gulp-autoprefixer');
var rework = require('gulp-rework');
var component = require('gulp-component');
var rimraf = require('gulp-rimraf');

// Rework plugins
var vars = require('rework-vars');
var importer = require('rework-npm');
var inherit = require('rework-inherit');

// Component plugins
var json = require('component-json');
var stringToJs = require('component-string');


gulp.task('default', function() {
  gulp.run('dev');
});

gulp.task('dev', ['clean', 'dev-scripts', 'dev-styles'], function() {
  gulp.watch(cfg.src.styles + '/**/*.css', function() {
    gulp.run('dev-styles');
  });

  gulp.watch(cfg.src.scripts + '/**/*.js', function() {
    gulp.run('dev-scripts');
  });


  gulp.watch(cfg.src.scripts + '/**/*.glsl', function() {
    gulp.run('dev-scripts');
  });

  gulp.watch('./components/**/*.js', function() {
    gulp.run('dev-scripts');
  });
});

gulp.task('clean', function() {
  gulp.src(cfg.build.output, {
      read: false
    })
    .pipe(rimraf());
});

gulp.task('dev-styles', function() {
  // gulp.src(cfg.src.styles + '/index.css')
  //   .pipe(rework(importer(cfg.src.styles), vars(), inherit(), {
  //     sourcemap: true
  //   }))
  //   .pipe(prefix())
  //   .pipe(gulp.dest(cfg.build.output));
});

gulp.task('dev-scripts', function() {
  gulp.src('./component.json')
    .pipe(component({
      name: 'app',
      dev: true,
      use: [json(), stringToJs],
      out: cfg.build.output
    }))
    .pipe(gulp.dest(cfg.build.output));
});
