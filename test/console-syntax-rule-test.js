var chai = require('chai');
var sinon = require('sinon');
var expect = chai.expect;

chai.use(require('sinon-chai'));

describe('console-syntax-rule', function() {
    var consoleSyntaxRule;
    var consoleSyntaxRuleCreate;
    var context;
    var rule;
    var expressionStatementRule;
    var variableDeclarationRule;
    var invalidGetValue = 'invalid.minicart.rendering';
    var validGetValue = 'checkout.minicart.rendering';
    var consoleAllowedNames = 'account, pdp, plp, content, checkout, jobs, adyen, globalcollect, klarna, sds, mailchimp, marked, marketingcloud, paris, zendesk, multipage';

    beforeEach(function() {
        context = {
            report: sinon.spy(),
            options: [{ consoleAllowedNames: consoleAllowedNames }]
        };

        consoleSyntaxRule = require('../rules/console-syntax-rule');
        consoleSyntaxRuleCreate = consoleSyntaxRule.create;
        rule = consoleSyntaxRuleCreate(context);
        expressionStatementRule = rule.ExpressionStatement;
        variableDeclarationRule = rule.VariableDeclaration;
    });

    // var console = require('../monitoring/Console.ds')
    var variableDeclarationStub = function(variableName) {
        return {
            type: 'VariableDeclaration',
            declarations: [
                {
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: variableName
                    },
                    init: {
                        type: 'CallExpression',
                        callee: {
                            type: 'Identifier',
                            name: 'require'
                        },
                        arguments: [
                            {
                                type: 'Literal',
                                value: '../monitoring/Console.ds'
                            }
                        ]
                    }
                }
            ]
        };
    };

    //var console = require('../monitoring/Console.ds').get('multipage.widget');
    var variableDeclarationRequireGetStub = function(value) {
        return {
            type: 'VariableDeclaration',
            declarations: [
                {
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'console'
                    },
                    init: {
                        type: 'CallExpression',
                        callee: {
                            type: 'MemberExpression',
                            computed: false,
                            object: {
                                type: 'CallExpression',
                                callee: {
                                    type: 'Identifier',
                                    name: 'require'
                                },
                                arguments: [
                                    {
                                        type: 'Literal',
                                        value: '../monitoring/Console.ds'
                                    }
                                ]
                            },
                            property: {
                                type: 'Identifier',
                                name: 'get'
                            }
                        },
                        arguments: [
                            {
                                type: 'Literal',
                                value: value
                            }
                        ]
                    }
                }
            ]
        };
    };

    // var console = require('/mod_bse_core/cartridge/scripts/monitoring/Console.ds');
    // var Logger = console.get('mailchimp.newsletter.addmember')
    var variableDeclarationGet = function(value, objectName) {
        return {
            type: 'VariableDeclaration',
            declarations: [
                {
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'Logger'
                    },
                    init: {
                        type: 'CallExpression',
                        callee: {
                            type: 'MemberExpression',
                            computed: false,
                            object: {
                                type: 'Identifier',
                                name: objectName
                            },
                            property: {
                                type: 'Identifier',
                                name: 'get'
                            }
                        },
                        arguments: [
                            {
                                type: 'Literal',
                                value: value
                            }
                        ]
                    }
                }
            ]
        };
    };

    // console.get('checkout.minicart.rendering', true)
    var callExpressionStatementStub = function(value, variableName) {
        return {
            type: 'ExpressionStatement',
            expression: {
                type: 'CallExpression',
                callee: {
                    type: 'MemberExpression',
                    computed: false,
                    object: {
                        type: 'Identifier',
                        name: variableName
                    },
                    property: {
                        type: 'Identifier',
                        name: 'get'
                    }
                },
                arguments: [
                    {
                        type: 'Literal',
                        value: value
                    },
                    {
                        type: 'Literal',
                        value: true
                    }
                ]
            }
        };
    };

    var assignmentExpressionStatementStub = function(value) {
        return {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'console'
                },
                right: {
                    type: 'CallExpression',
                    callee: {
                        type: 'MemberExpression',
                        computed: false,
                        object: {
                            type: 'CallExpression',
                            callee: {
                                type: 'Identifier',
                                name: 'require'
                            },
                            arguments: [
                                {
                                    type: 'Literal',
                                    value: '/mod_bse_core/cartridge/scripts/monitoring/Console.ds'
                                }
                            ]
                        },
                        property: {
                            type: 'Identifier',
                            name: 'get'
                        }
                    },
                    arguments: [
                        {
                            type: 'Literal',
                            value: value
                        }
                    ]
                }
            }
        };
    };

    //Console.get('checkout.minicart.rendering', true).error('Error when rendering the minicart. Exception message: ' + ex.message);
    var callExpressionStatementStubMultipleParameters = function(value, variableName) {
        return {
            type: 'ExpressionStatement',
            expression: {
                type: 'CallExpression',
                callee: {
                    type: 'MemberExpression',
                    computed: false,
                    object: {
                        type: 'CallExpression',
                        callee: {
                            type: 'MemberExpression',
                            computed: false,
                            object: {
                                type: 'Identifier',
                                name: variableName
                            },
                            property: {
                                type: 'Identifier',
                                name: 'get'
                            }
                        },
                        arguments: [
                            {
                                type: 'Literal',
                                value: value
                            },
                            {
                                type: 'Literal',
                                value: true,
                                raw: 'true'
                            }
                        ]
                    },
                    property: {
                        type: 'Identifier',
                        name: 'error'
                    }
                }
            }
        };
    };
    describe('when defined as variable and call as CallExpression statement', function() {
        // var console = require('../monitoring/Console.ds')
        // console.get('checkout.minicart.rendering', true)
        it('should not report an error when console.get() is called correctly', function() {
            // arrange
            var nodeExpression = callExpressionStatementStub(validGetValue, 'console');
            var nodeVariable = variableDeclarationStub('console');

            // act
            variableDeclarationRule(nodeVariable);
            expressionStatementRule(nodeExpression);

            // assert
            expect(context.report).to.not.have.been.called;
        });

        it('should report an error when console.get() is called incorrectly', function() {
            // arrange
            var nodeExpression = callExpressionStatementStub(invalidGetValue, 'console');
            var nodeVariable = variableDeclarationStub('console');

            // act
            variableDeclarationRule(nodeVariable);
            expressionStatementRule(nodeExpression);

            // assert
            expect(context.report).to.have.been.calledOnce;
        });

        // var console = require('../monitoring/Console.ds')
        //Console.get('checkout.minicart.rendering', true).error('Error when rendering the minicart. Exception message: ' + ex.message);
        it('should not report an error when console.get() is called correctly and with called error()', function() {
            // arrange
            var nodeExpression = callExpressionStatementStubMultipleParameters(validGetValue, 'console');
            var nodeVariable = variableDeclarationStub('console');

            // act
            variableDeclarationRule(nodeVariable);
            expressionStatementRule(nodeExpression);

            // assert
            expect(context.report).to.not.have.been.called;
        });

        it('should report an error when console.get() is called incorrectly  and with called error()', function() {
            // arrange
            var nodeExpression = callExpressionStatementStubMultipleParameters(invalidGetValue, 'console');
            var nodeVariable = variableDeclarationStub('console');

            // act
            variableDeclarationRule(nodeVariable);
            expressionStatementRule(nodeExpression);

            // assert
            expect(context.report).to.have.been.calledOnce;
        });
    });
    describe('when defined as variable and call with AssignmentExpression statement', function() {
        // var console
        // console = require('/mod_bse_core/cartridge/scripts/monitoring/Console.ds').get('checkout.cart.change-quantity')
        it('should not report an error when console.get() is called correctly', function() {
            // arrange
            var nodeExpression = assignmentExpressionStatementStub(validGetValue);

            // act
            expressionStatementRule(nodeExpression);

            // assert
            expect(context.report).to.not.have.been.called;
        });

        it('should report an error when console.get() is called incorrectly', function() {
            // arrange
            var nodeExpression = assignmentExpressionStatementStub(invalidGetValue);

            // act
            expressionStatementRule(nodeExpression);

            // assert
            expect(context.report).to.have.been.calledOnce;
        });
    });
    describe('when defined as variable', function() {
        it('should not report an error when console.get() is called correctly', function() {
            var nodeVariable = variableDeclarationRequireGetStub(validGetValue);

            // act
            variableDeclarationRule(nodeVariable);

            // assert
            expect(context.report).to.not.have.been.called;
        });

        it('should report an error when console.get() is called incorrectly', function() {
            var nodeVariable = variableDeclarationRequireGetStub(invalidGetValue);

            // act
            variableDeclarationRule(nodeVariable);

            // assert
            expect(context.report).to.have.been.calledOnce;
        });

        // var console = require('/mod_bse_core/cartridge/scripts/monitoring/Console.ds');
        // var Logger = console.get('mailchimp.newsletter.addmember')
        it('should not report an error when console.get() is called correctly', function() {
            var nodeVariableGet = variableDeclarationGet(validGetValue, 'console');
            var nodeVariable = variableDeclarationStub('console');

            // act
            variableDeclarationRule(nodeVariable);
            variableDeclarationRule(nodeVariableGet);

            // assert
            expect(context.report).to.not.have.been.called;
        });

        it('should report an error when console.get() is called incorrectly', function() {
            var nodeVariableGet = variableDeclarationGet(invalidGetValue, 'console');
            var nodeVariable = variableDeclarationStub('console');

            // act
            variableDeclarationRule(nodeVariable);
            variableDeclarationRule(nodeVariableGet);

            // assert
            expect(context.report).to.have.been.calledOnce;
        });
    });
});
