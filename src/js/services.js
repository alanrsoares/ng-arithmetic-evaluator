(function () {
    var app = angular.module('services', [])

        .factory('expressionEvaluator', function () {

            var mathPatt = /(-?\d+(\.\d+)?)([\^*\/\+-])(-?\d+(\.\d+)?)/,
                subExprPatt = /\(([\s\d*\^\/\+-]+)\)/,
                precPatt0 = /(-?\d+(\.\d+)?)(\^)(\d+(\.\d+)?)/,
                precPatt1 = /(-?\d+(\.\d+)?)([*\/])(-?\d+(\.\d+)?)/;

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

                function evaluateSubExpression() {
                    var subExprSegment = getSubExpression(expr);
                    var subExpression = subExprSegment[1];

                    addStep("sub expression: " + subExprSegment[0]);

                    result = evaluate(subExpression);
                    expr = replaceSegmentResult(subExprSegment, result);
                }

                function evaluateNextSegment() {
                    var segment = getNextSegment(expr);
                    result = evaluateSegment(segment);
                    addStep('segment: ' + segment[0] + ' = ' + result);
                    expr = replaceSegmentResult(segment, result);
                }

                while (hasSubExpression(expr)) evaluateSubExpression();

                while (isValid(expr)) evaluateNextSegment();

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
})();