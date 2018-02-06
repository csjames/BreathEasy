/* ****************************************************************************
 *                                                                             *
 * Lifeguide Toolbox Hybrid Web Application                                    *
 *                                                                             *
 * Copyright (c) 2016-2017                                                     *
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

    function UsageMonitoringService($log, DataCollectorService, AuthService, $http, API_ENDPOINT, $interval, random) {
        //UsageMonitoringService($rootScope, $cordovaNetwork, $log, DataCollectorService, AuthService, $http, API_ENDPOINT, $interval, random)
        'use strict';

        var uploadUsageData=function(){
            //upload is attempted every 1 hour, if connection not available, data is stored in usageQueue and other data cleared
            $log.info("inside uploadUsageData");
            var preparedData=prepareUsageData();
            if(preparedData!=null){
                if( window.localStorage.getItem("online")==0){
                    $log.info('no internet connection at the moment, queue usage data for sending later');
                    addToUsageQueue(preparedData);
                    //if successfully trasnfered or queued, clear local storage
                    resetUsage();
              }
                else{ //connection available, so post comment immediately
                  var res=$http.post(API_ENDPOINT.url+'/postUsage',preparedData);
                  res.success(function(data, status, headers, config) {
                    $log.log(data);
                     $log.info("successfully trasnfered ,clear local storage");
                    resetUsage();
                });
              }
            }
            else{
                $log.info("no usage data available");
            }
        }


        //data queues
        var promise;

        // Send local saved data to the server periodically
        var sendPeriodicalUsageUploadsNow = function () {
            var usageData = prepareUsageData();
            if (usageData !== null && usageData.usage_items.length > 0) {
                $log.info("we have some usage data that can be sent");
                var url_postMsg = API_ENDPOINT.url + "/postUsage/";
                $http.post(url_postMsg, usageData).success(function (data) {
                    $log.info("from server:" + data);
                    resetUsage();
                });
            } else {
                $log.info("we do not current have usage data that can be sent");
            }
        };

        // Start periodical usage uploads
        var startPeriodicalUsageUploads = function () {
            $log.info("function startUsagePeriodicalUploads here");
            //we sent one time immediately, then start the polling
            sendPeriodicalUsageUploadsNow();
            var url_postMsg = API_ENDPOINT.url + "/postUsage/";
            promise = $interval(function () {
                var usageData = prepareUsageData();
                if (usageData !== null && usageData.usage_items.length > 0) {
                    $log.info("we have some usage data that can be sent");
                    $http.post(url_postMsg, usageData).success(function (data) {
                        $log.info("from server:" + data);
                        resetUsage();
                    });
                } else {
                    $log.info("we do not current have usage data that can be sent");
                }

            }, random.getRandomNumber(300000, 60000)); // // every 5-10 minutes randomised so that all clients dont overload server with request at exactly same time
        };

        // Stop sending periodicall updates to the server
        function stopPeriodicalUsageUploads() {
            $log.info("function stopUsagePeriodicalUploads here");
            $interval.cancel(promise);
        }

        /*  queuedDataName,queuedData) {
              'use strict';
              var queuedDataObj={
                queueName:queuedDataName,
                objs:queuedData
              }
              $log.info("data being sent to server: "+JSON.stringify(queuedDataObj));
               return $http.post(API_ENDPOINT.url+'/postQueuedData',queuedDataObj).then(function (res){
                                                                                  return res.data;
                                                                                });*/

        var addToUsageQueue = function (preparedData) {
            $log.info('adding usage data to queue');
            //adds data to a queue for transmission to server when connection becomes available params(queueName, data)
            DataCollectorService.addDataToQueueLocal("usageQueue", preparedData);
        };

        function prepareUsageData() {
            $log.info("inside prepareUsageData");
            var usage_item_list = getListOfTrackedItems();

            var usage_item_objs = {
                username: AuthService.getNickname(),
                usage_items: []
            };
            if (usage_item_list !== null || usage_item_list !== undefined) {
                $log.info("usageItemListlength=" + usage_item_list.length);
                if (usage_item_list.length > 0) {
                    for (var i = 0; i < usage_item_list.length; i++) {
                        usage_item_objs.usage_items.push(getTrackedItem(usage_item_list[i]));
                    }
                    $log.info(" usage_item_objs: " + JSON.stringify(usage_item_objs));
                }
            } else {
                $log.info(" No usage_item_obj available: " + JSON.stringify(usage_item_objs));
                usage_item_objs = null;
            }
            return usage_item_objs;
        }

        // Clear the usage local stored data of an item
        var resetUsage = function (itemType, itemId) {

            var usage_item_list = getListOfTrackedItems();
            /*var usageDataObj={
                itemType:itemType,
                itemId:itemId,
                usageTimes:[],
                timesUsed:0
            };*/
            if (usage_item_list !== null) {
                for (var i = 0; i < usage_item_list.length; i++) {
                    DataCollectorService.storeLocal(usage_item_list[i], null);
                    $log.info('Item usage for ' + usage_item_list[i] + " has just been reset");
                }
            }
            resetListOfTrackedItems();
        };

        // Append on of the tracked items in the list.
        function appendListOfTrackedItems(itemType, itemId) {
            $log.info("in appendListOfTrackedItems");
            var itemList = [];
            var existingItemList = getListOfTrackedItems();
            var item = "usage_" + itemType + "_" + itemId;

            if (existingItemList !== null) {
                itemList = existingItemList;
                //check if already in the list
                for (var i = 0; i < itemList.length; i++) {
                    $log.info("comparing " + existingItemList[i] + " with " + item);
                    if (existingItemList[i] == item) {
                        $log.info("exist already in list of tracked items");
                        return true;
                    }
                }
            }
            $log.info("item not in tracked list, adding it now");
            itemList.push(item);
            DataCollectorService.storeLocal("usage_item_list", itemList);
            return true;
        }

        // List of all of the tracked items
        function getListOfTrackedItems() {
            $log.info("inside getListOfTrackedItems");
            return DataCollectorService.retrieveLocal("usage_item_list");
        }

        // Get a tracked item
        function getTrackedItem(key) {
            return DataCollectorService.retrieveLocal(key);
        }

        // Clear the array of the tracked items
        function resetListOfTrackedItems() {
            var itemList = [];
            DataCollectorService.storeLocal("usage_item_list", itemList);
        }

        // Start recording user usage
        var recordUsage = function (itemType, itemId) {
            $log.info('Item ' + itemId + " of type " + itemType + " has just been used!");

            var usageDataObj = {
                itemType: itemType,
                itemId: itemId,
                usageTimes: [],
                timesUsed: 0
            };
            var timeObj = {
                timeUsed: new Date()
            };

            var existingUsageDataObj = DataCollectorService.retrieveLocal("usage_" + itemType + "_" + itemId);

            if (existingUsageDataObj !== null) {
                usageDataObj = existingUsageDataObj;
            }

            usageDataObj.usageTimes.push(timeObj);
            usageDataObj.timesUsed += 1;
            DataCollectorService.storeLocal("usage_" + itemType + "_" + itemId, usageDataObj);
            appendListOfTrackedItems(itemType, itemId);
        };

        return {
            uploadUsageData:uploadUsageData,
            recordUsage: recordUsage,
            resetUsage: resetUsage,
            startPeriodicalUsageUploads: startPeriodicalUsageUploads,
            stopPeriodicalUsageUploads: stopPeriodicalUsageUploads,
            sendPeriodicalUsageUploadsNow: sendPeriodicalUsageUploadsNow
        };
    }


    function DataCollectorService($log, $http, API_ENDPOINT) {

        //data queues
        var queueDataArr = [];
        var toolAccessDataQueueArr = [];


        var storeLocal = function (key, data) {
            'use strict';
            $log.info("function storeLocal");
            var serialisedData = JSON.stringify(data);
            window.localStorage.setItem(key, serialisedData);
            $log.info("successfully stored " + serialisedData);
        }

        var retrieveLocal = function (key) {
            'use strict';
            $log.info("function retrieveLocal");
            var unserialisedData = JSON.parse(window.localStorage.getItem(key));
            $log.info("successfully retrieved " + unserialisedData);
            return unserialisedData;
        }

        var sendData = function (queuedDataName, queuedData) {
            'use strict';
            var queuedDataObj = {
                queueName: queuedDataName,
                objs: queuedData
            }
            $log.info("data being sent to server: " + JSON.stringify(queuedDataObj));
            return $http.post(API_ENDPOINT.url + '/postQueuedData', queuedDataObj).then(function (res) {
                return res.data;
            });
        }


        var addDataToQueueLocal = function (queueName, data) {
            'use strict';
            $log.info("function storeDataLocal for queueName: " + queueName);

            //check if Queue exists
            $log.info("queueStatus inside addData" + queueStatus(queueName));
            if (queueStatus(queueName) == 1) {
                $log.info("queue already has some elements");
                //retrieve existing queue
                queueDataArr = retrieveLocal(queueName);
                $log.info("existing content in queue: " + JSON.stringify(queueDataArr));
            } else {
                queueDataArr = [];
                window.localStorage.setItem(queueName + "Status", 1);
            }
            queueDataArr.push(data);
            storeLocal(queueName, queueDataArr)
        }

        var queueStatus = function (queueName) {
            'use strict';
            //check if queue has content
            $log.info("queueStatus for " + queueName + "Status : " + window.localStorage.getItem(queueName + "Status"));
            return window.localStorage.getItem(queueName + "Status");
        }

        var transferQueues = function () {
            if (queueStatus("threadQueue") == 1) {
                if (sendData("threadQueue", retrieveLocal("threadQueue"))) {
                    console.info("threadQueue successfully sent to server and processed")
                    window.localStorage.setItem("threadQueue" + "Status", 0);
                    window.localStorage.setItem("threadQueue", null)
                }
            }

            if (queueStatus("delThreadQueue") == 1) {
                if (sendData("delThreadQueue", retrieveLocal("delThreadQueue"))) {
                    console.info("delThreadQueue successfully sent to server and processed")
                    window.localStorage.setItem("delThreadQueue" + "Status", 0);
                    window.localStorage.setItem("delThreadQueue", null);
                }
            }

            if (queueStatus("editThreadQueue") == 1) {
                if (sendData("editThreadQueue", retrieveLocal("editThreadQueue"))) {
                    console.info("editThreadQueue successfully sent to server and processed")
                    window.localStorage.setItem("editThreadQueue" + "Status", 0);
                    window.localStorage.setItem("editThreadQueue", null);
                }
            }

            if (queueStatus("commentQueue") == 1) {
                if (sendData("commentQueue", retrieveLocal("commentQueue"))) {
                    console.info("commentQueue successfully sent to server and processed")
                    window.localStorage.setItem("commentQueue" + "Status", 0);
                    window.localStorage.setItem("commentQueue", null);
                }
            }

            if (queueStatus("delCommentQueue") == 1) {
                if (sendData("delCommentQueue", retrieveLocal("delCommentQueue"))) {
                    console.info("delCommentQueue successfully sent to server and processed")
                    window.localStorage.setItem("delCommentQueue" + "Status", 0);
                    window.localStorage.setItem("delCommentQueue", null);
                }
            }

            if (queueStatus("usageQueue") == 1) {
                if (sendData("usageQueue", retrieveLocal("usageQueue"))) {
                    console.info("usageQueue successfully sent to server and processed")
                    window.localStorage.setItem("usageQueue" + "Status", 0);
                    window.localStorage.setItem("usageQueue", null);
                }
            }

        }


        return {
            storeLocal: storeLocal,
            addDataToQueueLocal: addDataToQueueLocal,
            retrieveLocal: retrieveLocal,
            sendData: sendData,
            transferQueues: transferQueues
        }
    }

    function manageLocalData($log, API_ENDPOINT, $q, $http, $ionicPopup) {
        'use strict';

        //Save JSON in local storage
        function storeLocal(key, data) {
            window.localStorage.setItem(key, JSON.stringify(data));
        }

        //Retrive JSON from local storage
        function retrieveData(key) {
            var retrieved = JSON.parse(window.localStorage.getItem(key));
            return retrieved;
        }

        //Save key value pair
        function save(key, data) {
            window.localStorage.setItem(key, data);
        }

        //Retrieve value
        function retrieve(key) {
            return window.localStorage.getItem(key);
        }

        //Remove value from local storage
        function remove(key) {
            window.localStorage.removeItem(key);
        }

        function sendData(data) {
            'use strict';

            return $q(function (resolve, reject) {
                $http.post(API_ENDPOINT.url + '/store', data).then(function (result) {
                    if (result.data.success) {
                        resolve(result.data.msg);
                        /*var successAlertPopup = $ionicPopup.alert({
                            title: 'Submit success',
                            template: result.data.msg
                        });*/
                    } else {
                        reject(result.data.msg);
                        var rejectAlertPopup = $ionicPopup.alert({
                            title: 'Submit fail',
                            template: result.data.msg
                        });
                    }
                });
            });

        }

        return {
            storeLocal: storeLocal,
            retrieveData: retrieveData,
            sendData: sendData,
            save: save,
            retrieve: retrieve,
            remove: remove
        };

    }

    function logGeolocationData($log, $cordovaGeolocation, $q, $http, API_ENDPOINT, AuthService) {
        'use strict';

        ionic.Platform.ready(function () {
            // will execute when device is ready, or immediately if the device is already ready.
            $log.info("Check that device is ready before starting the geolocation plugin");
        });

        var watch;

        // Service that get the longtitude and latitude of the device, it does not work on the background
        function getGeolocationPosition() {
            var posOptions = {
                timeout: 10000,
                enableHighAccuracy: false
            };
            $cordovaGeolocation
                .getCurrentPosition(posOptions)
                .then(function (position) {
                    var lat = position.coords.latitude
                    var long = position.coords.longitude
                    $log.info('The user latitude is: ' + lat + ' and the longitude is: ' + long);
                }, function (err) {
                    // error
                    $log.error('unable to read user location');
                });
        }


        // This service is provided by the ngCordova geolocation plugin, and does not work when the app is in the background
        function watchGeolocationPosition(enable) {

            if (enable) {
                var watchOptions = {
                    timeout: 3000, // Maximum length of time (milliseconds) that is allowed to pass
                    maximumAge: 5000, // Accept a cached position whose age is no greater than the specified time (milliseconds)
                    enableHighAccuracy: false // may cause errors if true
                };

                watch = $cordovaGeolocation.watchPosition(watchOptions);

                watch.then(
                    null,
                    function (err) {
                        // error
                        $log.error('Error when watching user location: ' + JSON.stringify(err));
                    },
                    function (position) {
                        var lat = position.coords.latitude;
                        var long = position.coords.longitude;
                        $log.info('The user latitude is: ' + lat + ' and the longitude is: ' + long);
                    });
            } else if (!enable) {
                // Stop tracking geolocation
                watch.clearWatch();

                // This is another way of stoping the tracking and get more feedback in case something goes wrong
                /*
                $cordovaGeolocation.clearWatch(watch)
                    .then(function (result) {
                        // success
                        $log.info('stoped watching user location');
                    }, function (error) {
                        // error
                        $log.error('Error when trying to stop watching user location');
                    });
                //*/
            }
        }

        var captures = 0
        var uploaded = 0

        function backgroundTrackLocation(enable, authToken) {

            document.addEventListener('deviceready', onDeviceReady, false);

            function onDeviceReady() {

                //This callback will be executed every time a geolocation is recorded in the background.
                var callbackFn = function (location) {
                    console.log('[js] BackgroundGeolocation callback:  ' + location.latitude + ',' + location.longitude);
                    captures++

                    // Do your HTTP request here to POST location to your server.
                    // jQuery.post(url, JSON.stringify(location));
                    var data = {};
                    data.timestamp = Date.now();
                    data.latitude = location.latitude;
                    data.longtitude = location.longitude;
                    
                    // return $q(function (resolve, reject) {
                    //     $http.post(API_ENDPOINT.url + '/location', data).then(function (result) {
                    //         if (result.data.success) {
                    //             resolve(result.data.msg);
                    //             uploaded++
    
                    //             showDebugLocationNotification(captures, uploaded)

                    //             // read from storage, try to upload more

                    //             var cachedLocations = JSON.parse(window.localStorage["locations"])
                    //             var cachedLocation = cachedLocations.pop()

                    //             window.localStorage["locations"] = JSON.stringify(cachedLocations)

                    //             if (cachedLocation != null) {
                    //                 callbackFn(cachedLocation)
                    //             }
                    //         } else {
                    //             reject(result.data.msg);

                    //             $log.error("Failed to upload location data")

                    //             showDebugLocationNotification(captures, uploaded)

                    //             // store location for later upload
                    //             var cachedLocationsJSONArray = window.localStorage["locations"] || JSON.stringify([])

                    //             var cachedLocations = JSON.parse(cachedLocationsJSONArray);
                    //             cachedLocations.push(location)
                    //             window.localStorage["locations"] = JSON.stringify(cachedLocations);

                    //             $log.info("We now have " + cachedLocations.length + " cached locations")
                    //                 // read from 
                    //             }
                    //     }, function (error) {
                    //         reject(error)
                    //         $log.error("Failed to upload location data")

                    //         showDebugLocationNotification(captures, uploaded)

                    //         // store location for later upload
                    //         var cachedLocationsJSONArray = window.localStorage["locations"] || JSON.stringify([])

                    //         var cachedLocations = JSON.parse(cachedLocationsJSONArray);
                    //         cachedLocations.push(location)
                    //         window.localStorage["locations"] = JSON.stringify(cachedLocations);

                    //         $log.info("We now have " + cachedLocations.length + " cached locations")

                    //         // enqueue to storage
                    //     });
                    // });

                    /*
                    IMPORTANT:  You must execute the finish method here to inform the native plugin that you're finished,
                    and the background-task may be completed.  You must do this regardless if your HTTP request is successful or not.
                    IF YOU DON'T, ios will CRASH YOUR APP for spending too much time in the background.
                    */
                    backgroundGeolocation.finish();
                };

                var failureFn = function (error) {
                    console.log('BackgroundGeolocation error');
                };

                console.log("Token " + authToken)

                // BackgroundGeolocation is highly configurable. See platform specific configuration options
                backgroundGeolocation.configure(callbackFn, failureFn, {
                    desiredAccuracy: 10,
                    stationaryRadius: 20,
                    distanceFilter: 30,
                    interval: 45000,
                    stopOnTerminate: false,
                    url: API_ENDPOINT.url + '/location',
                    httpHeaders: {
                        'Authorization': authToken
                    },
                    postTemplate: {
                        user: authToken,
                        latitude: '@latitude',
                        longitude: '@longitude',
                        timestamp: '@time' // you can also add your own properties
                    }
                });

                // Turn ON the background-geolocation system.  The user will be tracked whenever they suspend the app.
                if (enable) {
                    backgroundGeolocation.start();
                } else if (!enable) {
                    // If you wish to turn OFF background-tracking, call the #stop method.
                    backgroundGeolocation.stop();
                }
            }
        }

        return {
            getGeolocationPosition: getGeolocationPosition,
            watchGeolocationPosition: watchGeolocationPosition,
            backgroundTrackLocation: backgroundTrackLocation
        };
    }

    function showDebugLocationNotification(captures, uploaded) {
        cordova.plugins.IsDebug.getIsDebug(function(isDebug) {
            if (isDebug) {
                    cordova.plugins.notification.local.schedule({
                        title: 'BreathEasy',
                        text: 'Location Count ' + captures + " Uploaded " + uploaded,
                        foreground: true
                    });

            }
        }, function(err) {
            console.error(err);
        });
    }

    function logUsageData($log, $q, $http, API_ENDPOINT, network, manageLocalData) {
        'use strict';

        function save(activityID) {

            var data = {};
            data.appTimestamp = Date.now();
            data.activityID = activityID;

            // Check that the network conection is good (at least 3G)
            if (network.isAcceptable()) {
                $log.info('network is OK, send data');
                $log.info('log timestamp: ' + data.appTimestamp + ' activivty ID: ' + data.activityID);
                return $q(function (resolve, reject) {
                    $http.post(API_ENDPOINT.url + '/usage', data).then(function (result) {
                        if (result.data.success) {
                            resolve(result.data.msg);
                        } else {
                            reject(result.data.msg);
                        }
                    });
                });

            } else {
                // If there is a que already append the existing one, if not create one
                $log.info('No available network, save data to the queue');
                var tempQueue = [];
                var tempData = {};
                if (manageLocalData.retrieveData("dataQued")) {
                    // There is data stored already to be sent, retrive the data and
                    // amend the data and store to local storage
                    tempQueue = manageLocalData.retrieveData("queue");
                    tempData = data;
                    tempQueue.push(tempData);
                    manageLocalData.storeLocal("queue", tempQueue);
                } else {
                    // Set the variable dataQued as true to know that there are data waitiing to be sent
                    // and store the data in a queue in the form of an array in local storage
                    manageLocalData.save("dataQued", true);
                    tempData = data;
                    tempQueue.push(tempData);
                    manageLocalData.storeLocal("queue", tempQueue);
                }
            }
        }

        function saveQueue(queueData) {
            var data = queueData;
            // Check that the network conection is good (at least 3G)
            if (network.isAcceptable()) {
                $log.info('network is OK, send data');
                $log.info('log timestamp: ' + data.appTimestamp + ' activivty ID: ' + data.activityID);
                return $q(function (resolve, reject) {
                    $http.post(API_ENDPOINT.url + '/usage', data).then(function (result) {
                        if (result.data.success) {
                            resolve(result.data.msg);
                        } else {
                            reject(result.data.msg);
                        }
                    });
                });

            } else {
                // If there is a que already append the existing one, if not create one
                $log.info('No available network, save data to the queue');
                var tempQueue = [];
                var tempData = {};
                if (manageLocalData.retrieveData("dataQued")) {
                    // There is data stored already to be sent, retrive the data and
                    // amend the data and store to local storage
                    tempQueue = manageLocalData.retrieveData("queue");
                    tempData = data;
                    tempQueue.push(tempData);
                    manageLocalData.storeLocal("queue", tempQueue);
                } else {
                    // Set the variable dataQued as true to know that there are data waitiing to be sent
                    // and store the data in a queue in the form of an array in local storage
                    manageLocalData.save("dataQued", true);
                    tempData = data;
                    tempQueue.push(tempData);
                    manageLocalData.storeLocal("queue", tempQueue);
                }
            }
        }

        return {
            save: save,
            saveQueue: saveQueue
        };
    }

    // Service to determine that there is an acceptable connection, it checks every time the app sends data
    function network($cordovaNetwork, $log) {
        'use strict';

        // This function returns true or false, true if the connection is at least 3G
        function isAcceptable() {

            // Local variables
            var acceptableConnection = false;
            var devConnection = $cordovaNetwork.getNetwork();

            // Check to determine the type of connection available
            if (window.Connection) {
                if (navigator.connection.type == Connection.WIFI) {
                    acceptableConnection = true;
                    $log.info('This device has a WiFi connection');
                } else if (navigator.connection.type == Connection.CELL_3G) {
                    acceptableConnection = true;
                    $log.info('This device has a 3G connection');
                } else if (navigator.connection.type == Connection.CELL_4G) {
                    acceptableConnection = true;
                    $log.info('This device has a 4G connection');
                } else if (navigator.connection.type == Connection.CELL_2G) {
                    $log.info('This device has a 2G connection');
                } else if (navigator.connection.type == Connection.ETHERNET) {
                    acceptableConnection = true;
                    $log.info('This device has an Ethernet connection');
                } else if (navigator.connection.type == Connection.NONE) {
                    $log.info('This device has no connection');
                }
            }
            return acceptableConnection;
        }

        return {
            isAcceptable: isAcceptable
        };
    }

    // This module is responsible for dealing with the collection of data from the
    // user for the application.
    angular.module('LGApp.services-data', [])

        .service('UsageMonitoringService', UsageMonitoringService)

        .service('DataCollectorService', DataCollectorService)

        .service('logUsageData', logUsageData)

        .service('logGeolocationData', logGeolocationData)

        .service('manageLocalData', manageLocalData)

        .service('network', network);

}());
