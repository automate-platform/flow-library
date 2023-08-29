var path = require('path');

var settings = {
    port: 8080,
    git:{
        gitlab: false,
        github: true,
        host: "api.github.com",
        domain:"https://github.com/",
        authorize_url:"login/oauth/authorize",
        token_url:"login/oauth/access_token",
        clientId: "5cf8323b641b1fcbbaa2",
        secret: "b5eda517f321b1cacbd0fc37d412fe04228188ca",
        authCallback: "http://localhost:8080/login/callback",
        accessToken: "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"
    },
    mongo: {
        url: 'mongodb://user09:xkfxWZ2U@103.154.100.20/flows?authMechanism=SCRAM-SHA-1&authSource=admin'
    },
    session: {
        key: 'nr.sid',
        secret: 'giraffe'
    },
    admins: ["knolleary", "dceejay"],
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
        flows: false,
        collection: false,
        apps: true,
        extensions: true,
        footer: false
    },
    app: {
        zipUrl: 'C:/Users/haiqd/Test_Market/app',
        readme: 'C:/Users/haiqd/Test_Market/output',
        server_url: 'C:/Users/haiqd/Test_Market/output'
    }
};

module.exports = settings;
