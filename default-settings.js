var path = require('path');

var settings = {
    port: 8080,
    github: {
        clientId: "5cf8323b641b1fcbbaa2",
        secret: "b5eda517f321b1cacbd0fc37d412fe04228188ca",
        authCallback: "http://localhost:8080/login/callback",
        accessToken: "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"
    },
    mongo: {
        url: 'mongodb://103.154.100.21:27017/flows'
    },
    session: {
        key: 'nr.sid',
        secret: 'giraffe'
    },
    admins: ["knolleary","dceejay"],
    twitter: {
        consumer_key: '',
        consumer_secret: '',
        access_token_key: '',
        access_token_secret: ''
    },
    mastodon: {
        url: '',
        token: ''
    },
    slack: {
        webhook: ''
    },
    modules: {
        block: []
    },
    aws: {
        iconBucket: "",
        accessKeyId: "",
        secretAccessKey: "",
        region: ""
    },
    template: {
        nodes: false,
        flows: true,
        collection: false
    },
    app: {
        zipUrl: 'Documents/marketApp/app/'
    }
};

module.exports = settings;
