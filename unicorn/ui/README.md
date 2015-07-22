# Unicorn - User Interface

This `ui/` directory is for the Cross-platform Desktop Application, running
Javascript and Web code on [Electron](https://github.com/atom/electron),
[Node.js](https://nodejs.org/), and
[Google Chromium](https://www.chromium.org/Home). This code exposes the
functionality of the HTM Engine in the sibling `htm/` directory.


## Technology

Defined in file: `package.json`

* Framework: [Electron](https://github.com/atom/electron)
  * Engines: [Chromium](https://www.chromium.org/Home),
    [Node](https://github.com/joyent/node)
  * Module Loader: [WebPack](https://github.com/webpack/webpack)
  * User Interface:
    * Architecture: TBD [FLUX](https://github.com/facebook/flux) ?
    * Views and Templates: [React](https://github.com/facebook/react)
    * CSS Transpiler: [SASS](https://github.com/sass/node-sass)
* Testing:
  * Test Runner, Unit Tests: [Mocha](https://github.com/mochajs/mocha)
  * Web Tests: [Casper](https://github.com/n1k0/casperjs)


## Development

* Styleguides:
  * [ES5 Styleguide](https://github.com/felixge/node-style-guide) (Javascript)
    * [ES6 Styleguide]() TBD ?
    * [ES7 Styleguide]() TBD ?
  * [HTML5 Spec](https://html.spec.whatwg.org/)
  * [CSS3 Spec](https://developer.mozilla.org/en-US/docs/Web/CSS)
    * [SASS Spec](http://sass-lang.com/)


## Filesystem

### Files

File | Description
-----|------------
README.md | This file, a project overview
gulpfile.js | Config file for the Gulp build tool
index.js | Main point-of-entry for our Application
package.json | Node.js `npm` packages, dependencies, and App config

### Directories

Path | Description
-----|------------
node_modules/ | Where `npm` installs packages to
test/ | Unit and Web tests run by Mocha
