'use strict';

// allowed file names
var consoleAllowedNames = require('../ConsoleAllowedFilename.json');

// keep the name of the console variable e.g. console, Console, Logger, logger etc.
var consoleVariableName;

// unallowed file names
var consoleUnallowedName;
module.exports = {
    meta: {
        docs: {
            description: 'Prevent calling Console.get() in incorrect ways',
            category: 'Custom errors',
            recommended: true
        },
        schema: []
    },
    create: function(context) {
        return {

            // Cases:
            //1) var console = require('../monitoring/Console.ds')
            //2) var console = require('../monitoring/Console.ds').get('multipage.widget');
            //3) var Console = require('/mod_bse_core/cartridge/scripts/monitoring/Console.ds'); var Logger = Console.get('mailchimp.newsletter.addmember');
            VariableDeclaration: function(node) {
                if (!node.declarations || node.declarations.length === 0) {
                    return;
                }

                // Exit if not a require call or get call
                if (!(isVariableRequireCall(node) || isVariableGetCall(node))) {
                    return;
                }

                // 1) If is a require call
                if (isVariableRequireCall(node)) {

                    // Exit if get argument does't contains monitoring/Console.ds
                    var argumentValue = node.declarations[0].init.arguments[0].value;
                    if (!argumentValue) {
                        return;
                    }
                    var isVariableRightArgument = checkGetArgument(argumentValue);
                    if (!isVariableRightArgument) {
                        return;
                    }

                    // Get variable name
                    var varName = getVariableName(node);
                    consoleVariableName = varName;
                    return;
                } else {
                    // 2) and 3) If is a get call and require call
                    if (isVariableGetCall(node)) {
                        var isGet = isVariableGetCall(node);
                        if (!isGet) {
                            return;
                        }

                        // match get variable name and require variable name
                        var requireVariableName = node.declarations[0].init.callee.object.name;

                        // escape this case var unitTestsSrc = grunt.config.get('unitTestsSrc');
                        if (node.declarations[0].init.callee.object.property) {
                            return
                        }
                        if (requireVariableName && (consoleVariableName !== requireVariableName)) {
                            return;
                        }
                    }

                    // Fetches value from get()'s argument
                    var getValue = getValueFromCall(node);
                    if (!getValue) {
                        return;
                    }

                    splitArguments(getValue);
                }
                if (isValidGetName(getValue)) {
                    return;
                }

                context.report({
                    node: node,
                    message: '"' + consoleUnallowedName + '""' + ' is not an allowed parameter name. Console.get() method should be called with one of the following arguments: "' + consoleAllowedNames + '"'

                });
            },
            ExpressionStatement: function(node) {
                // Case:   console = require('/mod_bse_core/cartridge/scripts/monitoring/Console.ds').get('checkout.cart.change-quantity');
                var expression = node.expression;
                if (isAssignmentExpression(expression)) {
                    // Exit if there isn't require
                    if (!isExpressionRequireCall(expression)) {
                        return;
                    }

                    // Exit if there isn't get() call
                    if (!isExpressionGetCall) {
                        return;
                    }

                    // Exit if get argument does't contains monitoring/Console.ds
                    var argumentValue = expression.right.callee.object.arguments[0].value;
                    if (!argumentValue) {
                        return;
                    }

                    var isExpressionRightArgument = checkGetArgument(argumentValue);
                    if (!isExpressionRightArgument) {
                        return;
                    }

                    // Exit if there isn't get() argument
                    var getExpressionValue = getExpressionValueFromCall(expression);
                    if (!getExpressionValue) {
                        return;
                    }

                    splitArguments(getExpressionValue);
                } else { //CallExpression
                    //1) Console.get('checkout.minicart.rendering', true);
                    //2) Console.get('checkout.minicart.rendering', true).error('Error when rendering the minicart. Exception message: ' + ex.message);

                    var callee;
                    var getArguments;

                    var getFirstValue = getFirstValueFromCall(expression);
                    var getSecondValue = getSecondValueFromCall(expression);
                    if (!getFirstValue && !getSecondValue) {
                        return;
                    }

                    if (expression.callee.object.callee) {
                        callee = expression.callee.object.callee;
                        getArguments = expression.callee.object.arguments;
                    } else {
                        callee = expression.callee;
                        getArguments = expression.arguments;
                    }

                    if (!callee.object) {
                        return;
                    }

                    if (callee.object.type !== 'Identifier') {
                        return;
                    }

                    var property = callee.property;
                    if (!property) {
                        return;
                    }

                    // Exit if called method is not get
                    var propertyName = property.name;
                    if (!propertyName && (propertyName !== 'get')) {
                        return;
                    }

                    if (callee.object.name !== consoleVariableName) {
                        return;
                    }

                    var firstArgument = getArguments[0].value;

                    if (!firstArgument) {
                        return;
                    }
                    splitArguments(firstArgument);
                }

                if (isValidGetName(consoleUnallowedName)) {
                    return;
                }

                context.report({
                    node: node,
                    message: '"' + consoleUnallowedName + '""' + ' is not an allowed parameter name. Console.get() method should be called with one of the following arguments: "' + consoleAllowedNames + '"'
                });
            }
        };
    }
};

