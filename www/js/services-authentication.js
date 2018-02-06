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

    function AuthService($q, $http, API_ENDPOINT, $log, appDataService) {
        var LOCAL_TOKEN_KEY = 'userTokenKey';
        var isAuthenticated = false;
        var authToken;

        function loadUserCredentials() {
            var token = window.localStorage.getItem(LOCAL_TOKEN_KEY);
            if (token) {
                $log.info('Load stored user credentials');
                useCredentials(token);
            }
        }

        function storeUserCredentials(token) {
            window.localStorage.setItem(LOCAL_TOKEN_KEY, token);
            useCredentials(token);
        }

        function useCredentials(token) {
            isAuthenticated = true;
            authToken = token;
            // Set the token as header for your requests!
            $http.defaults.headers.common.Authorization = authToken;
        }

        function destroyUserCredentials() {
            authToken = undefined;
            isAuthenticated = false;
            $http.defaults.headers.common.Authorization = undefined;
            window.localStorage.removeItem(LOCAL_TOKEN_KEY);
        }

        function checkUserAuthentication() {
            return isAuthenticated;
        }

        function tokenManagement() {
            var token = window.localStorage.getItem(LOCAL_TOKEN_KEY);
            if (token) {
                loadUserCredentials();
            }
        }

        var register = function (user) {
            return $q(function (resolve, reject) {
                $http.post(API_ENDPOINT.url + '/signup', user).then(function (result) {
                    if (result.data.success) {
                        resolve(result.data.msg);
                    } else {
                        reject(result.data.msg);
                    }
                });
            });
        };

        var login = function (user) {
            return $q(function (resolve, reject) { //API_ENDPOINT.url +
                $http.post(API_ENDPOINT.url + '/authenticate', user).then(function (result) {
                    if (result.data.success) {
                        storeUserCredentials(result.data.token);
                        appDataService.setInterventionID(result.data.interventionID);
                        resolve(result.data.msg);
                    } else {
                        reject(result.data.msg);
                    }
                });
            });
        };

        var logout = function () {
            destroyUserCredentials();
        };

        var getToken = function() {
            return authToken;
        }

        return {
            login: login,
            register: register,
            logout: logout,
            loadUserCredentials: loadUserCredentials,
            checkUserAuthentication: checkUserAuthentication,
            tokenManagement: tokenManagement,
            getToken: getToken
        };
    }

    angular.module('LGApp.services.authentication', [])

    .service('AuthService', AuthService);

}());
