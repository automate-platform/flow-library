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
        clientId: "04d6bd2ffb844bbe61cd",
        secret: "2c69cd96280210bbaf0bbe47faad1d5a71ce6841",
        authCallback: "http://localhost:8080/login/callback",
        accessToken:"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"
    },
    mongo: {
        url: 'mongodb://103.154.100.21:27017/flows'
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
    server:{
        url: 'https://filepap.vtgo.vn'
    },
    template: {
        nodes: false,
        flows: false,
        collection: false,
        apps: true,
        footer: false
    },
    app: {
        zipUrl: 'Documents/marketApp/app/',
        server_url:'https://filepap.vtgo.vn'
    }
};

module.exports = settings;