/**
 * Checks a given node is a AssignmentExpression type.
 * @param {Object} expression - A expression to check.
 * @returns {boolean} `true` if the node is a AssignmentExpression node.
 */
function isAssignmentExpression(expression) {
    return expression && expression.type === 'AssignmentExpression';
}

/**
 * Fetches the name of a variable
 * @param {Object} expression - a node.expression
 * @returns {?String} - the var name
 */
function getVariableName(expression) {
    try {
        return expression.declarations[0].id.name;
    } catch (e) {
        return null;
    }
}

/**
 * Checks if a variable is actually a require() call in this case
 * var console = require('../monitoring/Console.ds')
 * @param {Object} variable - the variable to check
 * @returns {Boolean} - require call or not
 */
function isVariableRequireCall(variable) {
    try {
        return variable.declarations[0].init.callee.name === 'require';
    } catch (e) {
        return false;
    }
}

/**
 * Checks if a variable is actually a require() call in this case
 * console = require('/mod_bse_core/cartridge/scripts/monitoring/Console.ds').get('checkout.cart.change-quantity');
 * @param {Object} variable - the variable to check
 * @returns {Boolean} - require call or not
 */
function isExpressionRequireCall(variable) {
    try {
        return variable.right.callee.object.callee.name === 'require';
    } catch (e) {
        return false;
    }
}

/**
 * Checks if the given variable calls get()
 * @param {Object} variable - the variable to check
 * @returns {Boolean} - get call or not
 */
function isVariableGetCall(variable) {
    try {
        return variable.declarations[0].init.callee.property.name === 'get';
    } catch (e) {
        return false;
    }
}


/**
 * Checks if the given expression calls get()
 * @param {Object} expression - the expression to check
 * @returns {Boolean} - get call or not
 */
function isExpressionGetCall(expression) {
    try {
        return expression.right.callee.property.name === 'get';
    } catch (e) {
        return false;
    }
}

/**
 * Checks get() argument for monitoring/Console
 * @param {Object} argument - the argument to check
 * @returns {Boolean} - right argument or not
 */
function checkGetArgument(argument) {
    try {
        return argument.indexOf('monitoring/Console') !== -1;
    } catch (e) {
        return false;
    }
}

/**
 * Fetches the value of the get()'s first argument in cases like this:
 * console = require('/mod_bse_core/cartridge/scripts/monitoring/Console.ds').get('checkout.cart.change-quantity');
 * var Logger = Console.get('mailchimp.newsletter.addmember');
 * @param {Object} expression - a node.expression
 * @returns {?String} - the argument's value
 */
function getExpressionValueFromCall(expression) {
    try {
        return expression.right.arguments[0].value;
    } catch (e) {
        return null;
    }
}

/**
 * Fetches the value of the get()'s first argument in cases like this:
 * var console = require('/mod_bse_core/cartridge/scripts/monitoring/Console.ds').get('multipage.widget.FooterLinkViewHelper');
 * var Logger = Console.get('mailchimp.newsletter.addmember');
 * @param {Object} expression - a node.expression
 * @returns {?String} - the argument's value
 */
function getValueFromCall(expression) {
    try {
        return expression.declarations[0].init.arguments[0].value;
    } catch (e) {
        return null;
    }
}

/**
 * Splits get()'s argument and get the first one from the array
 * @param {String} value - the value of get() argument
 */
function splitArguments(value) {
    // split get() argument
    var splitArguments = value.split('.');

    if (splitArguments.length === 0) {
        return;
    }

    // fetch first one
    consoleUnallowedName = splitArguments[0];
}

/**
 * Validates getValue's namespace
 * @param {Object} getValue - the value of get()
 * @returns {Boolean} - valid or not
 */
function isValidGetName(getValue) {
    var getValueNamespace = getValue.split('.')[0];

    return consoleAllowedNames.indexOf(getValueNamespace) !== -1;
}

/**
 * Fetches the value of the get()'s first argument in cases like this:
 * Console.get('checkout.minicart.rendering');
 * @param {Object} expression - a node.expression
 * @returns {?String} - the argument's value
 */
function getFirstValueFromCall(expression) {
    try {
        return expression.callee.property.name;
    } catch (e) {
        return null;
    }
}

/**
 * Fetches the value of the get()'s second argument in cases like this:
 * Console.get('checkout.minicart.rendering', true).error('Error: ' + ex.message);
 * @param {Object} expression - a node.expression
 * @returns {?String} - the argument's value
 */
function getSecondValueFromCall(expression) {
    try {
        return expression.callee.object.callee.property.name;
    } catch (e) {
        return null;
    }
}
