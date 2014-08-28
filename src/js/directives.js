(function () {
    var app = angular.module('directives', ['services'])
        .directive('ngExpressionEvaluator', ['expressionEvaluator', function (expressionEvaluator) {

            function link(scope) {
                var ee = expressionEvaluator;

                function onExpressionChange(newValue, oldValue) {
                    if (newValue !== oldValue && ee.isValid(ee.sanitize(newValue))) {
                        ee.resetSteps();
                        scope.steps = [];
                        evaluate(newValue);
                    }
                }

                function evaluate(newValue) {
                    scope.steps = [];
                    scope.result = ee.evaluate(newValue || scope.expression);
                    scope.steps = ee.getSteps();
                }

                (function init() {
                    scope.$watch('expression', onExpressionChange);
                    scope.expression = '3 ^ (3 + (1 + 2 - 3)) * 4 / 5';
                    scope.steps = [];
                    evaluate();
                })();
            }

            return{
                restrict: 'E',
                templateUrl: '../templates/expressionEvaluator.html',
                link: link
            };
        }]);
})();