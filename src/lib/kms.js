'use strict';

const AWS = require('aws-sdk');
const BbPromise = require('bluebird');

const kms = new AWS.KMS();

const decrypt = (value) => {
    const params = {
        // eslint-disable-next-line node/no-deprecated-api
        CiphertextBlob: new Buffer(value, 'base64'),
    };

    return new BbPromise((resolve, reject) => {
        kms.decrypt(params, (err, result) => {
            if (err) reject(err);
            else resolve(result.Plaintext.toString('utf-8'));
        });
    });
};

module.exports = {
    decrypt,
};