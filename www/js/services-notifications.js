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

    // This module deals with the parsing and scheduling of notifications
    function getTriggers($log) {
        'use strict';
        //TODO add code here
    }

    function notification($cordovaLocalNotification, $log) {
        'use strict';


        function setNotification(notification, count) {

            var alarmTime = new Date();
            //Set notification time for 9:00am at a specified number of days(count) from today's day
            alarmTime.setHours(9)
            alarmTime.setMinutes(0)
            alarmTime.setSeconds(0)
            alarmTime.setDate(alarmTime.getDate() + count)

            $cordovaLocalNotification.schedule({
                id: '11' + count,
                at: alarmTime,
                text: notification.content.text,
                title: notification.content.title,
                sound: null
            }).then(function () {
                $log.info('The notification has been set');
            });
        }

        function cancelNotification() {

            var scheduledNotifications = [];
            scheduledNotifications = $cordovaLocalNotification.getScheduledIds();
            $cordovaLocalNotification.cancel(scheduledNotifications);

        }

        function instantNotification() {

            $cordovaLocalNotification.schedule({
                id: 1,
                text: 'Please use the app to record some of you daily activity',
                title: 'ARK Notification'
            }).then(function () {
                alert("An instant notification has been set on your device");
            });
        }

        function scheduleNotification(conf) {
            $cordovaLocalNotification.isScheduled('1111').then(function (isScheduled) {
                alert('Notification 1111 is Scheduled: ' + isScheduled);
            });
        }

        return {
            setNotification: setNotification,
            cancelNotification: cancelNotification,
            instantNotification: instantNotification,
            scheduleNotification: scheduleNotification
        };
    }

    angular.module('LGApp.services.notifications', [])

        .service('getTriggers', getTriggers)

        .service('notification', notification);

}());
