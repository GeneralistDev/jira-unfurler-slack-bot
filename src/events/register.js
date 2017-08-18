'use strict';

const rp = require('request-promise');
const env = require('../lib/kms-secret').env;
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();

module.exports.handler = function(event, context, callback) {
    console.log('Received event', event);
    const parameters = event;

    env.getEncryptedEnvVar('SLACK_CLIENT_SECRET')
        .then((SLACK_CLIENT_SECRET) => {
            return rp({
                uri: `${process.env.SLACK_API_BASE}/oauth.access`,
                formData: {
                    client_id: process.env.SLACK_CLIENT_ID,
                    client_secret: SLACK_CLIENT_SECRET,
                    code: parameters.code,
                },
                method: 'POST',
            })
            .then((result) => {
                return JSON.parse(result);
            });
        })
        .then((result) => {
            if (result.ok === false) {
                console.log('error fetching access token: ', result.error);
                return callback(result.error);
            }

            const params = {
                TableName: process.env.TOKENS_TABLE,
                Item: {
                    team_id: result.team_id,
                    team_name: result.team_name,
                    access_token: result.access_token,
                },
            };

            if (result.bot) {
                params.Item.bot = result.bot;
            }
        
            console.log('params:', params);

            return db.put(params).promise();
        })
        .then((result) => {
            console.log('success:', result);
            return callback(null);
        })
        .catch((error) => {
            console.log('error:', error);
            callback(error);
        });
};