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

    GROKUI.RegisterView = Backbone.View.extend({

        template: _.template($('#register-tmpl').html()),

        msgs: GROKUI.msgs('register-tmpl'),
        site: GROKUI.msgs('site'),

        events: {
            'change #agree' : 'handleAgreeToggle',
            'click #back'   : 'handleBack',
            'click #next'   : 'handleNext'
        },

        initialize: function(options) {
            var me = this,
                settings = {};

            me.api = options.api;
            me.checked = true;

            GROKUI.utils.title(me.msgs.title);

            // setup? deactive header logo link
            if(GROKUI.utils.isSetupFlow()) {
                $('.navbar-brand').attr('href', '#');
            }

            me.api.getSettings(
                me.api.CONST.SETTINGS.SECTIONS.USERTRACK,
                function(error, settings) {
                    if(error) return GROKUI.utils.modalError(error);

                    if(
                        (! GROKUI.utils.isAuthorized()) &&
                        settings &&
                        ('optin' in settings) &&
                        (settings.optin !== '')
                    ) {
                        // setup already => auth page to login
                        GROKUI.utils.go(me.site.paths.auth);
                        return;
                    }

                    switch(settings.optin) {
                        case '':
                            // console.log('user has not chosen, default to opt-in');
                            me.checked = true;
                            break;
                        case 'true':
                            // console.log('user has opted in');
                            me.checked = true;
                            break;
                        case 'false':
                            // console.log('user has opted out');
                            me.checked = false;
                            break;
                        default:
                            // console.log('some unexpected state');
                            me.checked = false;
                    }
                    me.render(settings);
                }
            );
        },

        render: function(settings) {
            var me = this,
                step = 1,
                data = {
                    baseUrl: NTA.baseUrl,
                    msgs: me.msgs,
                    site: me.site,
                    isSetup: GROKUI.utils.isSetupFlow(),
                    button: {
                        back: GROKUI.utils.isSetupFlow() ?
                            me.site.buttons.back : me.site.buttons.cancel,
                        next: GROKUI.utils.isSetupFlow() ?
                            me.site.buttons.next : me.site.buttons.save
                    },
                    values: settings,
                    checked: me.checked,
                    step: step
                },
                setupProgressBar;

            me.$el.html(me.template(data));

            if(GROKUI.utils.isSetupFlow()) {
                setupProgressBar = GROKUI.utils.getSetupProgressBar(
                    step, $('#progress-bar-container'));
            }

            // if no data on load, give focus to first field
            $name = $('#name');
            if(! $name.val()) {
                $name.focus();
            }

            me.trigger('view-ready');
            return me;
        },

        handleAgreeToggle: function(event) {
            var me = this,
                $checkbox = me.$el.find('#agree'),
                agreed = $checkbox.is(':checked'),
                $next = $("#next");

            if (agreed) {
                $next.removeAttr("disabled");
            }
            else {
                $next.attr("disabled", "disabled");
            }
        },

        handleBack: function(event) {
            var me = this,
                destination = GROKUI.utils.isSetupFlow() ?
                    me.site.paths.welcome + window.location.search :
                    me.site.paths.manage;

            event.stopPropagation();
            event.preventDefault();

            GROKUI.utils.go(destination);
        },

        handleNext: function(event) {
            var me = this,
                $checkbox = me.$el.find('#usage'),
                optIn = $checkbox.is(':checked') ? 'true' : 'false',
                USERTRACK = me.api.CONST.SETTINGS.USERTRACK,
                settings = {},
                destination = GROKUI.utils.isSetupFlow() ?
                    me.site.paths.auth + window.location.search :
                    me.site.paths.manage,
                name = $('#name').val(),
                company = $('#company').val(),
                email = $('#email').val();

            GROKUI.utils.throb.start(me.site.state.save);

            event.stopPropagation();
            event.preventDefault();

            settings[USERTRACK.NAME] = name;
            settings[USERTRACK.COMPANY] = company;
            settings[USERTRACK.EMAIL] = email;
            settings[USERTRACK.OPTIN] = optIn;

            // save user registration info
            me.api.putSettings(
                settings,
                me.api.CONST.SETTINGS.SECTIONS.USERTRACK,
                function(error) {
                    if(error) return GROKUI.utils.modalError(error);

                    // send a few extras to wufoo
                    settings['edition'] = GROKUI.product.edition;
                    settings['version'] = GROKUI.product.version;
                    settings['build'] = GROKUI.product.build;

                    // remove optin
                    delete settings[USERTRACK.OPTIN];

                    me.api.sendWufooForm(settings, function(error) {
                        if(error) return GROKUI.utils.modalError(error);
                        GROKUI.utils.go(destination);
                    });
                }
            );
        }

    });

})();
