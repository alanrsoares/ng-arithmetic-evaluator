var app = angular.module('evaluator', [])

    .controller('AppCtrl', function ($scope, expressionEvaluator) {

        var ee = expressionEvaluator;

        var onExpressionChange = function (newValue, oldValue) {
            if (newValue !== oldValue && ee.isValid(ee.sanitize(newValue))) {
                ee.resetSteps();
                $scope.steps = [];
                evaluate(newValue);
            }
        };

        function evaluate(newValue) {
            $scope.steps = [];
            $scope.result = ee.evaluate(newValue || $scope.expression);
            $scope.steps = ee.getSteps();
        }

        (function init() {
            $scope.steps = [];
            $scope.$watch('expression', onExpressionChange);
            $scope.expression = "3 ^ (3 + (1 + 2 - 3)) * 4 / 5";
            evaluate();
        }());
    })
    .factory('expressionEvaluator', function () {

        var mathPatt = /(-?\d+(\.\d+)?)([\^*\/\+-])(-?\d+(\.\d+)?)/;
        var precPatt0 = /(-?\d+(\.\d+)?)(\^)(\d+(\.\d+)?)/;
        var precPatt1 = /(-?\d+(\.\d+)?)([*\/])(-?\d+(\.\d+)?)/;
        var subExprPatt = /\(([\s\d*\^\/\+-]+)\)/;

        var steps = [];

        function getSteps() {
            return steps;
        }

        function resetSteps() {
            steps = [];
        }

        function addStep(step) {
            steps.push(step);
        }

        function isValid(expr) {
            return mathPatt.test(expr);
        }

        function sanitize(expr) {
            return expr.trim().replace(/\s+/ig, '');
        }

        function getNextSegment(expr) {
            return precPatt0.exec(expr) || precPatt1.exec(expr) || mathPatt.exec(expr);
        }

        function hasSubExpression(expr) {
            return subExprPatt.test(expr);
        }

        function getSubExpression(expr) {
            return subExprPatt.exec(expr);
        }

        function evaluateSegment(segment) {
            var operator = segment[3];
            var elm1 = parseFloat(segment[1]);
            var elm2 = parseFloat(segment[4]);

            switch (operator) {
                case "^":
                    return Math.pow(elm1, elm2);
                case "*":
                    return elm1 * elm2;
                case "/":
                    return elm1 / elm2;
                case "+":
                    return elm1 + elm2;
                case "-":
                    return elm1 - elm2;
            }
        }

        function replaceSegmentResult(segment, result) {
            return segment.input.replace(segment[0], result.toString());
        }

        function evaluate(expression) {
            var expr = sanitize(expression);

            var lastItem = steps.length > 0 ? steps[steps.length - 1] : "";

            var isPartial = /sub/.test(lastItem);

            if (!isPartial)
                addStep("evaluating expression: " + expr);

            var result;

            while (hasSubExpression(expr)) {
                var subExprSegment = getSubExpression(expr);
                var subExpression = subExprSegment[1];

                addStep("sub expression: " + subExprSegment[0]);

                result = evaluate(subExpression);
                expr = replaceSegmentResult(subExprSegment, result);
            }

            while (isValid(expr)) {
                var segment = getNextSegment(expr);
                result = evaluateSegment(segment);
                addStep('segment: ' + segment[0] + ' = ' + result);
                expr = replaceSegmentResult(segment, result);
            }

            if (hasSubExpression(expr))
                expr = evaluate(expr);

            var res = parseFloat(expr.replace(/[\(\)]/ig, ''));

            if (!isPartial)
                addStep('result: ' + res);

            return res;
        }

        return {
            evaluate: evaluate,
            isValid: isValid,
            sanitize: sanitize,
            getSteps: getSteps,
            resetSteps: resetSteps
        };
    });