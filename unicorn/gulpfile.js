/* -----------------------------------------------------------------------------
 * Copyright © 2015, Numenta, Inc. Unless you have purchased from
 * Numenta, Inc. a separate commercial license for this software code, the
 * following terms and conditions apply:
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License version 3 as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * this program. If not, see http://www.gnu.org/licenses.
 *
 * http://numenta.org/licenses/
 * -------------------------------------------------------------------------- */


/**
 * Gulp config
 */

// externals

var gulp =    require('gulp');
var package = require('./package.json');
var spawn =   require('child_process').spawn;
var util =    require('gulp-util');
var webpack = require('gulp-webpack');

// internals

var host = process.env.TEST_HOST || 'http://localhost';
var port = process.env.TEST_PORT || 8008;
var path = process.env.TEST_PATH || '';

var WebServer = null; // TODO: not global


// Individual Tasks

/**
 * Gulp task to run mocha-casperjs web test suite
 */
gulp.task('mocha-casperjs', function (callback) {
  /*
  var stream = spawn('mocha-casperjs', [
    '--bail',
    '--TEST_HOST=' + host,
    '--TEST_PORT=' + port,
    '--TEST_PATH=' + path
  ]);

  console.log('Mocha-Casper: started. Output will follow soon...');

  stream.stdout.on('data', function (data) {
    process.stdout.write(data);
  });

  stream.on('close', function (code) {
    var success = code === 0; // Will be 1 in the event of failure

    if(WebServer) {
      WebServer.emit('kill');
      WebServer = null;
    }

    if(! success) {
      // fail
      callback(new Error('Mocha-Casper: failed!'));
      return;
    }

    // success
    console.log('Mocha-Casper: success!');
    callback();
  });

  stream.on('error', console.error);

  return stream;
  */
});

/**
 * Gulp task to serve site from the _site/ build dir
 */
gulp.task('serve', function () {
  /*
  var stream = gulp
    .src('.') // TODO: fix
    .pipe(gwebserver({ port: port }))
    .on('error', console.error);

  WebServer = stream;

  return stream;
  */
});

/**
 * Gulp task to run WebPack to transpile require/modules/Babel into bundle
 */
gulp.task('webpack', function() {
  var target = util.env.target || 'web';
  return gulp.src('gui/browser/js/app.js')
    .pipe(webpack({
      module: {
        loaders: [
          // { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' }
        ]
      },
      output: {
        filename: 'bundle.js'
      },
      target: target
    }))
    .pipe(gulp.dest('gui/browser/'));
});


// Task Compositions

gulp.task('default', []);
gulp.task('webtest', [ 'serve', 'mocha-casperjs' ]);
