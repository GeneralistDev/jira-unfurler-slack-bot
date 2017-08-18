'use strict';

const rp = require('request-promise');
const BbPromise = require('bluebird');
const env = require('../lib/kms-secret').env;
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();
const WebClient = require('@slack/client').WebClient;

module.exports.handler = function(event, context, callback) {
    console.log(event);

    let web = null;

    env.getEncryptedEnvVars(['JIRA_USERNAME', 'JIRA_PASSWORD'])
        .then((secrets) => {
            db.get({
                TableName: process.env.TOKENS_TABLE,
                Key: {
                    team_id: event.team_id,
                },
            }).promise()
            .then((record) => {
                web = new WebClient(record.Item.access_token);
                return;
            })
            .then(() => {
                return rp.get(`https://a-cloud-guru.atlassian.net/rest/api/2/project`, {
                    auth: {
                        user: secrets.JIRA_USERNAME,
                        pass: secrets.JIRA_PASSWORD,
                    },
                })
                .then((result) => {
                    const projects = JSON.parse(result);
                    return projects.reduce((accum, project) => {
                        accum.push(project.key);
                        return accum;
                    }, []);
                });
            })
            .then((projectKeys) => {
                console.log('projectKeys', projectKeys);
                let issues = projectKeys.reduce((accum, key) => {
                    let regex = new RegExp(`(${key}-[^\\s]+)`, 'gi');
                    let matches = event.event.text.match(regex);
                    if (matches) {
                        return accum.concat(matches);
                    }

                    return accum;
                }, []);

                console.log('issues', issues);

                return issues;
            })
            .then((issues) => {
                return BbPromise.map(issues, (issue) => {
                    return rp.get(`https://a-cloud-guru.atlassian.net/rest/api/2/issue/${issue}`, {
                        auth: {
                            user: secrets.JIRA_USERNAME,
                            pass: secrets.JIRA_PASSWORD,
                        },
                    })
                    .then((result) => {
                        const jiraResult = JSON.parse(result);
    
                        web.chat.postMessage(event.event.channel, null, {
                            "attachments": [
                                {
                                    "title": issue.toUpperCase(),
                                    "title_link": `https://a-cloud-guru.atlassian.net/browse/${issue}`,
                                    "text": `*Issue Summary:* ${jiraResult.fields.summary}`,
                                    "mrkdwn_in": [
                                        "text"
                                    ],
                                }
                            ]
                        }, (err, res) => {
                            if (err) {
                                console.log(err);
                            }
    
                            console.log(res);
                        });
                    });
                })
                .then(() => {
                    callback(null);
                });
            });
        })
        .catch((error) => {
            console.log(error);
            return callback(error);
        });
};