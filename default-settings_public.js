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
        clientId: "dcc940d820163cb391c6",
        secret: "c73907138d1500b350c1f4770d4a1f0623dca38f",
        authCallback: "https://flows.vtgo.vn/login/callback",
        accessToken: "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"
    },
    mongo: {
        url: 'mongodb://user09:xkfxWZ2U@103.154.100.20/flows?authMechanism=SCRAM-SHA-1&authSource=admin'
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
        flows: false,
        collection: false,
        apps: true,
        extensions: true,
        footer:false
    },
    app: {
        zipUrl: '/flow-library/data',
        readme: '/flow-library/data/readme' ,
        server_url:'https://filepap.vtgo.vn'
    }
};

module.exports = settings;
