'use strict';

const rp = require('request-promise');
const env = require('../lib/kms-secret').env;
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();
const WebClient = require('@slack/client').WebClient;

module.exports.handler = function(event, context, callback) {
    console.log(event);
    if (event.event.text.includes('JIRA')) {
        env.getEncryptedEnvVar('SLACK_CLIENT_SECRET')
            .then((SLACK_CLIENT_SECRET) => {
                db.get({
                    TableName: process.env.TOKENS_TABLE,
                    Key: {
                        team_id: event.team_id,
                    },
                }).promise()
                .then((record) => {
                    console.log(record);
                    const web = new WebClient(record.Item.access_token);

                    web.chat.postMessage(event.event.channel, "Hi", (err, res) => {
                        if (err) {
                            console.log(err);
                            callback(err);
                        }

                        console.log(res);
                        callback(null, res);
                    });
                });
            })
            .catch((error) => {
                console.log(error);
                return callback(error);
            });
    } else {
        callback(null);
    }
};