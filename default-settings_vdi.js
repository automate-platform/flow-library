var path = require('path');

var settings = {
    port: 8080,
    git:{
        gitlab: true,
        github: false,
        host: "pap-gitlab-test.fsft.com.vn",
        domain:"https://pap-gitlab-test.fsft.com.vn/",
        authorize_url:"oauth/authorize",
        token_url:"oauth/token",
        clientId: "93b71b6a40a6572ff9b378fbfedb0d1e8ee33d7f62660866bea7111a7e6115f4",
        secret: "23bd19c89097f47b347a71c54a8ddf10d2cfbcea31d50a49960e0610445785cb",
        authCallback: "https://pap-market-test.fsft.com.vn/login/callback",
        accessToken:""
    },
    mongo: {
        url: 'mongodb://root:mgt%40123@10.133.221.214:8033/flows?authMechanism=SCRAM-SHA-1&authSource=admin'
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
        footer:false
    },
    app: {
        zipUrl: '/flow-library/data',
        readme: '/flow-library/data/readme',
        server_url:'https://pap-app1-test.fsft.com.vn'

    }
};

module.exports = settings;
