var path = require('path');

var settings = {
    port: 8080,
   
    git:{
        host: "pap-gitlab-test.pap.com.vn",
        domain:"https://pap-gitlab-test.pap.com.vn/",
        clientId: "680d6974c7ad54b3f53071ef6d737edc59ff83969227c99ea39e3605807fa149",
        secret: "bbce0b269067c48445e2de4ed0999976572878ba250d28d743d99ed74ee5e23a",
        authCallback: "http://localhost:8080/login/callback",
        accessToken:""
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
        zipUrl: 'Documents/marketApp/app/'
    }
};

module.exports = settings;
