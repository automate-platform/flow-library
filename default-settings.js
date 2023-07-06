var path = require('path');

var settings = {
    port: 8080,
    github: {
        clientId: "5cf8323b641b1fcbbaa2",
        secret: "b5eda517f321b1cacbd0fc37d412fe04228188ca",
        authCallback: "http://localhost:8080/login/callback",
        accessToken: "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"
    },
    gitlab  : {
        clientId: "f1498dfd80942c546df27fa9d79ce44d5068630d1c9cb3b6fb996877115e9ea2",
        secret: "2e94649cb2ef8f345feb0559d1e7b4f086e8812c0629842477419a5179bb63ba",
        authCallback: "http://localhost:8080/login/callback",
        accessToken: "glpat-34RksJugejJUiJPxyFGQ"
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
        collection: false,
        apps: true,
        footer:false
    },
    app: {
        zipUrl: 'Documents/marketApp/app/'
    }
};

module.exports = settings;
