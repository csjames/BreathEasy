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

// Angular components should be wraped in an Immediately Invoked Function Expression (IIFE)
// An IIFE removes variables from the global scope and avoids global variables and variables collisions
// when the code is minified for deployment to a production server. An IIFE protects this from
// happening providing variable scope for each file.
(function () {

    /**
     * Call the server and get data, this information represents
     * the intervention in aJSON data from the server
     * It is good practice to keep functions to 75 LOC and less
     */
    function serverCall($http, $log, $q) {
        'use strict';

        return {
            getConf: function (interventionName) {
                var deferred = $q.defer();
                $http.jsonp('http://localhost:8088/resources/' + interventionName + '?callback=JSON_CALLBACK')
                    .success(function (data) {
                        $log.debug('success receiving data from the server');
                        deferred.resolve(data);
                    })
                    .error(function (data) {
                        $log.error('Error receiving data from the server');
                        deferred.reject(data);
                    });
                return deferred.promise; // Returns a promise that is then resolved in the ui router abstract state in the app.js file
            }
        };
    }

    function plannerService($log, manageLocalData) {
        'use strict';

        var vm = this;

        function addFieldSet(item) {
            var fieldSet = [];
            for (var i = 0; i < item.content.fields.length; i++) {
                var obj = {};
                obj[vm.item.content.fields[i].key] = "";
                fieldSet.push(obj);
            }
            vm.plans.push(fieldSet);
            vm.planCount = vm.plans.length;
            $log.info("new field set added");
        }

        function getKeyValuePair(field) {

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
        }

        function collectData() {
            var plans = [];
            plans = manageLocalData.retrieveData(vm.item.id + "_plans");
            $log.info("existing plans are:" + JSON.stringify(plans));
            if (plans != null) { //Some plans already exist...so we clean it and put in the updated plans
                plans = [];
                $log.info("some plans already exist");
                if (vm.item.content.type == 'text') {
                    var tempPlans = [];
                    $log.info("datatocollect:" + JSON.stringify(vm.editData));
                    angular.forEach(vm.editData, function (value, key) {
                        plans.push({
                            key:
                            value
                        });
                    });
                    $log.info("plans:" + JSON.stringify(plans));
                } else if (vm.item.content.type == 'multiple-choice') {
                    var trueCount = 0;
                    angular.forEach(vm.userFeedback, function (value) {
                        if (value == true) {
                            trueCount++;
                        }
                    });
                    if ((trueCount + plans.length) <= vm.item.content.maxPlans) {
                        angular.forEach(vm.userFeedback, function (value, key) {
                            if (value == true) {
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

                if (vm.item.content.type == 'text') {
                    $log.info("**************editData:" + JSON.stringify(vm.editData));
                    angular.forEach(vm.editData, function (value, key) {
                        plans.push({
                            key:
                            value
                        });
                    });
                    $log.info("**************editDatato be stored:" + JSON.stringify(plans));
                }
                if (vm.item.content.type == 'multiple-choice') {
                    $log.info("type mc");
                    var trueCount = 0;
                    angular.forEach(vm.userFeedback, function (value) {
                        if (value == true) {
                            trueCount++;
                        }
                    });
                    if (trueCount <= vm.item.content.maxPlans) {
                        angular.forEach(vm.userFeedback, function (value, key) {
                            if (value == true) {
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
        }

        function getKeys(plan) {
            $log.info("plan:" + JSON.stringify(plan));
            var keys = [];
            for (var key in plan) {
                $log.info("keyinplan:" + JSON.stringify(key));
                keys.push(key);
            }
            return keys;
        }

        return {
            getKeys: getKeys,
            collectData: collectData,
            getKeyValuePair: getKeyValuePair,
            addFieldSet: addFieldSet
        };

    }

    function plannerReviewService($log, manageLocalData, $filter, $state) {
        'use strict';
        var vm = {};

        function collectData() {
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
                    if (daysIncrement == false) {
                        if (vm.dateLastExecuted == null) {
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
        }

        function editPlans() {
            $log.info("planner id is: " + vm.item.content.editPlanner);
            var plannerItem = appDataService.searchItem(vm.item.content.editPlanner);
            if (plannerItem != null) {
                $log.info("Planner is: " + JSON.stringify(plannerItem));
                appDataService.setPointer(plannerItem);
                $state.go('app.planner');

            } else {
                $log.info("could not find the planner");
            }
        }

        return {
            collectData: collectData,
            editPlans: editPlans
        };

    }

    /**
     * Query the database for a specific intervention JSON and get that file
     */
    function configuration($http, $log, $q, API_ENDPOINT) {
        'use strict';

        var getIntervention = function (ikey) {
            return $q(function (resolve, reject) {
                $http.post(API_ENDPOINT.url + '/getintervention', ikey).then(function (result) {
                    if (result.data.success) {
                        $log.info(result.data);
                        //(result.data.intervention);
                        resolve(result.data.msg);
                        return result.data;
                    } else {
                        reject(result.data.msg);
                    }
                });
            });
        };

        function retrieveIntervention(interventionID) {
            'use strict';

            // return $q(function () {});

            return $http.get(API_ENDPOINT.url + '/intervention/' + ':' + interventionID).then(function (response) {
                return response.data;
            });
            /*
                .then(
                function (response) {
                    $log.info(response.data);
                    return response.data;
                },
                function (errorResponse) {
                    $log.error('Error while geting intervention');
                    return $q.reject(errorResponse);
                }
            );
            */

        }

        return {
            getIntervention: getIntervention,
            retrieveIntervention: retrieveIntervention
        };
    }

    function utils() {
        /**
         * Lists all the properties of an object
         * @param   {object} o The object to list the properties to
         * @returns {string} A string with all the properties of the object
         */
        var listAllProperties = function (o) {
            'use strict';

            var objectToInspect;
            var result = [];
            for (objectToInspect = o; objectToInspect !== null; objectToInspect = Object.getPrototypeOf(objectToInspect)) {
                result = result.concat(Object.getOwnPropertyNames(objectToInspect));
            }
            return result;
        };

        /**
         * Please note that this function is only available in ECMAScript 5
         * @param   {object} obj The object that is tested
         * @returns {boolean} returns true if the object is empty
         */
        var isEmpty = function (obj) {
            'use strict';

            return Object.keys(obj).length === 0;
        };

        var isArray = function (value) {
            'use strict';

            return Object.prototype.toString.apply(value) === '[object Array]';
        };

        function getCurrentTime(type) {
            'use strict';

            var currentDate = {},
                returnTime = {};
            currentDate = new Date();
            if (type === 'hm') {
                returnTime = currentDate.getHours() + ":" + currentDate.getMinutes();
            } else if (type === 'hms') {
                returnTime = currentDate.getHours() + ":" + currentDate.getMinutes() + ":" + currentDate.getSeconds();
            } else if (type === 'dhms') {
                returnTime = currentDate.getDate() + (currentDate.getMonth() + 1) + currentDate.getFullYear() + "AT" + currentDate.getHours() + currentDate.getMinutes() + currentDate.getSeconds();
            }

            return returnTime;
        }

        return {
            isEmpty: isEmpty,
            listAllProperties: listAllProperties,
            isArray: isArray,
            getCurrentTime: getCurrentTime
        };
    }

    /**
     * The service will take in an object and a type of either a Application, Item, or Menu
     * and compare the two to ensure that the information  adheres to the set standard.
     */
    function compareObjects($log) {
        'use strict';

        var isSameType = false;

        var checkObjectTypes = function (objectType, objectToCompare) {
            if (objectToCompare instanceof objectType) {
                isSameType = true;
                $log.debug('The objects are of the same type');
            } else {
                isSameType = false;
                $log.debug('Object is not of the same type as ');
            }
            return isSameType;
        };
        return {
            checkObjectTypes: checkObjectTypes
        };
    }

    // Service that gets the type and general information of the device and when the app on the device is running on background or foreground
    function device($log, manageLocalData, logUsageData, network) {
        'use strict';

        var self = this;
        self.deviceInformation = {};

        ionic.Platform.ready(function () {
            // will execute when device is ready, or immediately if the device is already ready.
            self.deviceInformation = ionic.Platform.device();
            document.addEventListener("deviceready", onDeviceReady, false);
        });

        // device APIs are available
        function onDeviceReady() {
            document.addEventListener("pause", onPause, false);
            document.addEventListener("resume", onResume, false);
        }


        // Handle the pause event
        function onPause() {
            manageLocalData.save("paused", "the app is paused");
            logUsageData.save("paused");
        }

        // Handle the resume event
        function onResume() {

            var tempQueue, queueSize, popped, queueAfter;

            manageLocalData.save("resumed", "the app has resumed");
            logUsageData.save("resumed");

            // When the app is resumed check if there are queued data and if yes try to send the data and clear the queue
            if (manageLocalData.retrieveData("dataQued")) {
                // Check that we have network
                if (network.isAcceptable()) {
                    tempQueue = manageLocalData.retrieveData("queue");
                    queueSize = tempQueue.length;
                    for (var i = 0; i < queueSize; i++) {
                        popped = tempQueue.pop();
                        manageLocalData.storeLocal("queue", tempQueue);
                        logUsageData.saveQueue(popped);
                    }

                    // Check that there is not any data in the queue and if not remove from local storage
                    queueAfter = manageLocalData.retrieveData("queue");
                    if (queueAfter.length === 0) {
                        manageLocalData.remove("dataQued");
                        manageLocalData.remove("queue");
                    }
                }
            }
        }

        var isWebView = ionic.Platform.isWebView();
        var isIPad = ionic.Platform.isIPad();
        var isIOS = ionic.Platform.isIOS();
        var isAndroid = ionic.Platform.isAndroid();
        var isWindowsPhone = ionic.Platform.isWindowsPhone();
        var currentPlatform = ionic.Platform.platform();
        var currentPlatformVersion = ionic.Platform.version();

        // This funtion will force the app to exit
        var exit = function () {
            // Exit the app
            // The information when a user is logs out is not recorded
            ionic.Platform.exitApp();
        };


        var getPlatform = function () {
            return currentPlatform;
        };
        var getPlatformVersion = function () {
            return currentPlatformVersion;
        };

        //Return pointers to the functions
        return {
            getP: getPlatform,
            getV: getPlatformVersion,
            exit: exit
        };
    }

    /**
     * Service with get and set functions for the array of items (enables to easy share items).
     * @param {array} anArray - The array containing all the items send from the server
     * @returns {array} - The array with all the stored values.
     */
    function appDataService($log) {
        'use strict';

        //var self = this;
        var self = {};
        self.LApp = {};
        self.LApp.items = [];
        self.LApp.itemsHM = {};
        self.LApp.intervention = {};
        self.LApp.nestedItems = [];
        self.LApp.menuNestedItems = [];
        self.LApp.menu = {};
        self.LApp.data = {};
        self.LApp.hasMenu = {};
        self.LApp.functionPool = {};
        self.LApp.pointerObject = {};
        self.LApp.interventionID = {};

        // Store the data in the LApp.data variable
        function setAppData(appData) {
            self.LApp.data = appData;
            $log.debug('success storing application data');
        }

        function setMenu(aMenu) {
            self.LApp.menu = aMenu;
            $log.debug('success storing menu data');
        }

        function setItems(arrItems) {
            self.LApp.items = arrItems;
            $log.debug('success storing items data');
        }

        // ************************ WARNING ************************
        // This is the best way to store the items, but because the authoring tool does not
        // generate unique item id numbers this function should not be used until that is fixed
        function setItemsHM(itemID, item) {
            self.LApp.itemsHM[itemID] = item;
            $log.debug('success storing item data in a hash map, ***** WARNING ***** when using this service');
        }

        function setNestedItems(nestedArrItems) {
            self.LApp.nestedItems = nestedArrItems;
            $log.debug('success storing nested items data ' + self.LApp.nestedItems.length);
        }

        function setMenuNestedItems(nestedMenuItems) {
            self.LApp.menuNestedItems = nestedMenuItems;
            $log.debug('success storing menu nested items data ' + self.LApp.menuNestedItems.length);
        }

        function setHasMenu(hasMenu) {
            self.LApp.hasMenu = hasMenu;
            $log.debug('success setting the has menu option to ' + self.LApp.hasMenu);
        }

        function setFunctionPool(functionName, functionObject) {
            self.LApp.functionPool[functionName] = functionObject;
            $log.debug('success storing a function of type ' + self.LApp.functionPool[functionName].function);
        }

        function setInterventionScope(aKey, intervention) {
            self.LApp.intervention[aKey] = intervention;
            $log.debug('success storing intervention data');
        }

        // This variable is used to set the current data according to where you navigate in the intervention JSON
        function setPointer(pointer) {
            self.LApp.pointerObject = pointer;
            $log.debug('success setting poitner object');
        }

        function setInterventionID(id) {
            self.LApp.interventionID = id;
            $log.debug('Intervention ID: ' + id);
        }

        // Get the current intervention local stored data on variable LApp.data
        function getAppData() {
            $log.debug('success retrieving application data');
            return self.LApp.data;
        }

        function getMenu() {
            $log.debug('success retrieving menu data');
            return self.LApp.menu;
        }

        function getItemHM(itemID) {
            return self.LApp.itemsHM[itemID];
        }

        function getItems() {
            $log.debug('success retrieving item data');
            return self.LApp.items;
        }

        function getNestedItems() {
            $log.debug('success retrieving nested item data');
            return self.LApp.nestedItems;
        }

        function getMenuNestedItems() {
            $log.debug('success retrieving nested item data');
            return self.LApp.menuNestedItems;
        }

        function getHasMenu() {
            $log.debug('success retrieving the has menu boolean');
            return self.LApp.hasMenu;
        }

        function getFunctionPoolItem(functionName) {
            if (self.LApp.functionPool.hasOwnProperty(functionName)) {
                $log.debug('success retrieving a function of type ' + self.LApp.functionPool[functionName].function);
            }
            return self.LApp.functionPool[functionName];

        }

        function getInterventionID() {
            $log.debug('success retrieving intervention ID');
            return self.LApp.interventionID;
        }

        function getInterventionScopeItem(aKey) {
            $log.debug('success retrieving a user defined variable');
            return self.LApp.intervention[aKey];
        }

        function getPointer() {
            $log.debug('success retrieving poitner object');
            return self.LApp.pointerObject;
        }

        function searchItem(itemId) {
            $log.debug('searching an item with Id: ' + itemId);
            $log.debug(self.LApp.data.content[0].content.items);
            var item = null;
            traverseObject(self.LApp.data.content[0], 100);
            return item;

            function traverse(x, level) {
                if (isArray(x)) {
                    traverseArray(x, level);
                } else if ((typeof x === 'object') && (x !== null)) {
                    traverseObject(x, level);
                } else {
                    //console.log(level + x);
                }
            }

            function isArray(o) {
                return Object.prototype.toString.call(o) === '[object Array]';
            }

            function traverseArray(arr, level) {
                //console.log(level + "<array>");
                arr.forEach(function (x) {
                    traverse(x, level + "  ");
                });
            }

            function traverseObject(obj, level) {
                //console.log(level + "<object>");
                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        //console.log(level + "  " + key + ":");
                        if (key == "id") {
                            $log.info("we got an id with value: " + obj[key]);
                            if (obj[key] == itemId) {
                                $log.info("we found item with id " + itemId);
                                item = obj;
                                break;
                            }
                        }
                        traverse(obj[key], level + "    ");
                    }
                }
                return null;
            }
        }

        function updateInterventionScopeItem(aKey, newVal) {
            $log.debug('success updating a user defined variable');
            self.LApp.intervention[aKey] = newVal;
        }

        function getNotifications() {
            return notificationSchedule;
        }

        var notificationSchedule = {
            "id": "tool_FromNotif",
            "type": 5,
            "label": "tool_label",
            "content": {
                "items": [
                    {
                        "id": "toolmsg1label",
                        "type": 3,
                        "label": "tool_msg_1_label",
                        "content": {
                            "type": 1,
                            "title": "Healthy Mind",
                            "text": "We all know what it feels like to be stressed.<br>Sometimes we can get so used to it that we don't even know when we're stressed or tense anymore!<br>No-one should have to put-up with feeling stressed – Healthy Mind is here to help make sure you don't!<br>Click 'next' to ease your stress with the Healthy Mind tools."
                        },
                        "navCondition": {
                            "op": "=",
                            "varA": "v-tool_counter",
                            "varB": "1"
                        },
                        "navConditionFail": 0
                        },
                    {
                        "id": "toolmsg2label",
                        "type": 3,
                        "label": "tool_msg_2_label",
                        "content": {
                            "type": 1,
                            "title": "Healthy Mind",
                            "text": "Stress is a part of life.<br>But that doesn't mean you have to just put-up with it!<br>There are lots of things you can do to lift your mood when you need to. Healthy Mind is here to help!<br>Click 'next' to check out the Healthy Mind tools now."
                        },
                        "navCondition": {
                            "op": "=",
                            "varA": "v-tool_counter",
                            "varB": "2"
                        },
                        "navConditionFail": 0
                        },
                    {
                        "id": "toolmsg3label",
                        "type": 3,
                        "label": "tool_msg_3_label",
                        "content": {
                            "type": 1,
                            "title": "Healthy Mind",
                            "text": "It's tricky to find time to use the Healthy Mind tools when there's a lot going on in your life.<br>But this is when you need to look after yourself by doing things that help you to feel happier and healthier.<br>It's also why we've tried to make the Healthy Mind tools quick and easy to use - so you don't need to feel guilty for taking some time out.<br>Click 'next' to give the Healthy Mind tools a try."
                        },
                        "navCondition": {
                            "op": "=",
                            "varA": "v-tool_counter",
                            "varB": "3"
                        },
                        "navConditionFail": 0
                        },
                    {
                        "id": "toolmsg4label",
                        "type": 3,
                        "label": "tool_msg_4_label",
                        "content": {
                            "type": 1,
                            "title": "Healthy Mind",
                            "text": "Have you ever noticed that you catch a cold when you're feeling stressed and run down?<br>That's because when we're stressed our immune system can get weaker so we have less protection from bugs and viruses.<br>  The Healthy Mind tools can help to boost your immune system by easing stress and lifting your mood when you're feeling the pressure.<br>Click 'next' to give the Healthy Mind tools a try."
                        },
                        "navCondition": {
                            "op": "=",
                            "varA": "v-tool_counter",
                            "varB": "4"
                        },
                        "navConditionFail": 0
                        },
                    {
                        "id": "toolmsg5label",
                        "type": 3,
                        "label": "tool_msg_5_label",
                        "content": {
                            "type": 1,
                            "title": "Healthy Mind",
                            "text": "Headaches are common when we're feeling tense, worried or stressed.<br>This happens because our body goes on ‘high alert’ and our brain directs blood-flow away from the head to other parts of the body to be ready to go.<br>You can use the Healthy Mind tools to help in stressful moments - they only take a few minutes.<br>Click 'next' to see if Healthy Mind can help you today."
                        },
                        "navCondition": {
                            "op": "=",
                            "varA": "v-tool_counter",
                            "varB": "5"
                        },
                        "navConditionFail": 0
                        },
                    {
                        "id": "toolmsg6label",
                        "type": 3,
                        "label": "tool_msg_6_label",
                        "content": {
                            "type": 1,
                            "title": "Healthy Mind",
                            "text": "Most of us know what we can do to help us feel better when we are tired, down, or stressed.<br>But a lot of the time life gets in the way and we can't do the good things we planned.<br>Healthy Mind can remind you to do the things that help to keep you feeling positive, happy, and refreshed.<br>Click 'next' to give the Healthy Mind tools a go."
                        },
                        "navCondition": {
                            "op": "=",
                            "varA": "v-tool_counter",
                            "varB": "6"
                        },
                        "navConditionFail": 0
                        },
                    {
                        "id": "toolmsg7label",
                        "type": 3,
                        "label": "tool_msg_7_label",
                        "content": {
                            "type": 1,
                            "title": "Healthy Mind",
                            "text": "Healthy Mind is here to help when you're feeling like things are getting on top of you.<br>It can be tricky to find time to use the Healthy Mind tools.<br>That's why they've been made for those spare few minutes that you might have on the bus or train to work, on your lunch break or just before you go to sleep.<br>Click 'next' to give one a try today."
                        },
                        "navCondition": {
                            "op": "=",
                            "varA": "v-tool_counter",
                            "varB": "7"
                        },
                        "navConditionFail": 0
                        },
                    {
                        "id": "toolmsg8label",
                        "type": 3,
                        "label": "tool_msg_8_label",
                        "content": {
                            "type": 1,
                            "title": "Healthy Mind",
                            "text": "Healthy Mind has lots of tools to help lift your mood.<br>Not everyone will like every tool but we hope that there's at least one that you find helpful!<br>It's totally normal to find the tools a bit unusual to begin with - but with a bit of practice they should start to feel a bit more normal.<br>Click 'next' to see which tools work for you."
                        },
                        "navCondition": {
                            "op": "=",
                            "varA": "v-tool_counter",
                            "varB": "8"
                        },
                        "navConditionFail": 0
                        },
                    {
                        "id": "toolmsg9label",
                        "type": 3,
                        "label": "tool_msg_9_label",
                        "content": {
                            "type": 1,
                            "title": "Healthy Mind",
                            "text": "Some people feel guilty when they take some time to use the tools in Healthy Mind.<br>That's why you need Healthy Mind to remind you that you deserve to have this time and it’s even more important when you are busy, working hard, or feeling a bit run-down.<br>You can give all the tools a go any time - see what works for you!<br>Click 'next' to give them a go right now."
                        },
                        "navCondition": {
                            "op": "=",
                            "varA": "v-tool_counter",
                            "varB": "9"
                        },
                        "navConditionFail": 0
                        },
                    {
                        "id": "toolmsg10label",
                        "type": 3,
                        "label": "tool_msg_10_label",
                        "content": {
                            "type": 1,
                            "title": "Healthy Mind",
                            "text": "When we're busy or feeling a bit stressed it can be hard to do things that we know will help us to feel better (like using the Healthy Mind tools!).<br> To help keep you going it can help to think about why you got Healthy Mind in the first place:<ul><li>Were you feeling a bit stressed out and wanted new tools that could help to boost your mood?</li><li>Was it to feel more healthy and happy?</li><li>Were you just curious?</li></ul>Click 'next' to take a look at the Healthy Mind tools."
                        },
                        "navCondition": {
                            "op": "=",
                            "varA": "v-tool_counter",
                            "varB": "10"
                        },
                        "navConditionFail": 0
                        },
                    {
                        "id": "toolmsg11label",
                        "type": 3,
                        "label": "tool_msg_11_label",
                        "content": {
                            "type": 1,
                            "title": "Healthy Mind",
                            "text": "When we're busy and feeling pressured, it can feel like we have less control and our lives are running away from us.<br>But one thing you can help to control is how you react to pressure.<br>The Healthy Mind tools give you different ways to ease pressure and lift your mood in just a few minutes, whenever you need it.<br>Click 'next' to give them a try."
                        },
                        "navCondition": {
                            "op": "=",
                            "varA": "v-tool_counter",
                            "varB": "11"
                        },
                        "navConditionFail": 0
                        },
                    {
                        "id": "toolmsg12label",
                        "type": 3,
                        "label": "tool_msg_12_label",
                        "content": {
                            "type": 1,
                            "title": "Healthy Mind",
                            "text": "Using the Healthy Mind tools to help ease daily stresses could help you to feel better!<br>Scientists have shown that people who take steps to help with stress live healthier, happier lives .<br>The Healthy Mind tools give you quick, easy ways to deal with stress - any time, any place.<br>Click 'next' to take a look at them right now."
                        },
                        "navCondition": {
                            "op": "=",
                            "varA": "v-tool_counter",
                            "varB": "12"
                        },
                        "navConditionFail": 0
                        },
                    {
                        "id": "toolmsg13label",
                        "type": 3,
                        "label": "tool_msg_13_label",
                        "content": {
                            "type": 1,
                            "title": "Healthy Mind",
                            "text": "Feeling positive, happy, and less stressed can help to keep you looking fresh!<br>That's because a lot of stress can speed up signs of ageing.<br>Healthy Mind gives you access to some popular tools for easing stress.<br>Click 'next' to give them a go today."
                        },
                        "navCondition": {
                            "op": "=",
                            "varA": "v-tool_counter",
                            "varB": "13"
                        },
                        "navConditionFail": 0
                        },
                    {
                        "id": "toolmsg14label",
                        "type": 3,
                        "label": "tool_msg_14_label",
                        "content": {
                            "type": 1,
                            "title": "Healthy Mind",
                            "text": "Feeling tense or down is never good. <br>You can use the tools whenever you need a quick boost or want to do something to ease tension.<br>Remember, you can also use the Healthy Mind tools to stay feeling good!<br>Click 'next' to try them out."
                        },
                        "navCondition": {
                            "op": "=",
                            "varA": "v-tool_counter",
                            "varB": "14"
                        },
                        "navConditionFail": 0
                        },
                    {
                        "id": "toolmsg15label",
                        "type": 3,
                        "label": "tool_msg_15_label",
                        "content": {
                            "type": 1,
                            "title": "Healthy Mind",
                            "text": "We can feel tense and stressed for a while or just for a day.<br>Whatever's happening in your life, Healthy Mind is here to help when you need it.<br>It can be good to use the Healthy Mind tools when you're feeling stressed out - this can help you to relax before you start a new day.<br>Click 'next' to take a look at the tools."
                        },
                        "navCondition": {
                            "op": "=",
                            "varA": "v-tool_counter",
                            "varB": "15"
                        },
                        "navConditionFail": 0,
                        "postActivity": [
                            {
                                "id": "null_tool_MSGCounter",
                                "function": "set",
                                "var": "tool_counter",
                                "value": "0"
                                }
                            ]
                        }
                    ]
            }
        };

        //Return pointers to the functions
        return {
            setApp: setAppData,
            getApp: getAppData,
            setMenu: setMenu,
            setNestedItems: setNestedItems,
            setMenuNestedItems: setMenuNestedItems,
            setHasMenu: setHasMenu,
            setFunctionPool: setFunctionPool,
            setItemsHM: setItemsHM,
            setInterventionScope: setInterventionScope,
            setPointer: setPointer,
            getMenu: getMenu,
            setItems: setItems,
            setInterventionID: setInterventionID,
            getItems: getItems,
            getNestedItems: getNestedItems,
            getMenuNestedItems: getMenuNestedItems,
            getHasMenu: getHasMenu,
            getFunctionPoolItem: getFunctionPoolItem,
            getItemHM: getItemHM,
            getInterventionScopeItem: getInterventionScopeItem,
            getPointer: getPointer,
            getInterventionID: getInterventionID,
            getNotifications: getNotifications,
            searchItem: searchItem,
            updateInterventionScopeItem: updateInterventionScopeItem
        };
    }


    function parseText(manageLocalData) {
        function varReplacement(rawText) {
            var sv = rawText.indexOf('$');
            if (sv != -1) {
                var ev = 0;
                var total = rawText.match(/\$/gi).length;
                for (var i = 0; i < total; i++) {
                    var sv = rawText.indexOf('$', ev);
                    var ev = rawText.indexOf(' ', sv);
                    var intVariable = rawText.substring(sv + 1, ev);
                    var intVariableValue = manageLocalData.retrieveData(intVariable);
                    rawText = rawText.replace("$" + intVariable, intVariableValue); //$ appended to indicate variables within text; to be removed after testing
                }
            }
            return rawText;
        }
        return {
            varReplacement: varReplacement
        };

    }


    function searchText(appDataService, manageLocalData) { //to be removed and replaced by parseText
        'use strict';

        function infoPageVarReplacement(infoItem) {
            var originalContent = infoItem.content.text;
            var processedContent = infoItem.content.text;
            var originalItem = infoItem;
            var sv = originalContent.indexOf('$'); // returns -1 if the character is not found

            if (sv != -1) {
                var ev = 0;
                var total = originalContent.match(/\$/gi).length;
                for (var i = 0; i < total; i++) {
                    var sv = originalContent.indexOf('$', ev);
                    var ev = originalContent.indexOf(' ', sv);
                    var intVariable = originalContent.substring(sv + 1, ev);
                    var intVariableValue = appDataService.getInterventionScopeItem(intVariable);
                    processedContent = processedContent.replace('$' + intVariable, intVariableValue);
                }
            }

            originalItem.content.text = processedContent;

            return originalItem;
        }

        return {
            infoPageVarReplacement: infoPageVarReplacement
        };
    }

    angular.module('LGApp.services.util', [])

        .service('serverCall', serverCall)

        .service('plannerService', plannerService)

        .service('plannerReviewService', plannerReviewService)

        .service('configuration', configuration)

        .service('appDataService', appDataService)

        .service('utils', utils)

        .service('compareObjects', compareObjects)

        .service('searchText', searchText) //to be removed and replaced by parseText

        .service('parseText', parseText)

        .service('device', device);

}());
