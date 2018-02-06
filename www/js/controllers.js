/* ****************************************************************************
 *                                                                             *
 * Lifeguide Toolbox Hybrid Web Application                                    *
 *                                                                             *
 * Copyright (c) 2016 -2017                                                    *
 * University of Southampton                                                   *
 *     Author: Petros Papadopoulos                                             *
 *     Author: Roushdat Elaheebocus                                            *
 *     e-mail: p.papadopoulos@soton.ac.uk                                      *
 * All rights reserverd                                                        *
 *                                                                             *
 **************************************************************************** */


// Angular components should be wraped in an Immediately Invoked Function Expression (IIFE)
// An IIFE removes variables from the global scope and avoids global variables and variables collisions
// when the code is minified for deployment to a production server. An IIFE protects this from
// happening providing variable scope for each file.
(function () {

    // PLEASE NOTE that only presentation logic should be added in the controllers, any other business logic
    // should be added in a properly named service
    function DashCtrl($state, VERSION, $log, functions, appDataService, configuration, appConfiguration, AuthService, notification, device, logGeolocationData, $ionicHistory, INFORMATION) {

        var vm = this;
        vm.platform = device.getP();
        vm.platformVersion = device.getV();
        vm.intervensionVesrion = VERSION.versionNumber;
        
        vm.trackON = (window.localStorage["trackLocation"] || "false") == "true"
        
        $log.info("Track Location is set to " + vm.trackON)

        // Local variables
        var appData = {};
        var tempDataStore = {};
        var storeAppState = {};
        var authorisedUser = AuthService.checkUserAuthentication();
        vm.authorised = authorisedUser;

        $log.info(vm.platform + ' ' + vm.platformVersion);

        vm.text1 = INFORMATION.text1;
        vm.text2 = INFORMATION.text2;

        vm.logout = function () {
            AuthService.logout();
            window.localStorage.clear();
            $ionicHistory.clearCache();
            $ionicHistory.clearHistory();
            appDataService.setPointer({});
            $state.go('app.userlogin');
            device.exit();
        };

        vm.updatePreferences = function () {
            $log.info(vm.trackON);
            if (vm.trackON == true) {
                $log.info(vm.trackON);
                //logGeolocationData.getGeolocationPosition();
                //logGeolocationData.watchGeolocationPosition(vm.trackON);
                window.localStorage['trackLocation'] = "true"

                logGeolocationData.backgroundTrackLocation(vm.trackON, AuthService.getToken());

            } else if (vm.trackON === false) {
                $log.info(vm.trackON);

                window.localStorage['trackLocation'] = "false"

                //logGeolocationData.watchGeolocationPosition(vm.trackON);
                logGeolocationData.backgroundTrackLocation(vm.trackON, AuthService.getToken());
                //logGeolocationData.stopWatchGeolocationPosition()
            }
        }

        vm.monitor = function() {
            $log.info("Tracking location from memory: " + vm.trackON)
            logGeolocationData.backgroundTrackLocation(vm.trackON,  AuthService.getToken());
        }

        /*
        var allNotifications = appDataService.getNotifications();
        var allNotifLength = allNotifications.content.items.length;
        for (var i = 0; i < allNotifLength; i++) {
            notification.setNotification(allNotifications.content.items[i], i);
            //notification.scheduleNotification();
        }
        */
        var BENotification = {
            "id": "toolmsg1label",
            "type": 3,
            "label": "tool_msg_1_label",
            "content": {
                "type": 1,
                "title": "BreathEasy",
                "text": "Please fill in the BreathEasy questionnaire"
            },
            "navCondition": {
                "op": "=",
                "varA": "tool_counter",
                "varB": "1"
            },
            "navConditionFail": 0
        };
        var ARKNotification = {
            "id": "toolmsg1label",
            "type": 3,
            "label": "tool_msg_1_label",
            "content": {
                "type": 1,
                "title": "ARK",
                "text": "Please fill in the Barrier questionnaire"
            },
            "navCondition": {
                "op": "=",
                "varA": "tool_counter",
                "varB": "1"
            },
            "navConditionFail": 0
        };

        //Store the amended information of the information that has been changed by
        //the user so it stays persistent next time the user is using the application
        //window.localStorage.setItem('appState' + VERSION.versionNumber, JSON.stringify(storeAppState));

        var appDataFromLocalStorage = JSON.parse(window.localStorage.getItem('localAppData' + VERSION.versionNumber));
        //var appDataFromLocalStorage = null;
        //$log.info(appDataFromLocalStorage);

        // Check and make sure the user is authenticated
        if (authorisedUser) {
            // If application data is saved in local storage, use it and if not
            // make a server call to get the data.
            if (appDataFromLocalStorage) {
                $log.info('DATA IN LOCAL STORAGE');

                appConfiguration.setAppConfiguration(appDataFromLocalStorage);
                AuthService.loadUserCredentials();
                appData = appConfiguration.getAppConfiguration().content[0];
                //functions.getFunctionPool(appDataFromLocalStorage.functionPool);
                //functions.getLaunchFunction(appDataFromLocalStorage);
                appDataService.setPointer(appData);
                setInitialState();

            } else if (!appDataFromLocalStorage) {
                $log.info('NO DATA IN LOCAL STORAGE');

                //Set up BreathEasy 9:00am notifications daily for a week
                /*for (var myCount = 1; myCount < 8; myCount++) {
                    notification.setNotification(BENotification, myCount);
                }*/
                //Set up ARK 9:00am notification for the next day
                //notification.setNotification(ARKNotification, 1);

                configuration.retrieveIntervention(appDataService.getInterventionID()).then(function (value) {

                    //appData = JSON.parse(value[0].data);
                    appData = JSON.parse(value.data);
                    window.localStorage.setItem('localAppData' + VERSION.versionNumber, JSON.stringify(appData));
                    tempDataStore = appData;
                    try {
                        functions.getFunctionPool(appData.functionPool);
                        appConfiguration.setAppConfiguration(appData);
                        //functions.getLaunchFunction(appData);
                        //appFunctionPool.checkFunctionPool(appData.functionPool);
                        $log.info(appData);
                        appData = appConfiguration.getAppConfiguration().content[0];
                        appDataService.setPointer(appData);
                        setInitialState();
                    } catch (e) {
                        $log.error('Application controller ' + e.name + ' exception with message: ' + e.message);
                    }
                }).catch(function (ex) {
                    $log.error("Server call error: " + ex.name + "with message: " + ex.message);
                });
            }
        }

        function setInitialState() {
            if (appData.type === 'menu') {
                appDataService.setPointer(appData);
                $state.go('app.menu');
            } else if (appData.type === 'sequence') {
                appDataService.setPointer(appData);
                $state.go('app.sequence');
            } else {
                //Template of error message in case the app configuration JSON cannot be obtained
                var errorMessage = {
                    "content": {
                        "text": "<p>Error when trying to parse configuration files</p>\n",
                        "title": "Error",
                        "type": 1
                    },
                    "id": "errorinfo",
                    "label": "error",
                    "type": "info"
                };
                appDataService.setPointer(errorMessage);
                $state.go('app.info');
            }
        }

        //When the dashboard screen is pulled down refresh data
        vm.refreshData = function () {
            /*
            configuration.getIntervention(interventionName).then(function (value) {
                try {
                    $log.info("Receiving intervention");
                    testData = value;
                } catch (e) {
                    $log.error(e);
                }
            });
            */

            /*
            configuration.retrieveIntervention(interventionToRetrieve).then(function (data) {
                $log.info("Receiving intervention");
                testData1 = data;
                $log.info('response: ' + testData1);

            }).catch(function () {
                $log.error("Error when geting intervention");
            });

            serverCall.getConf(MODEL.modelName).then(function (value) {
                try {
                    window.localStorage.setItem('localAppData' + VERSION.versionNumber, JSON.stringify(value));
                    //The function getFunctionPool is already filled with functions from the first time
                    //the server call was made, hence throws an error that you can not have functions with
                    //the same name.
                    //functions.getFunctionPool(value.functionPool);
                    functions.getLaunchFunction(value);
                    appDataService.setPointer(value.content[0]);
                } catch (e) {
                    $log.error('Application controller ' + e.name + ' exception with message: ' + e.message);
                }
            });

            */
            //After 1 second stop the spiner
            $timeout(function () {
                $scope.$broadcast('scroll.refreshComplete');
            }, 1000);


        };
    }

    function AppCtrl($ionicLoading) {
        'use strict';

        //var vm = this;

        // Set up the loader while waiting to get the JSON file
        /*
        vm.showLoader = function () {
            $ionicLoading.show({
                content: 'Loading',
                animation: 'fade-in',
                showBackdrop: true,
                maxWidth: 200,
                showDelay: 0
            });
        };updatePrefupdatePreferencesupdatePreferencesupdatePreferenceserences

        vm.hideLoader = function () {
            $ionicLoading.hide();
        };
        */

        //vm.showLoader($ionicLoading);

        //vm.hideLoader($ionicLoading);

    }

    // If the application has a menu or there is an item with a nested menu the controller passes to the menu controller
    function MenuCtrl($log, appDataService, checkConditions, evaluateConditions, logUsageData) {
        'use strict';

        // With the new view caching in Ionic, Controllers are only called
        // when they are recreated or on app start, instead of every page change.
        // To listen for when this page is active (for example, to refresh data),
        // listen for the $ionicView.enter event:
        //
        //$scope.$on('$ionicView.enter', function(e) {
        //});

        var vm = this;
        vm.menu = {};
        vm.items = [];

        vm.isNavigable = function resolveNavigation(resolveItem) {
            if (checkConditions.navigation(resolveItem)) {
                if (evaluateConditions.getCondition(resolveItem.navCondition)) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return true;
            }
        };

        try {
            //itemsConfiguration.setItemsConfiguration(appConfiguration.getAppConfiguration().content[0]);
            //vm.items = itemsConfiguration.getItemsConfiguration();
            //vm.menu = itemsConfiguration.getMenuConfiguration();
            vm.menu = appDataService.getPointer();
            logUsageData.save(vm.menu.id);
            vm.items = vm.menu.content.items;

            vm.setItemData = function (item) {
                appDataService.setPointer(item);
            };

        } catch (e) {
            $log.error('Menu controller ' + e.name + ' exception with message: ' + e.message);
        }
    }

    // If the application is a sequence or there is a nested sequence within an item the control passes to the sequence controller
    function SequenceCtrl($log, appConfiguration, utils, appDataService, checkConditions, evaluateConditions, $scope, manageLocalData, logUsageData, plannerService, $ionicPopup, QUIZ, notification, netwrok) {
        'use strict';
        $log.info("dealing with sequence");

        // With the new view caching in Ionic, Controllers are only called
        // when they are recreated or on app start, instead of every page change.
        // To listen for when this page is active (for example, to refresh data),
        // listen for the $ionicView.enter event:
        //
        //$scope.$on('$ionicView.enter', function(e) {
        //});

        var vm = this;

        vm.appType = appConfiguration.getAppConfiguration().content[0];
        vm.items = [];
        vm.itemID = {};
        vm.itemType = {};
        vm.slideIndex = 0;
        vm.numberOfPages = 0;
        vm.userFeedback = {};
        vm.userFeedbackSingleValue = {};
        var givenItems = {};
        var item = {};
        var navigable = true;

        //Planner variables
        vm.maxPlans = {};
        vm.editData = {};
        vm.planCount = 1;
        vm.selectedArray = [];
        vm.plans = [];

        //Planner review variables
        vm.showFeedback = false;

        var ARKNotification = {
            "id": "toolmsg1label",
            "type": 3,
            "label": "tool_msg_1_label",
            "content": {
                "type": 1,
                "title": "ARK",
                "text": "Please fill in the Barrier questionnaire"
            },
            "navCondition": {
                "op": "=",
                "varA": "tool_counter",
                "varB": "1"
            },
            "navConditionFail": 0
        };

        try {

            //setup slider is initialising attributes that are used in ion-slides directive
            $scope.options = {
                initialSlide: 0,
                pagination: '.custom-swiper-pagination',
                effect: 'slide', //can use  "slide",  "cube", "coverflow" or "flip" do NOT use "fade"
                direction: 'horizontal', //horizontal or vertical
                speed: 600 //0.6s transition
            };

            vm.setItemData = function (item) {
                $log.ing(item);
                appDataService.setPointer(item);
            };

            vm.collectData = function (QID, submited) {

                // Setup the notification when a user submits the form for the first time
                // Chagne to 30 days before deployment **********************************************************************
                //***********************************************************************************************************
                if (QID === "s2barrierRate") {
                    notification.setNotification(ARKNotification, 1);
                }

                // If the item to save is a survey then save each answer individually
                if (item.type === "survey") {
                    var current_question_id, feedback, data, timestamp;
                    var numOfQuestions = item.content.questions.length;
                    timestamp = Date.now();
                    for (var j = 0; j < numOfQuestions; j++) {
                        current_question_id = item.content.questions[j].question_id;
                        feedback = vm.userFeedbackSingleValue[current_question_id];
                        if (feedback.hasOwnProperty("ratings")) {
                            $log.info(feedback);
                            feedback = vm.userFeedbackSingleValue[current_question_id].ratings[0].choices;
                        }
                        data = current_question_id + ", " + feedback;
                        var itemToSave = {
                            'key': timestamp,
                            'data': data
                        };
                        manageLocalData.sendData(itemToSave);
                        appDataService.setInterventionScope(current_question_id, feedback);
                    }
                    manageLocalData.save(QID, submited);
                } else {
                    var uniqueKey = Date.now();
                    var itemToSave = {
                        'key': uniqueKey,
                        'data': QID + ", " + vm.userFeedbackSingleValue[QID]
                    };
                    //JSON.stringify(vm.userFeedbackSingleValue[QID])
                    // previous what was send to server: item
                    manageLocalData.sendData(itemToSave);
                    manageLocalData.save(QID, submited);
                }

                // Give feedback when the user submits the certification form
                if (QID === "s2p9name") {
                    var alertPopup = $ionicPopup.alert({
                        title: "Thank you",
                        template: "Your details have been saved. Please click on the Menu button to go back to the Main menu."
                    });
                    alertPopup.then(function (res) {
                        //When OK go to next page
                        console.log('Go to next page');
                    });
                }

                // Quiz answers
                var userAnswer = 0;
                if (vm.userFeedbackSingleValue[QID] === "Possible risk from infection (Precautionary prescription)") {
                    userAnswer = 1;
                } else if (vm.userFeedbackSingleValue[QID] === "Probable diagnosis of infection (Provisional prescription)") {
                    userAnswer = 2;
                } else if (vm.userFeedbackSingleValue[QID] === "Finalised diagnosis of infection (Finalised prescription)") {
                    userAnswer = 3;
                }
                // Quiz feedback with popup only for the ARK project
                if (QID === "S2p9bquiz1") {
                    if (userAnswer === 1) {
                        var alertPopup = $ionicPopup.alert({
                            title: QUIZ.S2p9cquiz1answers_1_title,
                            template: QUIZ.S2p9cquiz1answers_1_text
                        });
                        alertPopup.then(function (res) {
                            //When OK go to next page
                            console.log('Go to next page');
                        });
                    } else if (userAnswer === 2) {
                        var alertPopup = $ionicPopup.alert({
                            title: QUIZ.S2p9cquiz1answers_2_title,
                            template: QUIZ.S2p9cquiz1answers_2_text
                        });
                        alertPopup.then(function (res) {
                            //When OK go to next page
                            console.log('Go to next page');
                        });
                    } else if (userAnswer === 3) {
                        var alertPopup = $ionicPopup.alert({
                            title: QUIZ.S2p9cquiz1answers_3_title,
                            template: QUIZ.S2p9cquiz1answers_3_text
                        });
                        alertPopup.then(function (res) {
                            //When OK go to next page
                            console.log('Go to next page');
                        });
                    }

                } else if (QID === 'S2p9dquiz2') {
                    if (userAnswer === 1) {
                        var alertPopup = $ionicPopup.alert({
                            title: QUIZ.S2p9equiz2answers_1_title,
                            template: QUIZ.S2p9equiz2answers_1_text
                        });
                        alertPopup.then(function (res) {
                            //When OK go to next page
                            console.log('Go to next page');
                        });
                    } else if (userAnswer === 2) {
                        var alertPopup = $ionicPopup.alert({
                            title: QUIZ.S2p9equiz2answers_2_title,
                            template: QUIZ.S2p9equiz2answers_2_text
                        });
                        alertPopup.then(function (res) {
                            //When OK go to next page
                            console.log('Go to next page');
                        });
                    } else if (userAnswer === 3) {
                        var alertPopup = $ionicPopup.alert({
                            title: QUIZ.S2p9equiz2answers_3_title,
                            template: QUIZ.S2p9equiz2answers_3_text
                        });
                        alertPopup.then(function (res) {
                            //When OK go to next page
                            console.log('Go to next page');
                        });
                    }
                } else if (QID === 'S2p9fquiz3') {
                    if (userAnswer === 1) {
                        var alertPopup = $ionicPopup.alert({
                            title: QUIZ.S2p9gquiz3answers_1_title,
                            template: QUIZ.S2p9gquiz3answers_1_text
                        });
                        alertPopup.then(function (res) {
                            //When OK go to next page
                            console.log('Go to next page');
                        });
                    } else if (userAnswer === 2) {
                        var alertPopup = $ionicPopup.alert({
                            title: QUIZ.S2p9gquiz3answers_2_title,
                            template: QUIZ.S2p9gquiz3answers_2_text
                        });
                        alertPopup.then(function (res) {
                            //When OK go to next page
                            console.log('Go to next page');
                        });
                    } else if (userAnswer === 3) {
                        var alertPopup = $ionicPopup.alert({
                            title: QUIZ.S2p9gquiz3answers_3_title,
                            template: QUIZ.S2p9gquiz3answers_3_text
                        });
                        alertPopup.then(function (res) {
                            //When OK go to next page
                            console.log('Go to next page');
                        });
                    }
                }
            };

            vm.next = function () {
                $scope.slider.slideNext();
            };

            vm.previous = function () {
                $scope.slider.slidePrev();
            };

            //Need to add naviagtion condition according to if a survey has been submited TODO
            //The system logs into local storage if a survey (id number) is submited so need to include when evaluating conditions
            vm.isNavigable = function resolveNavigation(resolveItem) {
                if (checkConditions.navigation(resolveItem)) {
                    if (evaluateConditions.getCondition(resolveItem.navCondition)) {
                        return true;
                    } else {
                        navigable = false;
                        return false;
                    }
                } else {
                    return true;
                }
            };

            //$scope.$watch('data.slider', function (slider) {
            //  $log.info('my slider objet is: ' + slider);
            //});

            //Executes when the slider is initialised
            $scope.$on("$ionicSlides.sliderInitialized", function (event, data) {
                // data.slider is the instance of Swiper
                $scope.slider = data.slider;
                $log.info(data.slider);
            });

            //Executes at the start of a change of a slide
            $scope.$on("$ionicSlides.slideChangeStart", function (event, data) {
                // note: the indexes are 0-based
                vm.slideIndex = data.slider.activeIndex;
                vm.previousIndex = data.slider.previousIndex;
                $log.info('Slide change is beginning');

                // This is checked every you navigate to a page
                if (navigable === false) {
                    // Determine if it is a right or a left swipe to remove the slide
                    if (vm.slideIndex > vm.previousIndex) {
                        vm.slideIndex++;
                        $log.info('RIGHT SWIPE');
                    } else {
                        vm.slideIndex--;
                        $log.info('LEFT SWIPE');
                    }

                    item = vm.items[vm.slideIndex];
                } else {
                    item = vm.items[vm.slideIndex];
                }

                if (item.type === 'planner') {
                    logUsageData.save(item.id);
                    $log.info("dealing with a planner");

                    //*
                    vm.maxPlans = item.content.maxPlans;
                    vm.addFieldSet = function () {
                        plannerService.addFieldSet(item);
                    };
                    vm.getKeyValuePair = function (field) {
                        plannerService.getKeyValuePair(field);
                    };
                    vm.collectDataPlanner = function () {
                        plannerService.collectData();
                    };
                    if ((vm.maxPlans === null) || (vm.maxPlans === undefined)) {
                        vm.maxPlans = 1000; //big number to allow 'unlimited' plans
                    }
                    //if first time
                    $log.info("retrieved :" + manageLocalData.retrieveData(item.id));
                    if (manageLocalData.retrieveData(item.id) === null) {
                        //first time this planner is encountered and it is of type text, so we render the fieldsets and the fields are empty
                        if (item.content.type === "text") {
                            vm.plans = [];
                            var fieldSet = [];
                            for (var i = 0; i < item.content.fields.length; i++) {
                                var obj = {};
                                obj[item.content.fields[i].key] = " ";
                                fieldSet.push(obj);
                            }
                            vm.plans.push(fieldSet);
                        } else if (item.content.type === "multiple-choice") {}
                    } else {
                        //not first time this planner has been used, check for stored data
                        var alreadyStoredPlans = manageLocalData.retrieveData(item.id + "_plans");
                        if (item.content.type === "text") {
                            //and populate fieldsets
                            vm.item.content.renderedFieldSets = alreadyStoredPlans;

                            for (var j = 0; j < alreadyStoredPlans.length; j++) {
                                var fieldSet = [];
                                angular.forEach(alreadyStoredPlans[j].value, function (value, key) {
                                    var field = {
                                key: value
                                    };
                                    fieldSet.push(field);
                                });
                                vm.plans.push(fieldSet);
                            }
                        } else if (item.content.type === "multiple-choice") {
                            $log.info("storedPlans: " + JSON.stringify(alreadyStoredPlans));
                            $log.info("storedPlans: " + JSON.stringify(vm.item.content));
                            vm.selectedArray = [];
                            for (var k = 0; k < vm.item.content.options.length; k++) {
                                vm.selectedArray[k] = false;
                            }
                            for (var l = 0; l < alreadyStoredPlans.length; l++) {
                                vm.selectedArray[alreadyStoredPlans[l].key] = alreadyStoredPlans[l].value;
                            }
                        }
                    }
                    //*/
                } else if (item.type === 'planner_review') {
                    logUsageData.save(item.id);
                    $log.info('Dealing with a planner review');

                    //*
                    $log.info("this is a planner review item" + JSON.stringify(vm.item));
                    vm.storedPlans = manageLocalData.retrieveData(item.content.editPlanner + "_plans");
                    $log.info("stored Plans:" + JSON.stringify(vm.storedPlans));
                    vm.renderedPlans = [];
                    if (item.content.type === "text") {
                        var keys = plannerService.getKeys(vm.storedPlans[0].value);
                        for (var i = 0; i < vm.storedPlans.length; i++) {
                            var plan = "";
                            for (var j = 0; j < keys.length; j++) {
                                $log.info("key is: " + keys[j]);
                                //$log.info("vm.storedPlans[i]: "+JSON.stringify(vm.storedPlans[i].value.who));
                                plan += keys[j] + ":" + vm.storedPlans[i].value[keys[j]] + "; ";
                            }
                            vm.renderedPlans.push(plan);
                        }
                    } else if (vm.item.content.type == "multiple-choice") {
                        //get the options from the corresponding planner
                        var plannerItem = appDataService.searchItem(vm.item.content.editPlanner);
                        var options = plannerItem.content.options;

                        for (var k = 0; k < vm.storedPlans.length; k++) {
                            $log.info("key is: " + vm.storedPlans[k].key);
                            $log.info("value is: " + vm.storedPlans[k].value);
                            //$log.info("vm.storedPlans[i]: "+JSON.stringify(vm.storedPlans[i].value.who));
                            if (vm.storedPlans[k].value === true) {
                                var plan = options[vm.storedPlans[k].key];
                                vm.renderedPlans.push(plan);
                            }
                        }
                    }

                    $log.info("renderedPlans:" + JSON.stringify(vm.renderedPlans));
                    vm.userFeedback = {};
                    vm.collectDataPlannerReview = function () {
                        //plannerReviewService.collectData();
                    }; //end collectdata
                    vm.editPlans = function () {
                        //plannerReviewService.editPlans();
                    };
                    vm.endReview = function () {

                    };

                    //*/
                } else if (item.type === 'survey') {
                    logUsageData.save(item.id);
                    $log.info('collect user response data');
                    $log.info(utils.listAllProperties(vm.userFeedback));
                    for (var j in vm.userFeedback) {
                        appDataService.setInterventionScope(j, vm.userFeedback[j]);
                    }
                } else if (item.type === 'info') {
                    logUsageData.save(item.id);

                    //Has an error, replace with parse text service maybe
                    //vm.checkForVariables = searchText.infoPageVarReplacement(item);
                }



            });

            //Executes at the end of a change of a slide
            $scope.$on("$ionicSlides.slideChangeEnd", function (event, data) {

                // note: the indexes are 0-based
                $scope.activeIndex = data.slider.activeIndex;
                $scope.previousIndex = data.slider.previousIndex;

                checkConditions.post(item);

                if ($scope.activeIndex > $scope.previousIndex) {
                    $log.info('RIGHT SWIPE');
                } else {
                    $log.info('LEFT SWIPE');
                }
                $log.info('Slide change is ending, evaluating post conditions');
            });



            vm.itemID = vm.appType.id;
            vm.itemType = vm.appType.type;
            vm.items = appDataService.getPointer().content.items;
            vm.numberOfPages = vm.items.length;
        } catch (e) {
            $log.error('Sequence controller ' + e.name + ' exception with message: ' + e.message);
        }

    }

    function InfoCtrl(appDataService, checkConditions, evaluateConditions, $log, parseText, logUsageData) {
        'use strict';

        var vm = this;
        vm.isNavigatable = true;
        var unproccesedItem = appDataService.getPointer();
        vm.item = unproccesedItem;
        logUsageData.save(vm.item.id);

        vm.item.content.renderedText = parseText.varReplacement(unproccesedItem.content.text);
        checkConditions.post(vm.item);

        if (checkConditions.navigation(vm.item)) {
            vm.isNavigable = evaluateConditions.getCondition(vm.item.navCondition);
            $log.info(vm.isNavigable);
        }

    }

    function SurveyCtrl(appDataService, manageLocalData, $log, $ionicPopup) {
        'use strict';

        var vm = this;
        vm.item = appDataService.getPointer();
        var numOfQuestions = vm.item.content.questions.length;

        vm.userFeedback = {};
        vm.formStored = false;
        var current_question_id = {};
        var feedback = {};

        /*vm.provideFeedback = $ionicPopup.alert({
            title: 'Form',
            template: 'Please fill in all fields'
        });*/

        //This function is executed when the user clicks on submit at the survey form
        vm.collectData = function () {
            var timestamp = Date.now();
            var data = null;
            for (var j = 0; j < numOfQuestions; j++) {
                current_question_id = vm.item.content.questions[j].question_id;
                feedback = vm.userFeedback[current_question_id];
                if (feedback.hasOwnProperty("ratings")) {
                    $log.info(feedback);
                    feedback = vm.userFeedback[current_question_id].ratings[0].choices;
                }
                data = current_question_id + ", " + feedback;
                var itemToSave = {
                    'key': timestamp,
                    'data': data
                };
                manageLocalData.sendData(itemToSave);
                appDataService.setInterventionScope(current_question_id, feedback);
                vm.formStored = true;
            }
        };
    }

    function MediaCtrl(appDataService) {
        'use strict';

        var vm = this;
        vm.item = appDataService.getPointer();

    }

    function DiaryCtrl(appDataService) {
        'use strict';

        var vm = this;
        vm.item = appDataService.getPointer();
        vm.userFeedback = vm.item;
        vm.collectData = function () {
            for (var j in vm.userFeedback) {
                appDataService.setInterventionScope(vm.userFeedback.id, vm.userFeedback[j]);
            }
        };
    }

    // When a specific item is selected the control passes to the item controller, please note that there
    // can be nested menus or sequences within the items and control must be passed to the appropriate controller.
    function PlannerCtrl($log, appDataService, manageLocalData) {
        'use strict';
        $log.info("planner item");
        var vm = this;
        vm.item = appDataService.getPointer();
        vm.userFeedback = {};
        vm.editData = {};
        vm.planCount = 1;
        vm.maxPlans = vm.item.content.maxPlans;
        vm.selectedArray = [];
        if ((vm.maxPlans === null) || (vm.maxPlans === undefined)) {
            vm.maxPlans = 1000; //big number to allow 'unlimited' plans
        }
        //if first time
        $log.info("retrieved :" + manageLocalData.retrieveData(vm.item.id));
        if (manageLocalData.retrieveData(vm.item.id) === null) {
            //first time this planner is encountered and it is of type text, so we render the fieldsets and the fields are empty
            if (vm.item.content.type === "text") {
                vm.plans = [];
                var fieldSet = [];
                for (var i = 0; i < vm.item.content.fields.length; i++) {
                    var obj = {};
                    obj[vm.item.content.fields[i].key] = " ";
                    fieldSet.push(obj);
                }
                vm.plans.push(fieldSet);
            } else if (vm.item.content.type === "multiple-choice") {

            }

        } else {
            //not first time this planner has been used, check for stored data
            var alreadyStoredPlans = manageLocalData.retrieveData(vm.item.id + "_plans");
            if (vm.item.content.type === "text") {
                //and populate fieldsets
                vm.item.content.renderedFieldSets = alreadyStoredPlans;
                vm.plans = [];
                for (var i = 0; i < alreadyStoredPlans.length; i++) {
                    var fieldSet = [];
                    angular.forEach(alreadyStoredPlans[i].value, function (value, key) {
                        var field = {
                            key: value
                        };
                        fieldSet.push(field);
                    });
                    vm.plans.push(fieldSet);
                }
            } else if (vm.item.content.type === "multiple-choice") {
                $log.info("storedPlans: " + JSON.stringify(alreadyStoredPlans));
                $log.info("storedPlans: " + JSON.stringify(vm.item.content));
                vm.selectedArray = [];
                for (var k = 0; k < vm.item.content.options.length; k++) {
                    vm.selectedArray[k] = false;
                }
                for (var j = 0; j < alreadyStoredPlans.length; j++) {
                    vm.selectedArray[alreadyStoredPlans[j].key] = alreadyStoredPlans[j].value;
                }
            }


        }

        vm.addFieldSet = function () {
            var fieldSet = [];
            for (var i = 0; i < vm.item.content.fields.length; i++) {
                var obj = {};
                obj[vm.item.content.fields[i].key] = "";
                fieldSet.push(obj);
            }
            vm.plans.push(fieldSet);
            vm.planCount = vm.plans.length;
            $log.info("new field set added");
        };

        vm.getKeyValuePair = function (field) {

            var keyValueObj = {
                key: '',
                value: ''
            };
            for (var propName in field) {
                if (field.hasOwnProperty(propName)) {
                    var propValue = field[propName];
                    keyValueObj.key = propName;
                    keyValueObj.value = propValue;
                    break;
                }
            }
            return keyValueObj;
        };

        vm.collectData = function () {
            /*for (var j in vm.userFeedback) {
                appDataService.setInterventionScope(vm.userFeedback.id, vm.userFeedback[j]);
            }*/
            var plans = [];
            plans = manageLocalData.retrieveData(vm.item.id + "_plans");
            $log.info("existing plans are:" + JSON.stringify(plans));
            if (plans != null) { //Some plans already exist...so we clean it and put in the updated plans
                plans = [];
                $log.info("some plans already exist");
                if (vm.item.content.type === 'text') {
                    var tempPlans = [];
                    $log.info("datatocollect:" + JSON.stringify(vm.editData));
                    angular.forEach(vm.editData, function (value, key) {
                        plans.push({
                            key:
                            value
                        });
                    });
                    $log.info("plans:" + JSON.stringify(plans));
                } else if (vm.item.content.type === 'multiple-choice') {
                    var trueCount = 0;
                    angular.forEach(vm.userFeedback, function (value) {
                        if (value === true) {
                            trueCount++;
                        }
                    });
                    if ((trueCount + plans.length) <= vm.item.content.maxPlans) {
                        angular.forEach(vm.userFeedback, function (value, key) {
                            if (value === true) {
                                plans.push({
                                    key:
                                    value
                                });
                            }
                        });
                    } else {
                        $log.info("Could not save additional data, as this will exceed the maximum number of storage ;trueCount:" + trueCount + "; existing plans: " + plans.length + " ; maxplans: " + vm.item.content.maxPlans);
                    }

                }
            } else {
                //no plans exist yet, so we just save new plan data
                manageLocalData.storeLocal(vm.item.id, 1); //indicate that atleast a plan has been created using this planner
                plans = [];

                if (vm.item.content.type === 'text') {
                    $log.info("**************editData:" + JSON.stringify(vm.editData));
                    angular.forEach(vm.editData, function (value, key) {
                        plans.push({
                            key:
                            value
                        });
                    });
                    $log.info("**************editDatato be stored:" + JSON.stringify(plans));
                }
                if (vm.item.content.type === 'multiple-choice') {
                    $log.info("type mc");
                    var trueCount = 0;
                    angular.forEach(vm.userFeedback, function (value) {
                        if (value === true) {
                            trueCount++;
                        }
                    });
                    if (trueCount <= vm.item.content.maxPlans) {
                        angular.forEach(vm.userFeedback, function (value, key) {
                            if (value === true) {
                                plans.push({
                                    key:
                                    value
                                });
                            }
                        });
                    } else {
                        $log.info("Could not save additional data, as this will exceed the maximum number of storage");
                    }

                }
            }
            manageLocalData.storeLocal(vm.item.id + "_plans", plans);
            $log.info("Plans stored");
        };

    }

    function PlannerReviewCtrl($log, appDataService, manageLocalData, $filter, $state, parseText) {
        'use strict';
        $log.info("this is a planner review item");
        var vm = this;
        vm.showFeedback = false;

        vm.item = appDataService.getPointer();
        $log.info("this is a planner review item" + JSON.stringify(vm.item));
        vm.storedPlans = manageLocalData.retrieveData(vm.item.content.editPlanner + "_plans");
        $log.info("stored Plans:" + JSON.stringify(vm.storedPlans));
        vm.renderedPlans = [];
        if (vm.item.content.type === "text") {
            var keys = getKeys(vm.storedPlans[0].value);
            for (var i = 0; i < vm.storedPlans.length; i++) {
                var plan = "";
                for (var j = 0; j < keys.length; j++) {
                    $log.info("key is: " + keys[j]);
                    //$log.info("vm.storedPlans[i]: "+JSON.stringify(vm.storedPlans[i].value.who));

                    plan += keys[j] + ":" + vm.storedPlans[i].value[keys[j]] + "; ";
                }
                vm.renderedPlans.push(plan);

            }
        } else if (vm.item.content.type === "multiple-choice") {
            //get the options from the corresponding planner
            var plannerItem = appDataService.searchItem(vm.item.content.editPlanner);
            var options = plannerItem.content.options;

            for (var k = 0; k < vm.storedPlans.length; k++) {
                $log.info("key is: " + vm.storedPlans[k].key);
                $log.info("value is: " + vm.storedPlans[k].value);

                //$log.info("vm.storedPlans[i]: "+JSON.stringify(vm.storedPlans[i].value.who));
                if (vm.storedPlans[k].value == true) {
                    var plan = options[vm.storedPlans[k].key];
                    vm.renderedPlans.push(plan);
                }

            }
        }

        $log.info("renderedPlans:" + JSON.stringify(vm.renderedPlans));
        vm.userFeedback = {};
        vm.collectData = function () {
            $log.info("data: " + JSON.stringify(vm.userFeedback));
            vm.showFeedback = false;
            vm.latestExecutedPlansCount = 0;
            vm.totalExecutedPlans = manageLocalData.retrieveData(vm.item.id + "_totalScore");
            vm.totalDaysExecutedPlans = manageLocalData.retrieveData(vm.item.id + "_totalDistinctDaysScore");
            vm.dateLastExecuted = manageLocalData.retrieveData(vm.item.id + "_dateLastExecuted");

            if (vm.totalExecutedPlans == null) { //first time, so no total exist yet
                vm.totalExecutedPlans = 0;
                vm.totalDaysExecutedPlans = 0;
            }
            var daysIncrement = false;
            angular.forEach(vm.userFeedback, function (value) {
                if (value == true) {
                    vm.latestExecutedPlansCount++;
                    if (daysIncrement === false) {
                        if (vm.dateLastExecuted === null) {
                            vm.totalDaysExecutedPlans++;
                            daysIncrement = true;
                            vm.dateLastExecuted = $filter('date')(new Date(), 'dd-MM-yyyy');
                            manageLocalData.storeLocal(vm.item.id + "_dateLastExecuted", vm.dateLastExecuted);
                            $log.info("date:" + vm.dateLastExecuted);
                        } else {
                            var todayDate = $filter('date')(new Date(), 'dd-MM-yyyy');
                            if (vm.dateLastExecuted != todayDate) {
                                $log.info("different date....last time was a different day");
                                vm.totalDaysExecutedPlans++;
                                daysIncrement = true;
                                manageLocalData.storeLocal(vm.item.id + "_dateLastExecuted", todayDate);
                            } else {
                                $log.info("executing plans on same date");
                            }
                        }
                    }

                }
            });
            vm.totalExecutedPlans += vm.latestExecutedPlansCount;

            manageLocalData.storeLocal(vm.item.id + "_lastScore", vm.latestExecutedPlansCount);
            manageLocalData.storeLocal(vm.item.id + "_totalScore", vm.totalExecutedPlans);
            manageLocalData.storeLocal(vm.item.id + "_totalDistinctDaysScore", vm.totalDaysExecutedPlans);

            vm.showFeedback = true;

            //----handle variables within feedback text
            vm.item.content.feedback.renderedText = parseText.varReplacement(vm.item.content.feedback.text);


        }; //end collectdata
        vm.editPlans = function () {
            $log.info("planner id is: " + vm.item.content.editPlanner);
            var plannerItem = appDataService.searchItem(vm.item.content.editPlanner);
            if (plannerItem != null) {
                $log.info("Planner is: " + JSON.stringify(plannerItem));
                appDataService.setPointer(plannerItem);
                $state.go('app.planner');

            } else {
                $log.info("could not find the planner");
            }

        };
        vm.endReview = function () {

        };

        function getKeys(plan) {
            $log.info("plan:" + JSON.stringify(plan));
            var keys = [];
            for (var key in plan) {
                $log.info("keyinplan:" + JSON.stringify(key));
                keys.push(key);
            }
            return keys;
        }

    }

    function ForumCtrl($log) {
        'use strict';

        var vm = this;
    }

    function StatisticsCtrl($log) {
        'use strict';

        var vm = this;
    }

    /*
    function AccountCtrl() {
        'use strict';

        var vm = this;
        vm.settings = {};

        vm.settings = {
            enableNotifications: false
        };
    }
    */

    //This is not curently used but either need to use or move to another module
    //*******************************NOT USED YET ******************************
    /*
    function UserCtrl($state, $ionicPopup, AuthService, AUTH_EVENTS) {

        var vm = this;

        vm.$on(AUTH_EVENTS.notAuthenticated, function (event) {
            AuthService.logout();
            $state.go('user.login');
            var alertPopup = $ionicPopup.alert({
                title: 'Session Lost!',
                template: 'Sorry, You have to login again.'
            });
        });
    }
    */

    function LoginCtrl(AuthService, $ionicPopup, $state, VERSION, $ionicHistory) {
        var vm = this;
        var localData = JSON.parse(window.localStorage.getItem('localAppData' + VERSION.versionNumber));
        vm.user = {
            username: '',
            password: ''
        };

        if (localData) {
            $state.go('app.dash');
        }

        vm.login = function () {
            AuthService.login(vm.user).then(function (msg) {
                $ionicHistory.nextViewOptions({
                    disableBack: true
                });
                $state.go('app.dash');
            }, function (errMsg) {
                var alertPopup = $ionicPopup.alert({
                    title: 'Login failed!',
                    template: errMsg
                });
            });
        };
    }

    function RegisterCtrl(AuthService, $ionicPopup, $state, MODEL) {

        var vm = this;
        vm.user = {
            name: '',
            surname: '',
            username: '',
            password: '',
            interventionID: '',
            role: {},
            tel: '',
            email: '',
            organisation: '',
            location: ''
        };

        // If you want to enable an intervention author to test an intervention
        // comment out the code below and enable the author to select the ntervention
        // for the user at the registration page.
        vm.user.interventionID = MODEL.modelName;
        vm.user.role = {
            user: true
        };

        vm.signup = function () {
            AuthService.register(vm.user).then(function (msg) {
                $state.go('app.userlogin'); // Login after you complete registration
                var alertPopup = $ionicPopup.alert({
                    title: 'Register success!',
                    template: msg
                });
            }, function (errMsg) {
                var alertPopup = $ionicPopup.alert({
                    title: 'Register failed!',
                    template: errMsg
                });
            });
        };
    }

    // Explicitly inject dependencies in controller, gives error if there are issues with injected plugins/services
    //*
    DashCtrl.$inject = ['$state', 'VERSION', '$log', 'functions', 'appDataService', 'configuration', 'appConfiguration', 'AuthService', 'notification', 'device', 'logGeolocationData', '$ionicHistory', 'INFORMATION'];
    AppCtrl.$inject = ['$ionicLoading'];
    MenuCtrl.$inject = ['$log', 'appDataService', 'checkConditions', 'evaluateConditions', 'logUsageData'];
    SequenceCtrl.$inject = ['$log', 'appConfiguration', 'utils', 'appDataService', 'checkConditions', 'evaluateConditions', '$scope', 'manageLocalData', 'logUsageData', 'plannerService', '$ionicPopup', 'QUIZ', 'notification', 'network'];
    InfoCtrl.$inject = ['appDataService', 'checkConditions', 'evaluateConditions', '$log', 'parseText', 'logUsageData'];
    SurveyCtrl.$inject = ['appDataService', 'manageLocalData', '$log', '$ionicPopup'];
    PlannerCtrl.$inject = ['$log', 'appDataService', 'manageLocalData'];
    PlannerReviewCtrl.$inject = ['$log', 'appDataService', 'manageLocalData', '$filter', '$state', 'parseText'];
    MediaCtrl.$inject = ['appDataService'];
    DiaryCtrl.$inject = ['appDataService'];
    LoginCtrl.$inject = ['AuthService', '$ionicPopup', '$state', 'VERSION', '$ionicHistory'];
    RegisterCtrl.$inject = ['AuthService', '$ionicPopup', '$state', 'MODEL'];
    //*/

    // Angular controllers should only hold presentation logic, business logic
    // Should be encapsulated in services.
    angular.module('LGApp.controllers', [])

        // Use named functions rather than anonymous callbacks
        // It is easier to read, debug and reduces the amount of nested callback code.
        .controller('DashCtrl', DashCtrl)

        .controller('AppCtrl', AppCtrl)

        .controller('MenuCtrl', MenuCtrl)

        .controller('SequenceCtrl', SequenceCtrl)

        //.controller('AccountCtrl', AccountCtrl)

        //.controller('UserCtrl', UserCtrl) //NOT CURRENTLY USED

        .controller('InfoCtrl', InfoCtrl)

        .controller('SurveyCtrl', SurveyCtrl)

        .controller('PlannerCtrl', PlannerCtrl)

        .controller('PlannerReviewCtrl', PlannerReviewCtrl)

        .controller('MediaCtrl', MediaCtrl)

        //.controller('ForumCtrl', ForumCtrl)

        //.controller('StatisticsCtrl', StatisticsCtrl)

        .controller('DiaryCtrl', DiaryCtrl)

        .controller('LoginCtrl', LoginCtrl)

        .controller('RegisterCtrl', RegisterCtrl);

}());
