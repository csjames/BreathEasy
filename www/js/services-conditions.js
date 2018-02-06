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

    // Service that evaluates navigation and post conditions of an item
    function checkConditions($log, functions, evaluateConditions) {
        'use strict';

        function post(item) {

            if (item.hasOwnProperty("postActivity")) {
                $log.info('HAS POST ACTIVITY');
                functions.evaluate(item.postActivity);
            }

        }

        function navigation(item) {

            if (item.hasOwnProperty("navCondition")) {
                $log.info('HAS NAVIGATION CONDITION');
                //evaluateConditions.getCondition(item.navCondition);
                return true;
            } else {
                return false;
            }

        }

        return {
            post: post,
            navigation: navigation
        };
    }

    // This service evaluates boolean or primitive comparison expressions and returns true or false.
    function evaluateConditions(appDataService, manageLocalData) {
        'use strict';

        function getCondition(condition) {

            var op = {},
                outcome = {},
                varA = {},
                varB = {},
                items = [],
                comparison = false,
                logicalComparison = false;

            op = condition.op;

            if (condition.varA.hasOwnProperty("variable")) {
                //varA = appDataService.getInterventionScopeItem(condition.varA.variable);
                varA = manageLocalData.retrieveData(condition.varA.variable);
            } else {
                varA = condition.varA;
            }

            if (condition.varB.hasOwnProperty("variable")) {
                //varB = appDataService.getInterventionScopeItem(condition.varB.variable);
                varB = manageLocalData.retrieveData(condition.varB.variable);
            } else {
                varB = condition.varB;
            }

            items = condition.items;
            if (op === 'AND' || op === 'OR') {
                logicalComparison = true;
            } else if (op === '<' || op === '>' || op === '=' || op === '!=') {
                comparison = true;
            }

            if (logicalComparison) {
                outcome = resolveLogicalComparison(op, items);
            } else if (comparison) {
                outcome = resolveComparison(op, varA, varB);
            }

            return outcome;
        }

        function resolveComparison(op, vara, varb) {

            if (op == "=") {
                if (vara == varb) {
                    return true;
                } else {
                    return false;
                }
            } else if (op == "!=") {
                if (vara != varb) {
                    return true;
                } else {
                    return false;
                }
            } else if (op == "<") {
                if (vara < varb) {
                    return true;
                } else {
                    return false;
                }
            } else if (op == ">") {
                if (vara > varb) {
                    return true;
                } else {
                    return false;
                }
            } else if (op == "<=") {
                if (vara <= varb) {
                    return true;
                } else {
                    return false;
                }
            } else if (op == ">=") {
                if (vara >= varb) {
                    return true;
                } else {
                    return false;
                }
            } else
                return false;
        }

        function resolveLogicalComparison(operator, operands) {

            var evaluation = false,
                tempOperand = {},
                numOfoperands = 0;
            numOfoperands = operands.length;

            if (operator === 'AND') {
                for (var i = 0; i < numOfoperands; i++) {
                    tempOperand = operands[i];
                    if (tempOperand && operands[i]) {
                        evaluation = true;
                    } else {
                        evaluation = false;
                    }
                }
            } else if (operator === 'OR') {
                for (var j = 0; j < numOfoperands; j++) {
                    if (operands[j]) {
                        evaluation = true;
                    } else {
                        evaluation = false;
                    }
                }
            }
            return evaluation;
        }

        return {
            resolveComparison: resolveComparison,
            resolveLogicalComparison: resolveLogicalComparison,
            getCondition: getCondition
        };
    }

    //This module is responsible for dealing with the conditional requirements
    //of the application.
    angular.module('LGApp.services.conditions', [])

    .service('checkConditions', checkConditions)

    .service('evaluateConditions', evaluateConditions);

}());
