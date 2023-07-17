var path = require('path');

var settings = {
    port: 8080,
   
    git:{
        host: "pap-gitlab-test.fsoft.com.vn",
        domain:"https://pap-gitlab-test.fsoft.com.vn/",
        clientId: "680d6974c7ad54b3f53071ef6d737edc59ff83969227c99ea39e3605807fa149",
        secret: "bbce0b269067c48445e2de4ed0999976572878ba250d28d743d99ed74ee5e23a",
        authCallback: "http://localhost:8080/login/callback",
        accessToken:""
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
    template: {
        nodes: false,
        flows: true,
        collection: false,
        apps: true,
        footer: false
    },
    app: {
        zipUrl: 'C:/Users/HP/Documents/marketApp/app/'
    }
};

module.exports = settings;
