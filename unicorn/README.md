# Numenta Unicorn

> CURRENTLY UNDER HEAVY DEVELOPMENT!

Cross-platform Desktop Application to demonstrate basic HTM functionality to
users using their own data files.


## Repository

The `gui/` directory contains Cross-platform Desktop Application GUI code,
running Javascript/HTML/CSS/etc. on [Node.js](https://nodejs.org/),
[Electron](https://github.com/atom/electron), and
[Google Chromium](https://www.chromium.org/Home). This code exposes the
functionality of the HTM Engine in the sibling `engine/` directory.

The `engine/` directory contains NuPIC HTM Engine and Util code (Python / C++),
which drives the main functionality of the app, which it is our goal to demo
to the user.

```shell
DEPENDENCIES.md     # Module dependency overview file
LICENSE.txt         # Dual: Commercial and GPLv3
README.md           # This file, a project overview
engine/             # NuPIC HTM Engine and Utils, Python/C++ code here!
  README.md         # Overview for HTM/NuPIC part of project
  requirements.txt  # Engine main Python module dependencies
gui/                # GUI that exposes NuPIC HTM functionality to the User
  browser/          # Javascript, HTML, CSS act as GUI inside browser window
    bundle.js       # WebPack automated output compiled Javascript bundle
    index.html      # App main startup browser window contents
    css/            # GUI Styles for App in browser
    img/            # GUI Imagery for App in browser
    js/             # GUI Javascript for App in browser
      app.js        # GUI Web App entry point script, compiles to bundle.js
  lib/              # Javascript that lives outside the browser window
  main.js           # Electron App entry point, creates browser GUI window(s)
  test/             # GUI Unit and Web tests run by Mocha
    unit/           # GUI Unit tests (code)
    web/            # GUI Web tests (user)
gulpfile.js         # Config file for the Gulp build tool
node_modules/       # Where `npm` installs packages to
package.json        # Node.js `npm` packages, dependencies, and App config
```


## Technology

### Engine

> See: `engine/requirements.txt`

* Languages:
  * [Python](http://python.org) 2.7
  * [C++](https://isocpp.org/)
* [NuPIC](htts://github.com/numenta/nupic) 0.2.x

### GUI

> See: `package.json`

* Languages:
  * Javascript
    * [ECMAScript 5.1](https://es5.github.io/) (>= IE9)
    * [ECMAScript 6](https://babeljs.io/docs/learn-es2015/) (aka ES2015) via
      [Babel](https://babeljs.io/)
  * [HTML5](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5)
  * [CSS3](https://developer.mozilla.org/en-US/docs/Web/CSS) with
    [SASS](http://sass-lang.com/) via
    [node-sass](https://github.com/sass/node-sass)
* Framework: [Electron](https://github.com/atom/electron)
  * Engines: [Chromium](https://www.chromium.org/Home),
    [IO.js](https://iojs.org/), [Node](https://github.com/joyent/node)
  * Module Loader: [WebPack](https://github.com/webpack/webpack)
  * User Interface:
    * Architecture: [Fluxible](http://fluxible.io/)
      ([Flux](https://facebook.github.io/flux/docs/overview.html#content)
      Uni-directional data flow)
    * View Components: [React](https://github.com/facebook/react),
      [JSX](https://facebook.github.io/jsx/)
* Testing:
  * Test Runner, Unit Tests: [Mocha](https://github.com/mochajs/mocha)
  * Web Tests: [Casper](https://github.com/n1k0/casperjs)


## Development

### Dependencies

Example of setting up development environment:

```
brew install git node  # darwin
git clone https://github.com/numenta/numenta-apps
cd numenta-apps/unicorn
npm install
```

### Development: Desktop

Start code via Electron as a Desktop App:

```
npm run start
```

### Development: Web

Start app on local webserver, you can open it with Chrome Browser
at http://localhost:9999:

```
npm run dev
```


## Guidelines

* [ES5 Styleguide](https://github.com/felixge/node-style-guide) (Javascript)
  * [ES6 Styleguide]() TBD ?
  * [ES7 Styleguide]() TBD ?
* [HTML5 Spec](https://html.spec.whatwg.org/)
* [CSS3 Spec](https://developer.mozilla.org/en-US/docs/Web/CSS)
  * [SASS Spec](http://sass-lang.com/)
