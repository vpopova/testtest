var chai = require('chai');
var sinon = require('sinon');
var expect = chai.expect;

chai.use(require('sinon-chai'));

describe('no-chai-assert', function() {
    var noChaiAssert;
    var noChaiAssertCreate;
    var context;
    var rule;
    var memberExpressionRule;

    beforeEach(function() {
        context = {
            report: sinon.spy()
        };

        noChaiAssert = require('../rules/no-chai-assert');
        noChaiAssertCreate = noChaiAssert.create;
        rule = noChaiAssertCreate(context);
        memberExpressionRule = rule.MemberExpression;
    });

    it('should report an error for require(chai).assert', function() {
        // arrange
        var node = {
            property: {
                name: 'assert'
            },

            object: {
                type: 'CallExpression',
                callee: {
                    name: 'require'
                },
                arguments: [{
                    type: 'Literal',
                    value: 'chai'
                }]
            }
        };

        // act
        memberExpressionRule(node);

        // assert
        expect(context.report).to.have.been.calledWith({
            node: node,
            message: 'Use expect instead of assert'
        });
    });

    it('should not report an error for require(chai).expect', function() {
        // arrange
        var node = {
            property: {
                name: 'expect'
            },

            object: {
                type: 'CallExpression',
                callee: {
                    name: 'require'
                },
                arguments: [{
                    type: 'Literal',
                    value: 'chai'
                }]
            }
        };

        // act
        memberExpressionRule(node);

        // assert
        expect(context.report).to.not.have.been.called;
    });

    it('should not report an error for require(something).assert', function() {
        // arrange
        var node = {
            property: {
                name: 'assert'
            },

            object: {
                type: 'CallExpression',
                callee: {
                    name: 'require'
                },
                arguments: [{
                    type: 'Literal',
                    value: 'something'
                }]
            }
        };

        // act
        memberExpressionRule(node);

        // assert
        expect(context.report).to.not.have.been.called;
    });

    it('should not report an error for hello(chai).assert', function() {
        // arrange
        var node = {
            property: {
                name: 'assert'
            },

            object: {
                type: 'CallExpression',
                callee: {
                    name: 'hello'
                },
                arguments: [{
                    type: 'Literal',
                    value: 'chai'
                }]
            }
        };

        // act
        memberExpressionRule(node);

        // assert
        expect(context.report).to.not.have.been.called;
    });
});
