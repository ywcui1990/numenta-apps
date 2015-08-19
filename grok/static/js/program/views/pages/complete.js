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

    GROKUI.CompleteView = Backbone.View.extend({

        template: _.template($('#complete-tmpl').html()),

        msgs: GROKUI.msgs('complete-tmpl'),
        site: GROKUI.msgs('site'),

        events: {
            'click #next': 'handleNext',
        },

        initialize: function(options) {
            var me = this;
            me.api = options.api;

            GROKUI.utils.title(me.msgs.title);

            // setup? deactive header logo link & hide header setup menu
            if(GROKUI.utils.isSetupFlow()) {
                $('.navbar-brand').attr('href', '#');
            }

            // go setup if they have not yet
            if(! GROKUI.utils.isAuthorized()) {
                GROKUI.utils.go(me.site.paths.welcome);
                return;
            }

            me.render();
        },

        render: function(settings) {
            var me = this,
                step = GROKUI.utils.getSetupTotalSteps(),
                data = {
                    baseUrl:    NTA.baseUrl,
                    msgs:       me.msgs,
                    site:       me.site,
                    isSetup:    GROKUI.utils.isSetupFlow(),
                    apiKey:     GROKUI.utils.store.get('apiKey'),
                    step:       step,
                    clientUrl: window.location.protocol + '//' +
                                    window.location.hostname +
                                    me.site.paths.manage,
                    serverUrl:  window.location.protocol + '//' +
                                    window.location.hostname
                },
                setupProgressBar;

            me.$el.html(me.template(data));

            if(GROKUI.utils.isSetupFlow()) {
                setupProgressBar = GROKUI.utils.getSetupProgressBar(
                    step, $('#progress-bar-container'));
            }

            me.trigger('view-ready');
            return me;
        },

        handleNext: function(event) {
            event.preventDefault();
            event.stopPropagation();
            GROKUI.utils.go(this.site.paths.manage);
        }

    });

})();
