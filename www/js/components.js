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

angular.module('LGApp.components', [])

.directive('myDirective', function () {
    'use strict';

    return {
        restrict: 'E',
        replace: true,
        link: function (scope, elem, attrs) {
            scope.$watch(attrs.value, function (v) {
                elem.text(v == 1 ? 'Foo' : 'Bar');
            });
        }
    };
})

// Not currently used, but may use it to determine type of item using this directive
.directive('typeDirective', function ($log, $state) {
    'use strict';

    return {
        scope: function (elem, attr) {
            if (attr.type == 'info') {
                $log.info('info state');
                return $state.go('app.info');
            } else if (attr.type == 'sequence') {
                return $state.go('app.sequence');
            } else if (attr.type == 'diary') {
                return $state.go('app.diary');
            } else {
                $log.warn('unknown state');
            }
        }
    };
})

//Directive that is used as a small component in Angular 2
//good to have an idea of how the new version will work.
.directive('smallComponent', function () {
    'use strict';

    return {
        controllerAs: 'component',
        scope: scope,
        template: template,
        controller: controller
    };
});
