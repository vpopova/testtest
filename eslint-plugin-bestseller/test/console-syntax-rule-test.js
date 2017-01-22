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
    var validGetValue = 'marketingcloud.minicart.rendering';
    var allowedGetNamespaces = ['account', 'pdp', 'plp', 'content',
        'checkout', 'jobs', 'adyen', 'globalcollect',
        'klarna', 'sds', 'mailchimp', 'marked',
        'marketingcloud', 'paris', 'zendesk', 'multipage'];

    beforeEach(function() {
        context = {
            report: sinon.spy()
        };

        consoleSyntaxRule = require('../rules/console-syntax-rule');
        consoleSyntaxRuleCreate = consoleSyntaxRule.create;
        rule = consoleSyntaxRuleCreate(context);
        expressionStatementRule = rule.ExpressionStatement;
        variableDeclarationRule = rule.VariableDeclaration;
    });

    /**
     * Example:
     * var Console = require('../monitoring/Console.ds').get('TESTESTESTcheckout.minicart.rendering', true).error('Error when rendering the minicart. Exception message: ' + ex.message);
     */
    var expressionStatementStub = function(value) {
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
                                name: 'test',
                            },
                            property: {
                                type: 'Identifier',
                                name: 'get',
                            },
                        },
                        arguments: [{
                            type: 'Literal',
                            value: value
                        }, {
                            type: 'Literal',
                            value: true
                        }],
                    },
                    property: {
                        type: 'Identifier',
                        name: 'error',
                    },
                },
                arguments: [{
                    type: 'BinaryExpression',
                    operator: '+',
                    left: {
                        type: 'Literal',
                        value: 'Error when rendering the minicart. Exception message: '
                    },
                    right: {
                        type: 'MemberExpression',
                        computed: false,
                        object: {
                            type: 'Identifier',
                            name: 'ex',
                        },
                        property: {
                            type: 'Identifier',
                            name: 'message',
                        },
                    },
                }],
            }
        };
    };

    /**
     * Example:
     * var Console = require('../monitoring/Console.ds').get('marketing.minicart.rendering', true);
     */
    var variableDeclarationStub = function(value) {
        return {
            type: 'VariableDeclaration',
            declarations: [{
                type: 'VariableDeclarator',
                id: {
                    type: 'Identifier',
                    name: 'Console',
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
                                name: 'require',
                            },
                            arguments: [{
                                type: 'Literal',
                                value: '../monitoring/Console.ds'
                            }],
                        },
                        property: {
                            type: 'Identifier',
                            name: 'get',
                        },
                    },
                    arguments: [{
                        type: 'Literal',
                        value: value
                    }, {
                        type: 'Literal',
                        value: true,
                        raw: 'true',
                    }],
                },
            }],
            kind: 'var',
        };
    };

    describe('when defined as an expression statement', function() {
        it('should report an error when console.get() is called in a incorrectly', function() {
            // arrange
            var node = expressionStatementStub(invalidGetValue);
            console.log(node.expression.callee.object)

            // act
            expressionStatementRule(node);

            // assert
            expect(context.report).to.have.been.calledOnce;
        });

        it('should not report an error when console.get() is called correctly', function() {
            // arrange
            var node = expressionStatementStub(validGetValue);

            // act
            expressionStatementRule(node);

            // assert
            expect(context.report).to.not.have.been.called;
        });
    });

    describe('when console is a variable', function() {
        it('should report an error when console.get() is called incorrectly', function() {
            // arrange
            var node = variableDeclarationStub(invalidGetValue);

            // act
            variableDeclarationRule(node);

            // assert
            expect(context.report).to.have.been.calledOnce;
        });

        it('should not report an error when console.get() is called correctly', function() {
            // arrange
            var node = variableDeclarationStub(validGetValue);

            // act
            variableDeclarationRule(node);

            // assert
            expect(context.report).to.not.have.been.called;
        });
    });
});
