'use strict';

const invokeLambda = require('./lib/invokeLambda');
const eventLambdaMapping = require('./events/eventLambdaMapping');

module.exports.handler = function(event, context, callback) {
    if (event.queryStringParameters.code) {
        invokeLambda(eventLambdaMapping.register, event.queryStringParameters)
            .then(() => {
                return callback(null, {
                    statusCode: 200,
                    body: "App installed, thanks",
                });
            }); 
    } else {
        callback(null, {
            statusCode: 400,
            body: "Code was missing",
        });
    }
}