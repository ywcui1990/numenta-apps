HTM Engine
==========

HTM Engine is a framework used for creating and running hundreds of NuPIC anomaly detection models simultaneously. It manages memory and CPU usage by serializing models to disk when they are inactive. This means models only utilize system resources when they are learning new data and returning anomaly indications.

Tutorial Application
--------------------

An [example application of HTM Engine](https://github.com/nupic-community/htmengine-traffic-tutorial) is available with an [accompanying screencast](https://www.youtube.com/watch?v=lzJd_a6y6-E).

[![YouTube Screenshot of HTM Engine Tutorial](http://img.youtube.com/vi/lzJd_a6y6-E/hqdefault.jpg)](https://www.youtube.com/watch?v=lzJd_a6y6-E)
> A walkthrough of the HTM Engine with an example application of New York City live traffic speeds.


Installation
------------

First, install [`nta.utils`](../nta.utils).  Then, to install `htmengine`:

    python setup.py develop --install-dir=<site-packages in $PYTHONPATH>

- `--install-dir` must specify a location in your PYTHONPATH, typically
  something that ends with "site-packages".  If not specified, system default
  is used.

### Requirements

- [rabbitmq](https://www.rabbitmq.com/download.html) 3.5 (or higher)
- [mysql](http://dev.mysql.com/downloads/mysql/) 5.6 (or higher)

Environment Variables
---------------------

`APPLICATION_CONFIG_PATH` **(REQUIRED)**: Directory path where active
application-specific configuration files are located.

Quick Start
-----------

For a quick and easy way to get an application up an running with HTM Engine, see the [skeleton-htmengine-app](https://github.com/nupic-community/skeleton-htmengine-app). It provides a basic application scaffolding for the HTM Engine that you can easily interface with over HTTP using your favorite programming environment.

Usage
-----

HTM Engine exposes a number of services that can be used to process custom
metrics.

### Metric Listener

    htmengine.runtime.metric_listener

Lightweight service that listens on a socket, exposes a graphite-compatible
interface for accepting metric data and forwards to Metric Storer.

### Metric Storer

    htmengine.runtime.metric_storer

Background process that saves metric data to database.

### Model Scheduler

    htmengine.model_swapper.model_scheduler_service

Streams metric data to models and records results.

### Anomaly Service

    htmengine.runtime.anomaly_service

Computes log-likelihood anomaly scores for each metric.

---

See `conf/supervisord-base.conf` for invocation of individual services.  To
include `htmengine` services in an application, include
`conf/supervisord-base.conf` in a complete supervisord configuration.  For
example:

    [unix_http_server]
    file=%(here)s/../taurus-supervisor.sock   ; (the path to the socket file)

    [inet_http_server]
    port=127.0.0.1:9001

    [supervisord]
    environment=APPLICATION_CONFIG_PATH=/opt/numenta/taurus/conf
    pidfile=%(here)s/../taurus-supervisord.pid
    identifier=taurus-supervisor
    logfile=%(here)s/../logs/taurus-supervisord.log
    # NOTE: logfile_maxbytes=0 turns off supervisor log rotation to prevent conflict
    # with Taurus' higher-level log rotation triggered by crontab
    logfile_maxbytes=0
    logfile_backups=10
    loglevel=info
    nodaemon=false
    minfds=1024
    minprocs=200

    [rpcinterface:supervisor]
    supervisor.rpcinterface_factory = supervisor.rpcinterface:make_main_rpcinterface

    [rpcinterface:supervisor]
    supervisor.rpcinterface_factory = supervisor.rpcinterface:make_main_rpcinterface

    [supervisorctl]
    serverurl=http://:

    [include]
    files = ../../htmengine/conf/supervisord-base.conf

Running HTMEngine Integration Tests
-----------------------------------

The HTM engine has a basic skeleton application exclusively for running tests.
To run the tests, you must have MySQL, RabbitMQ, and Supervisor running.

Make sure that `APPLICATION_CONFIG_PATH` is set to point to `tests/support/skeleton-app/conf`
For example:
```export APPLICATION_CONFIG_PATH=/Users/{name}/nta/numenta-apps/htmengine/tests/support/skeleton-app/conf```
(alternatively you can use the `APPLICATION_CONFIG_PATH` from an app based off
of the HTMEngine, just be careful to not reset an existing MySQL database)

With MySQL already started start/restart RabbitMQ:
`rabbitmq-server -detached`

Setup the htmengine MySQL database:
(don't do this if you're testing on Grok, Taurus, or another HTMEngine application)
`./tests/support/skeleton-app/reset_db.py`

Start `supervisord`:
```cd tests/support/skeleton-app```
```supervisord -c conf/supervisord.conf```
*NOTE: Be sure to run `mkdir logs` within the `skeleton-app` directory so
supervisor has a place to store its logs*

Run the integration tests:
`py.test tests/integration`
