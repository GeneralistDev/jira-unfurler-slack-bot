'use strict';

const env = require('./lib/kms-secret').env;
const eventLambdaMapping = require('./events/eventLambdaMapping');
const invokeLambda = require('./lib/invokeLambda');

module.exports.handler = (event, context, callback) => {
  const body = JSON.parse(event.body);

  env.getEncryptedEnvVar('SLACK_BOT_TOKEN')
    .then((SLACK_BOT_TOKEN) => {
      // Validate token
      if (!SLACK_BOT_TOKEN === body.token) {
        return {
          statusCode: 401,
          body: "Unauthorised"
        };
      }

      // If challenge is present; validate token and return challenge
      if (body.challenge) {
          return {
            statusCode: 200,
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              "challenge": body.challenge,
            }),
          };
      }

      // Handle the callback events
      if (body.type === "event_callback") {
        if (body.event.type) {
          const lambdaArn = eventLambdaMapping[body.event.type];

          return invokeLambda(lambdaArn, body)
            .then((result) => {
              if (result.StatusCode === 202) {
                return {
                  statusCode: 200,
                  body: "OK"
                };
              } else {
                return {
                  statusCode: 500,
                  body: "Something went wrong",
                };
              }
            });
        }
      }
    })
    .then((response) => {
      return callback(null, response);
    })
    .catch((error) => {
      const response = {
        statusCode: 500,
        body: JSON.stringify(error),
      };

      callback(null, response);
    });
};
