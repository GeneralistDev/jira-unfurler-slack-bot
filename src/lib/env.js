'use strict';

const BbPromise = require('bluebird');
const kms = require('./kms');

let decryptedVars = {};

const clear = () => {
    decryptedVars = {};
};

const getEncryptedEnvVar = (key) => {
    if (decryptedVars[key]) {
        return BbPromise.resolve(decryptedVars[key]);
    }

    const enctypedVar = process.env[key];

    if (!enctypedVar) {
        return BbPromise.reject(new Error(`Cannot find env var ${key}`));
    }

    console.log(`Found encrypted value for ${key}: ${enctypedVar.substring(enctypedVar.length-11, enctypedVar.length-1)}`)

    return kms.decrypt(enctypedVar).then(decrypted => {
        decryptedVars[key] = decrypted;
        return decrypted;
    });
};

const getEncryptedEnvVars = (keys) => BbPromise.reduce(keys, (accum, key) =>
    getEncryptedEnvVar(key).then((decrypted) => {
        accum[key] = decrypted;
        return accum;
    })
, {});

module.exports = {
    clear,
    getEncryptedEnvVar,
    getEncryptedEnvVars,
};