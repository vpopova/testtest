module.exports = {
    meta: {
        docs: {
            description: 'prevent chai.assert',
            category: 'Custom errors',
            recommended: true
        },
        schema: []
    },
    create: function(context) {
        return {
            MemberExpression: function(node) {
                /*
                 * Example AST:
                     {
                        "type": "MemberExpression",
                        "start": 13,
                        "end": 35,
                        "object": {
                          "type": "CallExpression",
                          "start": 13,
                          "end": 28,
                          "callee": {
                            "type": "Identifier",
                            "start": 13,
                            "end": 20,
                            "name": "require"
                          },
                          "arguments": [
                            {
                              "type": "Literal",
                              "start": 21,
                              "end": 27,
                              "value": "chai",
                              "raw": "'chai'"
                            }
                          ]
                        },
                        "property": {
                          "type": "Identifier",
                          "start": 29,
                          "end": 35,
                          "name": "assert"
                        },
                        "computed": false
                      }
                  }
                 */

                // we're scanning a member expression, i.e. a.b
                // a: must match a CallExpression require('chai')
                // b: must match the assert property
                // let's start with the property since it's easier
                var property = node.property;
                var name = property ? property.name : '';
                if (name !== 'assert') {
                    return;
                }

                // we've established the right-side part of the MemberExpression is .assert
                // let's see about the left side part.
                // It must be a call expression.
                var object = node.object;
                var objectType = object ? object.type : '';
                if (objectType !== 'CallExpression') {
                    return;
                }

                // more specifically, a call to 'require' (we're trying to match require('chai'))
                var callee = object.callee;
                var calleeName = callee ? callee.name : '';
                if (calleeName !== 'require') {
                    return;
                }

                // now we have to validate the arguments to require(...?).assert
                var args = object.arguments;

                // exactly one argument?
                if (!args || args.length !== 1) {
                    return;
                }

                // is it there?
                var firstArgument = args[0];
                if (!firstArgument) {
                    return;
                }

                // is it a literal?
                if (firstArgument.type !== 'Literal') {
                    return;
                }

                // is it chai?
                if (firstArgument.value !== 'chai') {
                    return;
                }

                context.report({
                    node: node,
                    message: 'Use expect instead of assert'
                });
            }
        };
    }
};
