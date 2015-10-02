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

    HTM-ITUI.CompleteView = Backbone.View.extend({

        template: _.template($('#complete-tmpl').html()),

        msgs: HTM-ITUI.msgs('complete-tmpl'),
        site: HTM-ITUI.msgs('site'),

        events: {
            'click #next': 'handleNext',
        },

        initialize: function(options) {
            var me = this;
            me.api = options.api;

            HTM-ITUI.utils.title(me.msgs.title);

            // setup? deactive header logo link & hide header setup menu
            if(HTM-ITUI.utils.isSetupFlow()) {
                $('.navbar-brand').attr('href', '#');
            }

            // go setup if they have not yet
            if(! HTM-ITUI.utils.isAuthorized()) {
                HTM-ITUI.utils.go(me.site.paths.welcome);
                return;
            }

            me.render();
        },

        render: function(settings) {
            var me = this,
                step = HTM-ITUI.utils.getSetupTotalSteps(),
                data = {
                    baseUrl:    NTA.baseUrl,
                    msgs:       me.msgs,
                    site:       me.site,
                    isSetup:    HTM-ITUI.utils.isSetupFlow(),
                    apiKey:     HTM-ITUI.utils.store.get('apiKey'),
                    step:       step,
                    clientUrl: window.location.protocol + '//' +
                                    window.location.hostname +
                                    me.site.paths.manage,
                    serverUrl:  window.location.protocol + '//' +
                                    window.location.hostname
                },
                setupProgressBar;

            me.$el.html(me.template(data));

            if(HTM-ITUI.utils.isSetupFlow()) {
                setupProgressBar = HTM-ITUI.utils.getSetupProgressBar(
                    step, $('#progress-bar-container'));
            }

            me.trigger('view-ready');
            return me;
        },

        handleNext: function(event) {
            event.preventDefault();
            event.stopPropagation();
            HTM-ITUI.utils.go(this.site.paths.manage);
        }

    });

})();
