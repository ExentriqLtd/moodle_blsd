// (C) Copyright 2015 Martin Dougiamas
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

angular.module('mm.core')

/**
 * Directive to format text rendered.
 *
 * @module mm.core
 * @ngdoc directive
 * @name mmFormatText
 * @description
 * Directive to format text rendered. Attributes it accepts:
 *     -siteid: Site ID to use.
 *     -component: The component for mmExternalContent
 *     -component-id: The component ID for mmExternalContent
 *     -after-render: Scope function to call once the content is renderered. Passes the current scope as argument.
 *     -clean: True if all HTML tags should be removed, false otherwise.
 *     -singleline: True if new lines should be removed (all the text in a single line). Only valid if clean is true.
 *     -watch: True if the variable used inside the directive should be watched for changes. If the variable data is retrieved
 *             asynchronously, this value must be set to true, or the directive should be inside a ng-if, ng-repeat or similar.
 */
.directive('mmFormatText', function($interpolate, $mmText, $compile) {

    var extractVariableRegex = new RegExp('{{([^|]+)(|.*)?}}', 'i');

    return {
        restrict: 'E', // Restrict to <mm-format-text></mm-format-text>.
        transclude: true,
        link: function(scope, element, attrs, ctrl, transclude) { // Link function.
            var siteId = attrs.siteid,
                component = attrs.component,
                componentId = attrs.componentId;
                afterRender = attrs.afterRender;

            transclude(scope, function(clone) {

                var content = angular.element('<div>').append(clone).html(); // Get directive's content.

                function treatContents() {
                    var interpolated = $interpolate(content)(scope); // "Evaluate" scope variables.
                    interpolated = interpolated.trim();

                    // Apply format text function.
                    $mmText.formatText(interpolated, attrs.clean, attrs.singleline).then(function(formatted) {

                        // Convert the content into DOM.
                        var dom = angular.element('<div>').html(formatted);

                        // Walk through the content to find images, and add our directive.
                        angular.forEach(dom.find('img'), function(img) {
                            img.setAttribute('mm-external-content', '');
                            if (component) {
                                img.setAttribute('component', component);
                                if (componentId) {
                                    img.setAttribute('component-id', componentId);
                                }
                            }
                            if (siteId) {
                                img.setAttribute('siteid', siteId);
                            }
                        });

                        // Walk through the content to find the links and add our directive to it.
                        angular.forEach(dom.find('a'), function(anchor) {
                            anchor.setAttribute('mm-external-content', '');
                            anchor.setAttribute('mm-browser', '');
                            if (component) {
                                anchor.setAttribute('component', component);
                                if (componentId) {
                                    anchor.setAttribute('component-id', componentId);
                                }
                            }
                            if (siteId) {
                                anchor.setAttribute('siteid', siteId);
                            }
                        });

                        // Send for display, and compile.
                        element.html(dom.html());
                        $compile(element.contents())(scope);

                        // Call the after render function.
                        if (afterRender && scope[afterRender]) {
                            scope[afterRender](scope);
                        }
                    });
                }

                if (attrs.watch) {
                    // Watch the variable inside the directive. We clean tags that might be added by ionic.
                    var matches = $mmText.cleanTags(content).match(extractVariableRegex);
                    if (matches && typeof matches[1] == 'string') {
                        var variable = matches[1].trim();
                        scope.$watch(variable, function() {
                            treatContents();
                        });
                    }
                } else {
                    treatContents();
                }
            });
        }
    };
});
