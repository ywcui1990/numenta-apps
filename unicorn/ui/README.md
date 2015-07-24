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
    [IO.js](https://iojs.org/), [Node](https://github.com/joyent/node)
  * Module Loader: [WebPack](https://github.com/webpack/webpack)
  * User Interface:
    * Architecture: [Fluxible](htts://fluxible.io/)
    * View Components: [React](https://github.com/facebook/react),
      [JSX](https://facebook.github.io/jsx/)
    * CSS Transpiler: [SASS](https://github.com/sass/node-sass)
* Testing:
  * Test Runner, Unit Tests: [Mocha](https://github.com/mochajs/mocha)
  * Web Tests: [Casper](https://github.com/n1k0/casperjs)


## Development

### Dependencies

Example of setting up development environment:

```
brew install git node   # Mac OS X
git clone https://github.com/numenta/numenta-apps
cd numenta-apps/unicorn/ui
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


## Filesystem

```
README.md       # This file, a project overview
browser/        # Javascript, HTML, CSS that acts as GUI inside browser window
  css/          # GUI Styles for App in browser
  img/          # GUI Imagery for App in browser
  index.html    # App main startup browser window contents
  js/           # GUI Javascript for App in browser
    app.js      # GUI Web App entry point script, compiles to bundle.js
    bundle.js   # WebPack automated output compiled Javascript bundle
gulpfile.js     # Config file for the Gulp build tool
lib/            # Javascript that lives outside the browser window
main.js         # Electron App entry point, creates browser GUI window(s)
node_modules/   # Where `npm` installs packages to
package.json    # Node.js `npm` packages, dependencies, and App config
test/           # Unit and Web tests run by Mocha
```
