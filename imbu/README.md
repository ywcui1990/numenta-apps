# Numenta Imbu

IMBU is a web application to demonstrate applications of Hierarchical
Temporal Memory (HTM) to Natural Language Processing (NLP) problems, as well as
support ongoing research.  Originally based off of the
[nupic.fluent](https://github.com/numenta-archive/nupic.fluent) OSS community
project, IMBU is a project of its own in
[nupic.research](https://github.com/numenta/nupic.research).

## License

  AGPLv3. See [LICENSE.txt](LICENSE.txt)


## Repository

```shell
.
├── Dockerfile                     # Docker build file
├── LICENSE.txt                    # Dual: Commercial and AGPLv3
├── README.md                      # This file, a project overview
├── conf/
│   ├── mime.types                 # nGinx mime types configuration
│   ├── nginx-fluent.conf          # Main nGinx configuration file
│   ├── nginx-supervisord.conf     # nGinx-specific supervisor configuration
│   ├── nginx-uwsgi.conf           # nGinx reverse proxy configuration
│   └── supervisord.conf           # Main supervisor configuration file
├── engine/
│   ├── data.csv                   # IMBU data set
│   └── fluent_api.py              # Python web application
├── gui/
│   ├── browser/
│   │   ├── actions/
│   │   │   ├── search-clear.js
│   │   │   ├── search-query.js
│   │   │   └── server-status.js
│   │   ├── app.js                 # Fluxible application entry point
│   │   ├── components/
│   │   │   ├── main.jsx           # Main JSX template
│   │   │   ├── search-history.jsx
│   │   │   ├── search-results.jsx
│   │   │   └── search.jsx
│   │   ├── css/
│   │   │   └── main.css           # Main CSS file
│   │   ├── index.html             # HTML Index
│   │   └── stores/
│   │       ├── search.js
│   │       └── server-status.js
│   ├── loader.js                  # Javascript initialization
│   └── main.js                    # Application entry point, initializes browser app
├── gulpfile.babel.js              # Babel.js ES6 Config file for the Gulp build tool
├── package.json                   # Node.js `npm` packages, dependencies, and App config
├── requirements.txt               # Python dependencies
├── setup.py                       # Python setuptools install entry point
└── start_imbu.sh                  # IMBU startup entry point
```

## Technology Stack

IMBU is implemented as a hybrid Python and Javascript application -- Javascript
on the front end, Python on the back end.

### Javascript:

- [npm](https://www.npmjs.com/), for Javascript package management
- [Gulp](http://gulpjs.com/), for building Javascript frontend
- [Fluxible](http://fluxible.io/), for frontend framework
- [Babel](https://babeljs.io/), for compiling JSX templates

### Python:

- [NuPIC](http://numenta.org/), Machine Intelligence research platform

### Infrastructure:

- [nGinx](https://www.nginx.com/), for serving content
- [uWSGI](https://uwsgi-docs.readthedocs.org/en/latest/), for running Python web app
- [Docker](https://www.docker.com/), for reproducible build and runtime environment

### Third-party Services:

- [Cortical.io](http://www.cortical.io/)

## Front End

TBD

## Back End

IMBU implements a web service API at `/fluent`, supporting a `POST` HTTP
method for querying IMBU models.

## Data Flow

TBD

## Running IMBU

### Cortical.io Setup

1. Get [cortical.io](http://www.cortical.io/) API key from http://www.cortical.io/resources_apikey.html
1. Create `CORTICAL_API_KEY` environment variable with your new API key.
1. Create `IMBU_RETINA_ID` environment variable with the name of the *retina* to use.

### Run IMBU in Docker

In the root of `numenta-apps/imbu`:

```
cp /your/formatted/data.csv engine/data.csv
docker build -t imbu:latest .
docker run --name imbu -d -p 8080:80 -e CORTICAL_API_KEY=${CORTICAL_API_KEY} -e IMBU_RETINA_ID=${IMBU_RETINA_ID} imbu:latest
```

Open application from this URL: http://localhost:8080
