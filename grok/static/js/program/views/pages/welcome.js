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

(function() {

    HTM-ITUI.WelcomeView = Backbone.View.extend({

        template: _.template($('#welcome-tmpl').html()),

        msgs: HTM-ITUI.msgs('welcome-tmpl'),
        site: HTM-ITUI.msgs('site'),

        events: {
            'change #novice' : 'handleNoviceSelected',
            'change #expert' : 'handleExpertSelected',
            'click #next'    : 'handleNext'
        },

        initialize: function(options) {
            var me = this;
            me.api = options.api;

            HTM-ITUI.utils.title(me.msgs.title);

            // deactive header logo link
            $('.navbar-brand').attr('href', '#');

            // redirects
            if(HTM-ITUI.utils.isAuthorized()) {
                // logged in, and not in setup flow => manage page
                if(! HTM-ITUI.utils.isSetupFlow()) {
                    HTM-ITUI.utils.go(me.site.paths.manage);
                    return;
                }
                me.getRegions();
            }
            else {
                // logged out
                me.api.getSettings(
                    me.api.CONST.SETTINGS.SECTIONS.USERTRACK,
                    function(error, settings) {
                        if(error) return HTM-ITUI.utils.modalError(error);
                        if(
                            (! HTM-ITUI.utils.isSetupFlow()) &&
                            settings &&
                            ('optin' in settings) &&
                            (settings.optin !== '')
                        ) {
                            // setup already => auth page to login
                            HTM-ITUI.utils.go(me.site.paths.auth);
                            return;
                        }
                        me.getRegions();
                    }
                );
            }
        },

        getRegions: function() {
            var me = this;

            me.api.getRegions(function(error, regions) {
                if(error) return HTM-ITUI.utils.modalError(error);

                Object.keys(regions).forEach(function(region) {
                    regions[region] = regions[region].replace(' Region', '');
                });

                me.regions = regions;
                me.render();
            });
        },

        render: function() {
            var me = this,
                data = {
                    baseUrl: NTA.baseUrl,
                    msgs: me.msgs,
                    button: me.site.buttons.next,
                    site: me.site,
                    edition: HTM-ITUI.product.edition,
                    version: HTM-ITUI.product.version,
                    regions: me.regions,
                    currentRegion: HTM-ITUI.instanceData.region
                };

            me.$el.html(me.template(data));

            me.trigger('view-ready');
            return me;
        },

        handleNoviceSelected: function(event) {
            var $region = $("#region");
            $region.removeAttr("disabled");
        },

        handleExpertSelected: function(event) {
            var $region = $("#region");
            $region.attr("disabled", "disabled");
        },

        handleNext: function(event) {
            event.preventDefault();
            event.stopPropagation();

            var expert = $("#expert").is(":checked");

            if (expert) {
                HTM-ITUI.utils.go(this.site.paths.register +
                                this.site.urltag.setup +
                                this.site.urltag.expert);
            }
            else {
                var region = $("#region").val();

                HTM-ITUI.utils.go(this.site.paths.register +
                                this.site.urltag.setup +
                                this.site.urltag.region + region);
            }
        }
    });

})();
