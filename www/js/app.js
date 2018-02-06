/* ****************************************************************************
 *                                                                             *
 * Lifeguide Toolbox Hybrid Web Application                                    *
 *                                                                             *
 * Copyright (c) 2016 - 2017                                                   *
 * University of Southampton                                                   *
 *     Author: Petros Papadopoulos                                             *
 *     e-mail: p.papadopoulos@soton.ac.uk                                      *
 * All rights reserverd                                                        *
 *                                                                             *
 **************************************************************************** */

// angular.module is a global place for creating, registering and retrieving Angular modules
//angular.module('LGApp', ['ionic', 'ngCordova', 'ngSanitize', 'LGApp.controllers', 'LGApp.services.conditions', 'LGApp.services.configuration', 'LGApp.services.functions', 'LGApp.services.util', 'LGApp.services-data', 'LGApp.services.authentication', 'LGApp.constants', 'LGApp.services.notifications', 'LGApp.components'])
angular.module('LGApp', ['ionic', 'ngCordova', 'ngSanitize', 'LGApp.controllers', 'LGApp.services.conditions', 'LGApp.services.configuration', 'LGApp.services.functions', 'LGApp.services.util', 'LGApp.services-data', 'LGApp.services.authentication', 'LGApp.constants', 'LGApp.services.notifications', 'LGApp.components'])

.run(function ($ionicPlatform, $state, $stateParams, AUTH_EVENTS, $log, AuthService, $rootScope, device, manageLocalData) {
    'use strict';
    // It's very handy to add references to $state and $stateParams to the $rootScope
    // so that you can access them from any scope within your applications.
    //$rootScope.$state = $state;
    //$rootScope.$stateParams = $stateParams;

    $ionicPlatform.ready(function () {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            cordova.plugins.Keyboard.disableScroll(true);
        }
        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleDefault();
        }

        $log.info('device ready');
    });


    // If on iOS device ask user for user local notification permission
    if (device.platform === "iOS") {
        window.plugin.notification.local.promptForPermission();
    }


    // Event that is trigered when a notification is clicked
    $rootScope.$on('$cordovaLocalNotification:click',
    function (event, notification, state) {
      // Remove the rule that disable the questionaire for the ARK study
      manageLocalData.remove("s2barrierRate");
    });

    //Handles authentication of the user and redirects to login or register pages if user is not verified
    $rootScope.$on('$stateChangeStart', function (event, next, nextParams, fromState) {
        AuthService.tokenManagement();
        if (!AuthService.checkUserAuthentication()) {
            console.log(next.name);
            if (next.name !== 'app.userlogin' && next.name !== 'app.register') {
                event.preventDefault();
                $state.go('app.userlogin');
            }
        }
    });

})

.config(function ($stateProvider, $urlRouterProvider, $logProvider, $ionicConfigProvider) {
    'use strict';
    //Enable log debuging information
    $logProvider.debugEnabled(true);
    //Remove jank scroll (it can be an issue on older android devices)
    //$ionicConfigProvider.scrolling.jsScrolling(false);
    //Places tabs at the bottom for all OS
    //$ionicConfigProvider.tabs.position('bottom');
    //Makes all tabs look the same across all OS
    //$ionicConfigProvider.tabs.style('standard');
    //Set the text for the back button
    $ionicConfigProvider.backButton.text('Menu');

    $stateProvider

        .state('app', {
        url: '/',
        abstract: true,
        templateUrl: 'templates/tabs.html',
        controller: 'AppCtrl as appCtrl',
    })

    // Each tab has its own nav history stack.
    .state('app.dash', {
        url: 'dash',
        views: {
            'app-dash': {
                templateUrl: 'templates/app-dash.html',
                controller: 'DashCtrl as dashCtrl'
            }
        }
    })

    .state('app.sequence', {
        url: 'sequence/{path:.*}',
        views: {
            'app-content': {
                templateUrl: function (params) {
                    var path = params.path.split('/').reverse(),
                        childId = path[0];
                    return 'templates/app-sequence.html';
                },
                controller: 'SequenceCtrl as sequenceCtrl'
            }
        }
    })

    .state('app.menu', {
        url: 'menu/{itemPath:[a-zA-Z0-9/]*}',
        views: {
            'app-content': {
                templateUrl: 'templates/app-menu.html',
                controller: 'MenuCtrl as menuCtrl'
            }
        }
    })

    .state('app.info', {
        url: 'info/:infoID',
        views: {
            'app-content': {
                templateUrl: 'templates/item-info.html',
                controller: 'InfoCtrl as infoCtrl'
            }
        }
    })

    .state('app.survey', {
        url: 'survey/:surveyID',
        views: {
            'app-content': {
                templateUrl: 'templates/item-survey.html',
                controller: 'SurveyCtrl as surveyCtrl'
            }
        }
    })

    .state('app.media', {
        url: 'media/:mediaID',
        views: {
            'app-content': {
                templateUrl: 'templates/item-media.html',
                controller: 'MediaCtrl as mediaCtrl'
            }
        }
    })

    .state('app.diary', {
        url: 'diary/:diaryID',
        views: {
            'app-content': {
                templateUrl: 'templates/item-diary.html',
                controller: 'DiaryCtrl as diaryCtrl'
            }
        }
    })

    .state('app.planner', {
        url: 'planner/:plannerID',
        views: {
            'app-content': {
                templateUrl: 'templates/item-planner.html',
                controller: 'PlannerCtrl as plannerCtrl'
            }
        }
    })

    .state('app.plannerReview', {
        url: 'planner_review/:plannerReviewID',
        views: {
            'app-content': {
                templateUrl: 'templates/item-planner_review.html',
                controller: 'PlannerReviewCtrl as plannerReviewCtrl'
            }
        }
    })

    /*
    .state('app.forum', {
        url: 'forum',
        views: {
            'app-content': {
                templateUrl: 'templates/item-forum.html',
                controller: 'ForumCtrl as forumCtrl'
            }
        }

    })

    .state('app.statistics', {
        url: 'statistics',
        views: {
            'app-content': {
                templateUrl: 'templates/item-statistics.html',
                controller: 'StatisticsCtrl as statisticCtrl'
            }
        }

    })

    .state('app.account', {
        url: 'account',
        views: {
            'app-account': {
                templateUrl: 'templates/app-account.html',
                controller: 'AccountCtrl as accountCtrl'
            }
        }
    })
    */

    .state('app.register', {
        url: 'register',
        views: {
            'app-dash': {
                templateUrl: 'templates/register.html',
                controller: 'RegisterCtrl as registerCtrl'
            }
        }

    })

    .state('app.userlogin', {
        url: 'user',
        views: {
            'app-dash': {
                templateUrl: 'templates/login.html',
                controller: 'LoginCtrl as loginCtrl',
            }
        }
    });

    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('user');

});
