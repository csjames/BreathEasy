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

    // This service stores all functions defined in the function pool
    // and for all other functions that are nested in items, usually in the post conditions
    // of an item.
    function functions($log, utils, appDataService, manageLocalData) {
        'use strict';

        /* jshint validthis: true */
        var self = this;
        var appFunction = {};

        function getFunctionPool(functionPool) {
            for (var propertyName in functionPool) {
                if (!appDataService.getFunctionPoolItem(propertyName)) {
                    appDataService.setFunctionPool(propertyName, functionPool[propertyName]);
                    $log.debug('Found function of type ' + appDataService.getFunctionPoolItem(propertyName).function);
                } else {
                    throw new Error('Functions can NOT have the same name!'); // WARNING ***** Make sure this is not allowed in the authoring tool
                }
            }
        }

        function getLaunchFunction(appData) {

            if (appData.hasOwnProperty('launchFunction')) {
                evaluate(appDataService.getFunctionPoolItem(appData.launchFunction));
            }
        }

        // Function to evaluate, according to the type of the function, the user defined
        // function and initialise/update values were appropriate.
        function evaluate(functionItem) {
            //functionItem = functionItem[0];
            var aVar = {},
                aVal = {},
                increment = 0,
                newValue = {},
                currentTime = {},
                numSubroutines = 0,
                activityID = {},
                functionName = {};

            if (functionItem.function === 'set') {
                aVar = functionItem.var;
                aVal = functionItem.value;
                //appDataService.setInterventionScope(aVar, aVal);
                manageLocalData.storeLocal(aVar, aVal);
            } else if (functionItem.function === 'increment') {
                aVar = functionItem.var;
                increment = functionItem.increment;
                //if (appDataService.getInterventionScopeItem(aVar)) { // If the key exists update, if not create a new entry.
                if (manageLocalData.retriveData(aVar)) { // If the key exists update, if not create a new entry.
                    //newValue = appDataService.getInterventionScopeItem(aVar) + increment;
                    newValue = manageLocalData.retrieveData(aVar) + increment;
                    //appDataService.updateInterventionScopeItem(aVar, newValue);
                    manageLocalData.storeLocal(aVar, newValue);
                } else {
                    //appDataService.setInterventionScope(aVar, increment);
                    manageLocalData.storeLocal(aVar, increment);
                }
            } else if (functionItem.function === 'setTime') {
                aVar = functionItem.var;
                currentTime = utils.getCurrentTime('hm');
                appDataService.setInterventionScope(aVar, currentTime);
            } else if (functionItem.function === 'ref') {
                functionName = functionItem.refid;
                appDataService.getFunctionPoolItem(functionName);
            } else if (functionItem.function === 'launch') {
                activityID = functionItem.activityId;
                appDataService.getInterventionScopeItem(activityID);
            } else if (functionItem.function === 'subroutine') {
                numSubroutines = functionItem.functions.length;
                for (var i = 0; i < numSubroutines; i++) {
                    return evaluate(functionItem.functions[i]);
                }
            } else if (functionItem.function === 'randomise') {
                $log.warn('Randomise is NOT fully functional, apologies for any inconvenience.');
            } else {
                $log.warn('Unknown type of function');
            }
        }

        return {
            getFunctionPool: getFunctionPool,
            getLaunchFunction: getLaunchFunction,
            evaluate: evaluate
        };
    }

    //NOT USED CURRENTLY
    function abstractFucntion() {
        'use strict';

        // A nice example of how you can allow for abstract functions
        // This function produces other recurring functions and reduces the amount of work needed
        // e.g. var fibonacci = memoizer([0, 1], function (recur, n) {
        // return recur(n - 1) + recur(n - 2);
        // });

        var memoizer = function (memo, formula) {
            var recur = function (n) {
                var result = memo[n];
                if (typeof result !== 'number') {
                    result = formula(recur, n);
                    memo[n] = result;
                }
                return result;
            };
            return recur;
        };
    }

    //This module is responsible for the execution of the functional application
    //requirements.
    angular.module('LGApp.services.functions', [])

    .service('functions', functions)

    .service('abstractFunction', abstractFucntion); //NOT USED CURRENTLY

}());
