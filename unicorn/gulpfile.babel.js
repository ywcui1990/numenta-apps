/* -----------------------------------------------------------------------------
 * Copyright © 2015, Numenta, Inc. Unless you have purchased from
 * Numenta, Inc. a separate commercial license for this software code, the
 * following terms and conditions apply:
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Affero Public License version 3 as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero Public License for
 * more details.
 *
 * You should have received a copy of the GNU Affero Public License along with
 * this program. If not, see http://www.gnu.org/licenses.
 *
 * http://numenta.org/licenses/
 * -------------------------------------------------------------------------- */

'use strict';


/**
 * Gulp config
 * @flow
 */

// externals

import child from 'child_process';
import gulp from 'gulp';
import util from 'gulp-util';
import webpack from 'webpack';
import webpacker from 'webpack-stream';

// internals

import Config from './frontend/lib/ConfigServer';

const config = new Config();

let WebServer = null; // @TODO not global


// Individual Tasks

/**
 * Gulp task to run mocha-casperjs web test suite
 */
gulp.task('mocha-casperjs', (callback) => {
  /*
  let stream = child.spawn('mocha-casperjs', [
    '--bail',
    '--TEST_HOST=' + config.get('TEST_HOST'),
    '--TEST_PORT=' + config.get('TEST_PORT'),
    '--TEST_PATH=' + config.get('TEST_PATH')
  ]);

  console.log('Mocha-Casper: started. Output will follow soon...');

  stream.stdout.on('data', (data) => {
    process.stdout.write(data);
  });

  stream.on('close', (code) => {
    let success = code === 0; // Will be 1 in the event of failure

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
gulp.task('serve', () => {
  let stream = gulp.src('.')
    .pipe(gwebserver({ port: config.get('TEST_PORT') }))
    .on('error', console.error);

  WebServer = stream;

  return stream;
});

/**
 * Gulp task to run WebPack to transpile require/modules/Babel into bundle
 */
gulp.task('webpack', ()  => {
  let target = (config.get('UNICORN_TARGET') === 'desktop') ? 'atom' : 'web';

  return gulp.src('frontend/browser/app.js')
    .pipe(webpacker({
      devtool: 'source-map',
      module: {
        loaders: [{
          test: /\.(js|jsx)$/,
          loaders: [ 'babel-loader?stage=1' ],
          exclude: /node_modules/
        }, {
          test: /\.json$/,
          loader: 'json-loader'
        }]
      },
      output: {
        filename: 'bundle.js'
      },
      plugins: [
        new webpack.IgnorePlugin(/vertx/)  // @TODO remove in fluxible 4.x
      ],
      resolve: {
        extensions: [ '', '.js', '.json', '.jsx' ]
      },
      target
    }))
    .pipe(gulp.dest('frontend/browser/'));
});


// Task Compositions

gulp.task('default', []);
gulp.task('webtest', [ 'serve', 'mocha-casperjs' ]);
