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

    //Application object
    function Application(front, version, triggers, functions, content, applicationName, launchItem, theme) {
        'use strict';

        this.front = front; //required
        this.version = version; //required
        this.triggers = triggers;
        this.functions = functions; // called functionPool in the authoring tool
        this.content = content; //required
        this.applicationName = applicationName; //required
        this.launchItem = launchItem;
        this.theme = theme;
        this.launchItem; // Attributes included for completeness
        this.logo; // Attributes included for completeness
        this.icon; // Attributes included for completeness
        this.notifIcon; // Attributes included for completeness
    }

    //Item object
    function Item(id, content, label, type, postActivity, navCondition) {
        'use strict';

        this.id = id;
        this.content = content;
        this.label = label;
        this.type = type;
        this.postActivity = postActivity;
        this.navCondition = navCondition;
        this.navConditionFail; // Attribute included for completeness
        this.skipable; // Attribute included for completeness
    }

    //Menu object
    function Menu(id, content, label, type, postActivity, navCondition) {
        'use strict';

        this.id = id;
        this.content = content;
        this.label = label;
        this.type = type;
        this.postActivity = postActivity;
        this.navCondition = navCondition;
    }

    function appConfiguration($log, appDataService) {
        'use strict';

        var appConfiguration = {};

        function setAppConfiguration(data) {
            var front = {},
                content = [],
                functionPool = {},
                triggers = {},
                modelVersion = {},
                applicationName = {},
                launchItem = {},
                theme = {};
            for (var prop in data) {
                // Skip loop if the property is from prototype, i.e. an empty object
                // continue terminates the current iteration of the innermost enclosing for statement
                // and continues execution of the loop with the next iteration.
                if (!data.hasOwnProperty(prop)) continue;
                switch (prop) {
                case 'front':
                    front = data[prop];
                    break;
                case 'content':
                    content = data[prop];
                    break;
                case 'functionPool':
                    functionPool = data[prop];
                    break;
                case 'modelVersion':
                    modelVersion = data[prop];
                    break;
                case 'triggers':
                    triggers = data[prop];
                    break;
                case 'applicationName':
                    applicationName = data[prop];
                    break;
                case 'launchItem':
                    launchItem = data[prop];
                    break;
                case 'theme':
                    theme = data[prop];
                    break;
                default:
                    $log.warn('Unexpected data: ' + data[prop]);
                } //end switch
            }
            appConfiguration = new Application(front, modelVersion, triggers, functionPool, content, applicationName, launchItem, theme);
            appDataService.setApp(appConfiguration);
        }

        function getAppConfiguration() {
            return appDataService.getApp();
        }
        return {
            setAppConfiguration: setAppConfiguration,
            getAppConfiguration: getAppConfiguration
        };
    }

    function itemsConfiguration($log, appDataService, utils) {
        'use strict';

        // Function global variables
        var items = [];
        var item = {},
            menu = {},
            anItem = {},
            hasMenu = false,
            isSequence = false,
            lastItem = false;

        // Refactoring for a more abstract function that can take in as parameters item, menu item or sequence item.
        function setItem(anItem) {

            var item = {};
            var id = {},
                content = {},
                label = {},
                type = {},
                postActivity = {},
                navCondition = {};

            for (var p in anItem) {
                switch (p) {
                case 'id':
                    id = anItem[p];
                    break;
                case 'content':
                    content = anItem[p];
                    break;
                case 'label':
                    label = anItem[p];
                    break;
                case 'type':
                    type = anItem[p];
                    break;
                case 'postActivity':
                    postActivity = anItem[p];
                    break;
                case 'navCondition':
                    navCondition = anItem[p];
                    break;
                default:
                    $log.warn('Unexpected data: ' + anItem[p]);
                }
            }
            item = new Item(id, content, label, type, postActivity, navCondition);
            return item;
        }

        function setItemsConfiguration(data) {
            var id = {},
                content = {},
                label = {},
                type = {},
                item = {},
                postActivity = {},
                navCondition = {};
            for (var prop in data) {
                // Skip loop if the property is from prototype, i.e. an empty object
                // continue terminates the current iteration of the innermost enclosing for statement
                // and continues execution of the loop with the next iteration.
                if (!data.hasOwnProperty(prop)) continue;
                switch (prop) {
                case 'id':
                    id = data[prop];
                    break;
                case 'content':
                    content = data[prop];
                    break;
                case 'label':
                    label = data[prop];
                    break;
                case 'type':
                    type = data[prop];
                    break;
                case 'postActivity':
                    postActivity = data[prop];
                    break;
                case 'navCondition':
                    navCondition = data[prop];
                    break;
                default:
                    $log.warn('Unexpected data: ' + data[prop]);
                }
            }
            //Check if it is a menu the hasMenu check is to avoid adding menu items in case of a nested menu
            if (type === 'menu' && hasMenu === false) {
                hasMenu = true;
                $log.debug('The application has a menu');
                menu = new Menu(id, content, label, type, postActivity, navCondition);
                appDataService.setMenu(menu);
                var numberOfItems = menu.content.items.length;
                for (var i = 0; i < numberOfItems; i++) {
                    setItemsConfiguration(menu.content.items[i]);
                    if (i === numberOfItems - 1) {
                        lastItem = true;
                    }
                }
            } else if (!hasMenu && !isSequence) {
                $log.debug('The application does not have a menu');
                isSequence = true;
                var numOfItemsNoMenu = data.content.items.length; //check to make sure the data is an array *******************
                for (var y = 0; y < numOfItemsNoMenu; y++) {
                    setItemsConfiguration(data.content.items[y]);
                    if (y === numOfItemsNoMenu - 1) {
                        lastItem = true;
                    }
                }

            } else {
                item = new Item(id, content, label, type, postActivity, navCondition);
                appDataService.setItemsHM(id, item);
                items.push(item);

            }
            if (lastItem) {
                $log.debug('The application has: ' + items.length + ' items');
                appDataService.setItems(items);
            }
        }

        /**
         * Function the finds a specific item in an array of items
         * @param   {string} id    The item id
         * @param   {Array} items The items array
         * @returns {object} The item that is returned
         */
        function getMenuItem(itemID, items) {
            var sequences = [],
                menuItems = [];
            var numberOfItems = items.length,
                numberOfSequenceItems = 0,
                numberOfMenuItems = 0,
                item = {},
                foundItem = false,
                hasNewItems = false,
                hasNewMenuItems = false,
                hasNestedSequence = false,
                hasNestedMenu = false;


            var id = {},
                content = {},
                label = {},
                type = {},
                postActivity = {},
                navCondition = {};

            for (var i = 0; i < numberOfItems; i++) {
                if (items[i].type === 'sequence') {
                    hasNestedSequence = true;
                    numberOfSequenceItems = items[i].content.items.length;
                    for (var j = 0; j < numberOfSequenceItems; j++) {

                        id = items[i].content.items[j].id;
                        content = items[i].content.items[j].content;
                        label = items[i].content.items[j].label;
                        type = items[i].content.items[j].type;

                        //The || operator is used to fill in default values in the case that there is no item post activity
                        postActivity = items[i].content.items[j].postActivity || {};

                        if (items[i].content.items[j].hasOwnProperty('navCondition')) {
                            navCondition = items[i].content.items[j].navCondition;
                        }

                        var nestedItem = new Item(id, content, label, type, postActivity, navCondition);

                        //A control statement before the push function the indexOf returns the index of the first element
                        //that it finds in the array, if it does not exist it returns -1
                        if (appDataService.getNestedItems().indexOf(nestedItem) < 0) {
                            hasNewItems = true;
                            sequences.push(nestedItem);
                        }
                    }
                    if (hasNewItems) {
                        appDataService.setNestedItems(sequences);
                    }
                }

                if (items[i].type === 'menu') {
                    hasNestedMenu = true;
                    numberOfMenuItems = items[i].content.items.length;
                    for (var k = 0; k < numberOfMenuItems; k++) {

                        id = items[i].content.items[k].id;
                        content = items[i].content.items[k].content;
                        label = items[i].content.items[k].label;
                        type = items[i].content.items[k].type;
                        //The || operator is used to fill in default values in the case that there is no item post activity
                        postActivity = items[i].content.items[k].postActivity || {};
                        if (items[i].content.items[k].hasOwnProperty('navCondition')) {
                            navCondition = items[i].content.items[k].navCondition;
                        }

                        var menuNestedItem = new Item(id, content, label, type, postActivity, navCondition);
                        //A control statement before the push function the indexOf returns the index of the first element
                        //that it finds in the array, if it does not exist it returns -1
                        if (appDataService.getMenuNestedItems().indexOf(menuNestedItem) < 0) {

                            hasNewMenuItems = true;
                            menuItems.push(menuNestedItem);
                        }
                    }
                    if (hasNewMenuItems) {
                        appDataService.setMenuNestedItems(menuItems);
                    }
                }
                if (items[i].id === itemID) {
                    item = items[i];
                    foundItem = true;
                    $log.debug('Found item: ' + item.id);
                    return item;
                } else if (i === numberOfItems - 1 && !foundItem) {
                    for (var l = 0; l < 2; l++) {
                        if (hasNestedMenu && l === 0) {
                            $log.info('check for nested menu items');
                            return getMenuItem(itemID, appDataService.getMenuNestedItems());
                        }
                        if (l === 1) {
                            $log.info('check for nested sequence items');
                            return getMenuItem(itemID, appDataService.getNestedItems());
                        }
                    }
                }
            }
        }

        // This method is build to replace the getMenuItem() method and is designed to deal with
        // a more abstract type of item rather than menu items which is used for other types as well
        // PLEASE NOTE it is not currently used **************************************
        function getItem(itemID, items) {

            var item = {},
                arrayL = 0;

            // If the item id is already stored in the hash map get it or else seach for nested structures
            if (appDataService.getItemHM(itemID)) {
                item = appDataService.getItemHM(itemID);
            } else {
                arrayL = items.length;
                for (var j = 0; j < arrayL; j++) {
                    if (items[j].type === 'sequence' || items[j].type === 'menu') { // Search if the item is menu or sequence
                        getNestedItems(items[j].content.items);
                        if (appDataService.getItemHM(itemID)) {
                            item = appDataService.getItemHM(itemID);
                        } else if (j == arrayL - 1) { // Check that all the items in the array have been checked for the required item
                            return getItem(itemID, items[j].content.items); // ***** this needs to repeat until not any more nested structures
                        }
                    }
                }
            }

            function getNestedItems(items) {
                var NestedArrayLength = 0;
                NestedArrayLength = items.length;
                for (var i = 0; i < NestedArrayLength; i++) {
                    if (!appDataService.getItemHM(items[i].id)) { // If the item does not exist store the item, note this returns undedined if the id does not exist
                        appDataService.setItemsHM(items[i].id, items[i]);
                    }
                }
            }
            return item;
        }

        function getMenuConfiguration() {
            return appDataService.getMenu();
        }

        function getItemsConfiguration() {
            return appDataService.getItems();
        }
        return {
            setItemsConfiguration: setItemsConfiguration,
            getItemsConfiguration: getItemsConfiguration,
            getMenuConfiguration: getMenuConfiguration,
            getMenuItem: getMenuItem,
            getItem: getItem
        };
    }

    angular.module('LGApp.services.configuration', [])

    .service('appConfiguration', appConfiguration)

    .service('itemsConfiguration', itemsConfiguration);

}());
