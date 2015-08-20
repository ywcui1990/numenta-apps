/* ----------------------------------------------------------------------
 * Numenta Platform for Intelligent Computing (NuPIC)
 * Copyright (C) 2015, Numenta, Inc.  Unless you have purchased from
 * Numenta, Inc. a separate commercial license for this software code, the
 * following terms and conditions apply:
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero Public License version 3 as
 * published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero Public License for more details.
 *
 * You should have received a copy of the GNU Affero Public License
 * along with this program.  If not, see http://www.gnu.org/licenses.
 *
 * http://numenta.org/licenses/
 * ---------------------------------------------------------------------- */

describe('Grok API JS Client', function() {

    describe('when constructed without options', function() {

        var grok =      new GrokAPI(),
            handle =    null;

        it('should provide proper default options', function() {
            expect(grok.opts).to.eql({
                apiKey:     '',
                endPoint:   '',
                dataSource: 'cloudwatch'
            });
        });

        describe('when making a request', function() {

            it('takes a single url param', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts).to.eql('url');
                    return {};
                };
                handle = grok._makeRequest('url');
                expect(handle).to.be.an('object');
            });
            it('takes a jQuery param object', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.eql('url');
                    expect(opts.type).to.eql('GET');
                    return {};
                };
                handle = grok._makeRequest({
                    url: 'url',
                    type: 'GET'
                });
                expect(handle).to.be.an('object');
            });

            // calls callback

            it('calls callback (pass)', function() {
                grok._makeRequest = function(opts, callback) {
                    callback(null, 'success');
                    return {};
                };
                handle = grok._makeRequest('url', function(error, result) {
                    expect(error).to.be(null);
                    expect(result).to.be('success');
                });
                expect(handle).to.be.an('object');
            });
            it('calls callback (fail)', function() {
                grok._makeRequest = function(opts, callback) {
                    callback('fail');
                    return {};
                };
                handle = grok._makeRequest('url', function(error, result) {
                    expect(error).to.be('fail');
                });
                expect(handle).to.be.an('object');
            });

        });

        describe('when handling users', function() {

            // authorizes a users credentials

            it('authorizes a users credentials (pass)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.AUTH
                    ].join('/'));
                    expect(opts.type).to.be('POST');
                    expect(opts.data).to.be(JSON.stringify({
                        key: 'key',
                        val: 'val'
                    }));
                    callback(null, 'success');
                    return {};
                };
                handle = grok.auth(
                    {
                        key: 'key',
                        val: 'val'
                    },
                    function(error, result) {
                        expect(error).to.be(null);
                        expect(result).to.be('success');
                    }
                );
                expect(handle).to.be.an('object');
            });
            it('authorizes a users credentials (fail)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.AUTH
                    ].join('/'));
                    callback('fail');
                    return {};
                };
                handle = grok.auth(
                    {},
                    function(error, result) {
                        expect(error).to.be('fail');
                    }
                );
                expect(handle).to.be.an('object');
            });

        });

        describe('when handling user settings', function() {

            // sends user settings

            it('sends user settings (pass)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.SETTINGS,
                        grok.CONST.SETTINGS.SECTIONS.AWS
                    ].join('/'));
                    expect(opts.type).to.be('POST');
                    expect(opts.data).to.be(JSON.stringify({
                        key: 'key',
                        val: 'val'
                    }));
                    callback(null, 'success');
                    return {};
                };
                handle = grok.putSettings(
                    {
                        key: 'key',
                        val: 'val'
                    },
                    grok.CONST.SETTINGS.SECTIONS.AWS,
                    function(error, result) {
                        expect(error).to.be(null);
                        expect(result).to.be('success');
                    }
                );
                expect(handle).to.be.an('object');
            });
            it('sends user settings (fail)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.SETTINGS,
                        grok.CONST.SETTINGS.SECTIONS.AWS
                    ].join('/'));
                    callback('fail');
                    return {};
                };
                handle = grok.putSettings(
                    {},
                    grok.CONST.SETTINGS.SECTIONS.AWS,
                    function(error, result) {
                        expect(error).to.be('fail');
                    }
                );
                expect(handle).to.be.an('object');
            });

            // gets user settings

            it('gets user settings (pass)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.SETTINGS,
                        grok.CONST.SETTINGS.SECTIONS.AWS
                    ].join('/'));
                    callback(null, 'success');
                    return {};
                };
                handle = grok.getSettings(
                    grok.CONST.SETTINGS.SECTIONS.AWS,
                    function(error, result) {
                        expect(error).to.be(null);
                        expect(result).to.be('success');
                    }
                );
                expect(handle).to.be.an('object');
            });
            it('gets user settings (fail)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.SETTINGS,
                        grok.CONST.SETTINGS.SECTIONS.AWS
                    ].join('/'));
                    callback('fail');
                    return {};
                };
                handle = grok.getSettings(
                    grok.CONST.SETTINGS.SECTIONS.AWS,
                    function(error, result) {
                        expect(error).to.be('fail');
                    }
                );
                expect(handle).to.be.an('object');
            });

        });

        describe('when handling metrics', function() {

            // gets current data source details

            it('gets current data source details (pass)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.METRICS,
                        grok.opts.dataSource
                    ].join('/'));
                    callback(null, 'success');
                    return {};
                };
                handle = grok.getDataSource(function(error, result) {
                    expect(error).to.be(null);
                    expect(result).to.be('success');
                });
                expect(handle).to.be.an('object');
            });
            it('gets current data source details (fail)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.METRICS,
                        grok.opts.dataSource
                    ].join('/'));
                    callback('fail');
                    return {};
                };
                handle = grok.getDataSource(function(error, result) {
                    expect(error).to.be('fail');
                });
                expect(handle).to.be.an('object');
            });

            // gets regions

            it('gets regions (pass)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.METRICS,
                        grok.opts.dataSource,
                        grok.CONST.METRICS.PATHS.REGIONS
                    ].join('/'));
                    callback(null, 'success');
                    return {};
                };
                handle = grok.getRegions(function(error, result) {
                    expect(error).to.be(null);
                    expect(result).to.be('success');
                });
                expect(handle).to.be.an('object');
            });
            it('gets regions (fail)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.METRICS,
                        grok.opts.dataSource,
                        grok.CONST.METRICS.PATHS.REGIONS
                    ].join('/'));
                    callback('fail');
                    return {};
                };
                handle = grok.getRegions(function(error, result) {
                    expect(error).to.be('fail');
                });
                expect(handle).to.be.an('object');
            });

            // gets region metric details, with and without options

            it('gets region metric details without options (pass)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.METRICS,
                        grok.opts.dataSource,
                        grok.CONST.METRICS.PATHS.REGIONS,
                        'us-west-2'
                    ].join('/'));
                    callback(null, 'success');
                    return {};
                };
                handle = grok.getRegionDetails('us-west-2', function(error, result) {
                    expect(error).to.be(null);
                    expect(result).to.be('success');
                });
                expect(handle).to.be.an('object');
            });
            it('gets region metric details without options (fail)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.METRICS,
                        grok.opts.dataSource,
                        grok.CONST.METRICS.PATHS.REGIONS,
                        'us-west-2'
                    ].join('/'));
                    callback('fail');
                    return {};
                };
                handle = grok.getRegionDetails('us-west-2', function(error, result) {
                    expect(error).to.be('fail');
                });
                expect(handle).to.be.an('object');
            });
            it('gets region metric details with options (pass)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.METRICS,
                        grok.opts.dataSource,
                        grok.CONST.METRICS.PATHS.REGIONS,
                        'us-west-2'
                    ].join('/'));
                    expect(opts.data.tags).to.be('Name:*grok*,Name:*test*');
                    callback(null, 'success');
                    return {};
                };
                handle = grok.getRegionDetails(
                    'us-west-2',
                    { tags: 'Name:*grok*,Name:*test*' },
                    function(error, result) {
                        expect(error).to.be(null);
                        expect(result).to.be('success');
                    }
                );
                expect(handle).to.be.an('object');
            });
            it('gets region metric details with options (fail)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.METRICS,
                        grok.opts.dataSource,
                        grok.CONST.METRICS.PATHS.REGIONS,
                        'us-west-2'
                    ].join('/'));
                    expect(opts.data.tags).to.be('Name:*grok*,Name:*test*');
                    callback('fail');
                    return {};
                };
                handle = grok.getRegionDetails(
                    'us-west-2',
                    { tags: 'Name:*grok*,Name:*test*' },
                    function(error, result) {
                        expect(error).to.be('fail');
                    }
                );
                expect(handle).to.be.an('object');
            });

            // gets region+namespace metric details

            it('gets region+namespace metric details (pass)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        this.opts.endPoint,
                        this.CONST.ENDPOINTS.METRICS,
                        this.opts.dataSource,
                        'us-west-2',
                        'AWS/EC2'
                    ].join('/'));
                    callback(null, 'success');
                    return {};
                };
                handle = grok.getInstanceMetrics(
                    'us-west-2',
                    'AWS/EC2',
                    function(error, result) {
                        expect(error).to.be(null);
                        expect(result).to.be('success');
                    }
                );
                expect(handle).to.be.an('object');
            });
            it('gets region+namespace metric details (fail)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        this.opts.endPoint,
                        this.CONST.ENDPOINTS.METRICS,
                        this.opts.dataSource,
                        'us-west-2',
                        'AWS/EC2'
                    ].join('/'));
                    callback('fail');
                    return {};
                };
                handle = grok.getInstanceMetrics(
                    'us-west-2',
                    'AWS/EC2',
                    function(error, result) {
                        expect(error).to.be('fail');
                    }
                );
                expect(handle).to.be.an('object');
            });

            // gets namespaces

            it('gets namespaces (pass)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.METRICS,
                        grok.opts.dataSource,
                        grok.CONST.METRICS.PATHS.NAMESPACES
                    ].join('/'));
                    callback(null, 'success');
                    return {};
                };
                handle = grok.getNamespaces(function(error, result) {
                    expect(error).to.be(null);
                    expect(result).to.be('success');
                });
                expect(handle).to.be.an('object');
            });
            it('gets namespaces (fail)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.METRICS,
                        grok.opts.dataSource,
                        grok.CONST.METRICS.PATHS.NAMESPACES
                    ].join('/'));
                    callback('fail');
                    return {};
                };
                handle = grok.getNamespaces(function(error, result) {
                    expect(error).to.be('fail');
                });
                expect(handle).to.be.an('object');
            });

            // gets namespace details

            it('gets namespace details (pass)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.METRICS,
                        grok.opts.dataSource,
                        'AWS/EC2'
                    ].join('/'));
                    callback(null, 'success');
                    return {};
                };
                handle = grok.getNamespaceDetails('AWS/EC2', function(error, result) {
                    expect(error).to.be(null);
                    expect(result).to.be('success');
                });
                expect(handle).to.be.an('object');
            });
            it('gets namespace details (fail)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.METRICS,
                        grok.opts.dataSource,
                        'AWS/EC2'
                    ].join('/'));
                    callback('fail');
                    return {};
                };
                handle = grok.getNamespaceDetails('AWS/EC2', function(error, result) {
                    expect(error).to.be('fail');
                });
                expect(handle).to.be.an('object');
            });

            // gets custom metrics

            it('gets custom metrics (pass)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.METRICS,
                        grok.CONST.METRICS.PATHS.CUSTOM
                    ].join('/'));
                    callback(null, 'success');
                    return {};
                };
                handle = grok.getGrokCustomMetrics(function(error, result) {
                    expect(error).to.be(null);
                    expect(result).to.be('success');
                });
                expect(handle).to.be.an('object');
            });
            it('gets custom metrics (fail)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.METRICS,
                        grok.CONST.METRICS.PATHS.CUSTOM
                    ].join('/'));
                    callback('fail');
                    return {};
                };
                handle = grok.getGrokCustomMetrics(function(error, result) {
                    expect(error).to.be('fail');
                });
                expect(handle).to.be.an('object');
            });

            // deletes custom metrics

            it('deletes custom metrics (pass)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.METRICS,
                        grok.CONST.METRICS.PATHS.CUSTOM,
                        'fake-metric-id'
                    ].join('/'));
                    expect(opts.type).to.be('DELETE');
                    expect(opts.data).to.be(undefined);
                    callback(null, 'success');
                };
                grok.deleteGrokCustomMetric('fake-metric-id',
                        function(error, result) {
                            expect(error).to.be(null);
                            expect(result).to.be('success');
                        }
                    );
            });

            it('deletes custom metrics (fail)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.METRICS,
                        grok.CONST.METRICS.PATHS.CUSTOM,
                        'fake-metric-id'
                    ].join('/'));
                    expect(opts.type).to.be('DELETE');
                    expect(opts.data).to.be(undefined);
                    callback('fail');
                };
                grok.deleteGrokCustomMetric('fake-metric-id',
                        function(error, result) {
                            expect(error).to.be('fail');
                        }
                    );
            });

        });

        describe('when handling models', function() {

            // gets model info

            it('gets model info (pass)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.MODELS
                    ].join('/'));
                    callback(null, 'success');
                    return {};
                };
                handle = grok.getModels(function(error, result) {
                    expect(error).to.be(null);
                    expect(result).to.be('success');
                });
                expect(handle).to.be.an('object');
            });
            it('gets model info (fail)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.MODELS
                    ].join('/'));
                    callback('fail');
                    return {};
                };
                handle = grok.getModels(function(error, result) {
                    expect(error).to.be('fail');
                });
                expect(handle).to.be.an('object');
            });

            // gets model data

            it('gets model data (pass)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.MODELS,
                        'modelId',
                        grok.CONST.MODELS.PATHS.DATA
                    ].join('/'));
                    expect(opts.data.limit).to.be(111);
                    callback(null, 'success');
                    return {};
                };
                handle = grok.getModelData(
                    'modelId',
                    { limit: 111 },
                    function(error, result) {
                        expect(error).to.be(null);
                        expect(result).to.be('success');
                    }
                );
                expect(handle).to.be.an('object');
            });
            it('gets model data (fail)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.MODELS,
                        'modelId',
                        grok.CONST.MODELS.PATHS.DATA
                    ].join('/'));
                    expect(opts.data.limit).to.be(111);
                    callback('fail');
                    return {};
                };
                handle = grok.getModelData(
                    'modelId',
                    { limit: 111 },
                    function(error, result) {
                        expect(error).to.be('fail');
                    }
                );
                expect(handle).to.be.an('object');
            });

            // exports models

            it('exports models (pass)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.MODELS,
                        grok.CONST.MODELS.PATHS.EXPORT
                    ].join('/'));
                    callback(null, 'success');
                    return {};
                };
                handle = grok.exportModels(function(error, result) {
                    expect(error).to.be(null);
                    expect(result).to.be('success');
                });
                expect(handle).to.be.an('object');
            });
            it('exports models (fail)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.MODELS,
                        grok.CONST.MODELS.PATHS.EXPORT
                    ].join('/'));
                    callback('fail');
                    return {};
                };
                handle = grok.exportModels(function(error, result) {
                    expect(error).to.be('fail');
                });
                expect(handle).to.be.an('object');
            });

            // creates models

            it('creates models (pass)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.MODELS
                    ].join('/'));
                    expect(opts.type).to.be('POST');
                    expect(opts.data).to.be(JSON.stringify([
                        { blah: 'blah' },
                        { test: 'test' }
                    ]));
                    callback(null, 'success');
                    return {};
                };
                handle = grok.createModels(
                    [
                        { blah: 'blah' },
                        { test: 'test' }
                    ],
                    function(error, result) {
                        expect(error).to.be(null);
                        expect(result).to.be('success');
                    }
                );
                expect(handle).to.be.an('object');
            });
            it('creates models (fail)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.MODELS
                    ].join('/'));
                    expect(opts.type).to.be('POST');
                    expect(opts.data).to.be(JSON.stringify([
                        { blah: 'blah' },
                        { test: 'test' }
                    ]));
                    callback('fail');
                    return {};
                };
                handle = grok.createModels(
                    [
                        { blah: 'blah' },
                        { test: 'test' }
                    ],
                    function(error, result) {
                        expect(error).to.be('fail');
                    }
                );
                expect(handle).to.be.an('object');
            });

            // deletes a model

            it('deletes a model (pass)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.MODELS,
                        'fake-model-id'
                    ].join('/'));
                    expect(opts.type).to.be('DELETE');
                    expect(opts.data).to.be(undefined);
                    callback(null, 'success');
                    return {};
                };
                handle = grok.deleteModel(
                    'fake-model-id',
                    function(error, result) {
                        expect(error).to.be(null);
                        expect(result).to.be('success');
                    }
                );
                expect(handle).to.be.an('object');
            });
            it('deletes a model (fail)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.MODELS,
                        'fake-model-id'
                    ].join('/'));
                    expect(opts.type).to.be('DELETE');
                    expect(opts.data).to.be(undefined);
                    callback('fail');
                    return {};
                };
                handle = grok.deleteModel(
                    'fake-model-id',
                    function(error, result) {
                        expect(error).to.be('fail');
                    }
                );
                expect(handle).to.be.an('object');
            });

        });

        describe('when handling monitored instances', function() {

            // gets monitored instances

            it('gets monitored instances (pass)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.INSTANCES
                    ].join('/'));
                    callback(null, 'success');
                    return {};
                };
                handle = grok.getMonitoredInstances(function(error, result) {
                    expect(error).to.be(null);
                    expect(result).to.be('success');
                });
                expect(handle).to.be.an('object');
            });
            it('gets monitored instances (fail)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.INSTANCES
                    ].join('/'));
                    callback('fail');
                    return {};
                };
                handle = grok.getMonitoredInstances(function(error, result) {
                    expect(error).to.be('fail');
                });
                expect(handle).to.be.an('object');
            });

            // creates a monitored instance

            it('creates a monitored instance (pass)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.INSTANCES,
                        'us-east-1',
                        'AWS/EC2',
                        'i-12345'
                    ].join('/'));
                    expect(opts.type).to.be('POST');
                    callback(null, 'success');
                    return {};
                };
                handle = grok.createMonitoredInstance(
                    'us-east-1',
                    'AWS/EC2',
                    'i-12345',
                    function(error, result) {
                        expect(error).to.be(null);
                        expect(result).to.be('success');
                    }
                );
                expect(handle).to.be.an('object');
            });
            it('creates a monitored instance (fail)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.INSTANCES,
                        'us-east-1',
                        'AWS/EC2',
                        'i-12345'
                    ].join('/'));
                    expect(opts.type).to.be('POST');
                    callback('fail');
                    return {};
                };
                handle = grok.createMonitoredInstance(
                    'us-east-1',
                    'AWS/EC2',
                    'i-12345',
                    function(error, result) {
                        expect(error).to.be('fail');
                    }
                );
                expect(handle).to.be.an('object');
            });

            // deletes monitored instances

            it('deletes monitored instances (pass)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.INSTANCES
                    ].join('/'));
                    expect(opts.type).to.be('DELETE');
                    expect(opts.data).to.be(
                        JSON.stringify([ 'i-12345', 'i-54321' ])
                    );
                    callback(null, 'success');
                    return {};
                };
                handle = grok.deleteMonitoredInstances(
                    [ 'i-12345', 'i-54321' ],
                    function(error, result) {
                        expect(error).to.be(null);
                        expect(result).to.be('success');
                    }
                );
                expect(handle).to.be.an('object');
            });
            it('deletes monitored instances (fail)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.INSTANCES
                    ].join('/'));
                    expect(opts.type).to.be('DELETE');
                    expect(opts.data).to.be(
                        JSON.stringify([ 'i-12345', 'i-54321' ])
                    );
                    callback('fail');
                    return {};
                };
                handle = grok.deleteMonitoredInstances(
                    [ 'i-12345', 'i-54321' ],
                    function(error, result) {
                        expect(error).to.be('fail');
                    }
                );
                expect(handle).to.be.an('object');
            });

        });

        describe('when handling autostacks', function() {

            var name = "autostack-1",
                region = "us-east-1",
                filters = [["tag", "video*"]],
                data = JSON.stringify({
                    "name": name,
                    "region": region,
                    "filters": filters
                }),
                previewData = {
                    "region": region,
                    "filters": JSON.stringify(filters)
                },
                id = "3297hn29n8arysn7",
                metricID = "9rnfiun3r",
                metricNamespace = "AWS/EC2",
                metricName = "CPUUtilization",
                metrics = JSON.stringify([
                    { "namespace": metricNamespace, "metric": metricName }
                ]);

            // gets autostacks

            it('gets autostacks (pass)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.AUTOSTACKS
                    ].join('/'));
                    callback(null, 'success');
                    return {};
                };
                handle = grok.getAutostacks(function(error, result) {
                    expect(error).to.be(null);
                    expect(result).to.be('success');
                });
                expect(handle).to.be.an('object');
            });
            it('gets autostacks (fail)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.AUTOSTACKS
                    ].join('/'));
                    callback('fail');
                    return {};
                };
                handle = grok.getAutostacks(function(error, result) {
                    expect(error).to.be('fail');
                });
                expect(handle).to.be.an('object');
            });

            // previews autostacks

            it('previews autostacks (pass)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.AUTOSTACKS,
                        grok.CONST.AUTOSTACKS.PATHS.PREVIEW_INSTANCES
                    ].join('/'));
                    expect(opts.data).to.eql(previewData);
                    callback(null, 'success');
                    return {};
                };
                handle = grok.getAutostackPreview(
                    region,
                    filters,
                    function(error, result) {
                        expect(error).to.be(null);
                        expect(result).to.be('success');
                    }
                );
                expect(handle).to.be.an('object');
            });
            it('previews autostacks (fail)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.AUTOSTACKS,
                        grok.CONST.AUTOSTACKS.PATHS.PREVIEW_INSTANCES
                    ].join('/'));
                    expect(opts.data).to.eql(previewData);
                    callback('fail');
                    return {};
                };
                handle = grok.getAutostackPreview(
                    region,
                    filters,
                    function(error, result) {
                        expect(error).to.be('fail');
                    }
                );
                expect(handle).to.be.an('object');
            });

            // creates an autostack

            it('creates an autostack (pass)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.AUTOSTACKS
                    ].join('/'));
                    expect(opts.data).to.be(data);
                    expect(opts.type).to.be('POST');
                    callback(null, 'success');
                    return {};
                };
                handle = grok.createAutostack(
                    name,
                    region,
                    filters,
                    function(error, result) {
                        expect(error).to.be(null);
                        expect(result).to.be('success');
                    }
                );
                expect(handle).to.be.an('object');
            });
            it('creates an autostack (fail)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.AUTOSTACKS
                    ].join('/'));
                    expect(opts.data).to.be(data);
                    expect(opts.type).to.be('POST');
                    callback('fail');
                    return {};
                };
                handle = grok.createAutostack(
                    name,
                    region,
                    filters,
                    function(error, result) {
                        expect(error).to.be('fail');
                    }
                );
                expect(handle).to.be.an('object');
            });

            // deletes an autostack

            it('deletes an autostack (pass)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.AUTOSTACKS,
                        id
                    ].join('/'));
                    expect(opts.type).to.be('DELETE');
                    callback(null, 'success');
                    return {};
                };
                handle = grok.deleteAutostack(
                    id,
                    function(error, result) {
                        expect(error).to.be(null);
                        expect(result).to.be('success');
                    }
                );
                expect(handle).to.be.an('object');
            });
            it('deletes an autostack (fail)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.AUTOSTACKS,
                        id
                    ].join('/'));
                    expect(opts.type).to.be('DELETE');
                    callback('fail');
                    return {};
                };
                handle = grok.deleteAutostack(
                    id,
                    function(error, result) {
                        expect(error).to.be('fail');
                    }
                );
                expect(handle).to.be.an('object');
            });

            // gets metrics for autostack

            it('gets metrics for autostack (pass)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.AUTOSTACKS,
                        id,
                        grok.CONST.AUTOSTACKS.PATHS.METRICS
                    ].join('/'));
                    callback(null, 'success');
                    return {};
                };
                handle = grok.getAutostackMetrics(
                    id,
                    function(error, result) {
                        expect(error).to.be(null);
                        expect(result).to.be('success');
                    }
                );
                expect(handle).to.be.an('object');
            });
            it('gets metrics for autostack (fail)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.AUTOSTACKS,
                        id,
                        grok.CONST.AUTOSTACKS.PATHS.METRICS
                    ].join('/'));
                    callback('fail');
                    return {};
                };
                handle = grok.getAutostackMetrics(
                    id,
                    function(error, result) {
                        expect(error).to.be('fail');
                    }
                );
                expect(handle).to.be.an('object');
            });

            // associates metrics with an autostack

            it('associates metrics with an autostack (pass)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.AUTOSTACKS,
                        id,
                        grok.CONST.AUTOSTACKS.PATHS.METRICS
                    ].join('/'));
                    expect(opts.data).to.be(metrics);
                    expect(opts.type).to.be('POST');
                    callback(null, 'success');
                    return {};
                };
                handle = grok.createAutostackMetrics(
                    id,
                    metrics,
                    function(error, result) {
                        expect(error).to.be(null);
                        expect(result).to.be('success');
                    }
                );
                expect(handle).to.be.an('object');
            });
            it('associates metrics with an autostack (fail)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.AUTOSTACKS,
                        id,
                        grok.CONST.AUTOSTACKS.PATHS.METRICS
                    ].join('/'));
                    expect(opts.data).to.be(metrics);
                    expect(opts.type).to.be('POST');
                    callback('fail');
                    return {};
                };
                handle = grok.createAutostackMetrics(
                    id,
                    metrics,
                    function(error, result) {
                        expect(error).to.be('fail');
                    }
                );
                expect(handle).to.be.an('object');
            });

            // deletes a metric associated with an autostack

            it('deletes a metric associated with an autostack (pass)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.AUTOSTACKS,
                        id,
                        grok.CONST.AUTOSTACKS.PATHS.METRICS,
                        metricID
                    ].join('/'));
                    expect(opts.type).to.be('DELETE');
                    callback(null, 'success');
                    return {};
                };
                handle = grok.deleteAutostackMetric(
                    id,
                    metricID,
                    function(error, result) {
                        expect(error).to.be(null);
                        expect(result).to.be('success');
                    }
                );
                expect(handle).to.be.an('object');
            });
            it('deletes a metric associated with an autostack (fail)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.AUTOSTACKS,
                        id,
                        grok.CONST.AUTOSTACKS.PATHS.METRICS,
                        metricID
                    ].join('/'));
                    expect(opts.type).to.be('DELETE');
                    callback('fail');
                    return {};
                };
                handle = grok.deleteAutostackMetric(
                    id,
                    metricID,
                    function(error, result) {
                        expect(error).to.be('fail');
                    }
                );
                expect(handle).to.be.an('object');
            });

        });

        describe('when handling tags', function() {

            // gets tags

            it('gets tags (pass)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.METRICS,
                        grok.opts.dataSource,
                        'us-east-1',
                        grok.CONST.METRICS.PATHS.TAGS,
                        'instances',
                        'i-12345'
                    ].join('/'));
                    callback(null, 'success');
                    return {};
                };
                handle = grok.getTags(
                    'us-east-1',
                    'instances',
                    'i-12345',
                    function(error, result) {
                        expect(error).to.be(null);
                        expect(result).to.be('success');
                    }
                );
                expect(handle).to.be.an('object');
            });
            it('gets tags (fail)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.METRICS,
                        grok.opts.dataSource,
                        'us-east-1',
                        grok.CONST.METRICS.PATHS.TAGS,
                        'instances',
                        'i-12345'
                    ].join('/'));
                    callback('fail');
                    return {};
                };
                handle = grok.getTags(
                    'us-east-1',
                    'instances',
                    'i-12345',
                    function(error, result) {
                        expect(error).to.be('fail');
                    }
                );
                expect(handle).to.be.an('object');
            });

        });

        describe('when handling support access', function() {

            // checks for support access

            it('checks for support access (pass)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.SUPPORT
                    ].join('/'));
                    callback(null, 'success');
                    return {};
                };
                handle = grok.getSupportAccess(function(error, result) {
                    expect(error).to.be(null);
                    expect(result).to.be('success');
                });
                expect(handle).to.be.an('object');
            });
            it('checks for support access (fail)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.SUPPORT
                    ].join('/'));
                    callback('fail');
                    return {};
                };
                handle = grok.getSupportAccess(function(error, result) {
                    expect(error).to.be('fail');
                });
                expect(handle).to.be.an('object');
            });

            // allows support access

            it('allows support access (pass)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.SUPPORT
                    ].join('/'));
                    expect(opts.type).to.be('POST');
                    callback(null, 'success');
                    return {};
                };
                handle = grok.setSupportAccess(function(error, result) {
                    expect(error).to.be(null);
                    expect(result).to.be('success');
                });
                expect(handle).to.be.an('object');
            });
            it('allows support access (fail)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.SUPPORT
                    ].join('/'));
                    expect(opts.type).to.be('POST');
                    callback('fail');
                    return {};
                };
                handle = grok.setSupportAccess(function(error, result) {
                    expect(error).to.be('fail');
                });
                expect(handle).to.be.an('object');
            });

            // revoke support access

            it('revokes support access (pass)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.SUPPORT
                    ].join('/'));
                    expect(opts.type).to.be('DELETE');
                    callback(null, 'success');
                    return {};
                };
                handle = grok.removeSupportAccess(function(error, result) {
                    expect(error).to.be(null);
                    expect(result).to.be('success');
                });
                expect(handle).to.be.an('object');
            });
            it('revokes support access (fail)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.SUPPORT
                    ].join('/'));
                    expect(opts.type).to.be('DELETE');
                    callback('fail');
                    return {};
                };
                handle = grok.removeSupportAccess(function(error, result) {
                    expect(error).to.be('fail');
                });
                expect(handle).to.be.an('object');
            });

        });

        describe('when handling updates', function() {

            // checks for an update

            it('checks for an update (pass)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.UPDATE
                    ].join('/'));
                    callback(null, 'success');
                    return {};
                };
                handle = grok.getUpdate(function(error, result) {
                    expect(error).to.be(null);
                    expect(result).to.be('success');
                });
                expect(handle).to.be.an('object');
            });
            it('checks for an update (fail)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.UPDATE
                    ].join('/'));
                    callback('fail');
                    return {};
                };
                handle = grok.getUpdate(function(error, result) {
                    expect(error).to.be('fail');
                });
                expect(handle).to.be.an('object');
            });

            // triggers an update

            it('triggers an update (pass)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.UPDATE
                    ].join('/'));
                    callback(null, 'success');
                    return {};
                };
                handle = grok.setUpdate(function(error, result) {
                    expect(error).to.be(null);
                    expect(result).to.be('success');
                });
                expect(handle).to.be.an('object');
            });
            it('triggers an update (fail)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.UPDATE
                    ].join('/'));
                    callback('fail');
                    return {};
                };
                handle = grok.setUpdate(function(error, result) {
                    expect(error).to.be('fail');
                });
                expect(handle).to.be.an('object');
            });

        });

        describe('when handling wufoo forms', function() {

            // send user data to wufoo form

            it('sends data (pass)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.WUFOO
                    ].join('/'));
                    expect(opts.data).to.be(
                        JSON.stringify({ name: 'User' })
                    );
                    expect(opts.type).to.be('POST');
                    callback(null, 'success');
                    return {};
                };
                handle = grok.sendWufooForm(
                    { name: 'User' },
                    function(error, result) {
                        expect(error).to.be(null);
                        expect(result).to.be('success');
                    }
                );
                expect(handle).to.be.an('object');
            });
            it('sends data (fail)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.WUFOO
                    ].join('/'));
                    expect(opts.data).to.be(
                        JSON.stringify({ name: 'User' })
                    );
                    expect(opts.type).to.be('POST');
                    callback('fail');
                    return {};
                };
                handle = grok.sendWufooForm(
                    { name: 'User' },
                    function(error, result) {
                        expect(error).to.be('fail');
                    }
                );
                expect(handle).to.be.an('object');
            });

        });

        describe('when handling notifications', function() {

            // gets notifications

            it('gets notifications (pass)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.NOTIFICATIONS
                    ].join('/'));
                    callback(null, 'success');
                    return {};
                };
                handle = grok.getNotifications(function(error, result) {
                    expect(error).to.be(null);
                    expect(result).to.be('success');
                });
                expect(handle).to.be.an('object');
            });
            it('gets notifications (fail)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.NOTIFICATIONS
                    ].join('/'));
                    callback('fail');
                    return {};
                };
                handle = grok.getNotifications(function(error, result) {
                    expect(error).to.be('fail');
                });
                expect(handle).to.be.an('object');
            });

            // sets notifications

            it('sets notification (pass)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.NOTIFICATIONS
                    ].join('/'));
                    expect(opts.data).to.be(JSON.stringify({
                        blah: 'blah'
                    }));
                    callback(null, 'success');
                    return {};
                };
                handle = grok.setNotification(
                    { blah: 'blah' },
                    function(error, result) {
                        expect(error).to.be(null);
                        expect(result).to.be('success');
                    }
                );
                expect(handle).to.be.an('object');
            });
            it('sets notification (fail)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.NOTIFICATIONS
                    ].join('/'));
                    expect(opts.data).to.be(JSON.stringify({
                        blah: 'blah'
                    }));
                    callback('fail');
                    return {};
                };
                handle = grok.setNotification(
                    { blah: 'blah' },
                    function(error, result) {
                        expect(error).to.be('fail');
                    }
                );
                expect(handle).to.be.an('object');
            });

            // gets notification history

            it('gets notification history (pass)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.NOTIFICATIONS,
                        grok.CONST.NOTIFICATIONS.PATHS.HISTORY
                    ].join('/'));
                    expect(JSON.parse(opts.data).limit).to.be(111);
                    callback(null, 'success');
                    return {};
                };
                handle = grok.getNotificationHistory(
                    { limit: 111 },
                    function(error, result) {
                        expect(error).to.be(null);
                        expect(result).to.be('success');
                    }
                );
                expect(handle).to.be.an('object');
            });
            it('gets notification history (fail)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.NOTIFICATIONS,
                        grok.CONST.NOTIFICATIONS.PATHS.HISTORY
                    ].join('/'));
                    expect(JSON.parse(opts.data).limit).to.be(111);
                    callback('fail');
                    return {};
                };
                handle = grok.getNotificationHistory(
                    { limit: 111 },
                    function(error, result) {
                        expect(error).to.be('fail');
                    }
                );
                expect(handle).to.be.an('object');
            });

        });
        describe('when handling annotations', function() {

            // gets annotations

            it('gets annotations (pass)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.ANNOTATIONS
                    ].join('/'));
                    expect(JSON.parse(opts.data).from).to.be('2014-01-01 10:00:00');
                    expect(JSON.parse(opts.data).to).to.be('2014-01-15 10:00:00');
                    callback(null, 'success');
                    return {};
                };
                handle = grok.getAnnotations(
                    { from: '2014-01-01 10:00:00', to: '2014-01-15 10:00:00' },
                    function(error, result) {
                        expect(error).to.be(null);
                        expect(result).to.be('success');
                    }
                );
                expect(handle).to.be.an('object');
            });
            it('gets annotations (fail)', function() {
                grok._makeRequest = function(opts, callback) {
                    expect(opts.url).to.be([
                        grok.opts.endPoint,
                        grok.CONST.ENDPOINTS.ANNOTATIONS
                    ].join('/'));
                    expect(JSON.parse(opts.data).from).to.be('2014-01-01 10:00:00');
                    expect(JSON.parse(opts.data).to).to.be('2014-01-15 10:00:00');
                    callback('fail');
                    return {};
                };
                handle = grok.getAnnotations(
                    { from: '2014-01-01 10:00:00', to: '2014-01-15 10:00:00' },
                    function(error, result) {
                        expect(error).to.be('fail');
                    }
                );
                expect(handle).to.be.an('object');
            });
        }
    );

    });

    describe('when constructed with options', function() {

        var grok = new GrokAPI({
            endPoint: 'test endpoint'
        });

        it('should override user-provided values', function() {
            expect(grok.opts.endPoint).to.eql('test endpoint');
        });
        it('should leave alone default values user did not override', function() {
            expect(grok.opts.dataSource).to.eql('cloudwatch');
        });

    });

});
