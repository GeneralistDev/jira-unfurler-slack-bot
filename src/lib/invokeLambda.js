'use strict';

const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();

function invokeLambda(arn, event) {
    const params = {
        FunctionName: arn,
        InvocationType: "Event",
        Payload: JSON.stringify(event),
    };

    return lambda.invoke(params).promise();
}

module.exports = invokeLambda;