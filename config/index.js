try {
    module.exports = require("../settings.js");
} catch(err) {
    module.exports = require("../default-settings.js");
    if (process.env.NR_MAINTENANCE !== undefined) {
        module.exports.maintenance = (process.env.NR_MAINTENANCE === 'true')
    }
    module.exports.port = process.env.PORT || module.exports.port;
 
    module.exports.mongo.url = process.env.NR_MONGO_URL || module.exports.mongo.url;
    module.exports.session.key = process.env.NR_SESSION_KEY || module.exports.session.key;
    module.exports.session.secret = process.env.NR_SESSION_SECRET || module.exports.session.secret;
    if (process.env.NR_ADMINS) {
        module.exports.admins = process.env.NR_ADMINS.split(",").map(t =>t.trim())
    }
    module.exports.twitter.consumer_key = process.env.NR_TWITTER_CONSUMER_KEY || module.exports.twitter.consumer_key;
    module.exports.twitter.consumer_secret = process.env.NR_TWITTER_CONSUMER_SECRET || module.exports.twitter.consumer_secret;
    module.exports.twitter.access_token_key = process.env.NR_TWITTER_ACCESS_TOKEN_KEY || module.exports.twitter.access_token_key;
    module.exports.twitter.access_token_secret = process.env.NR_TWITTER_ACCESS_TOKEN_SECRET || module.exports.twitter.access_token_secret;

    module.exports.mastodon.url = process.env.NR_MASTODON_URL || module.exports.mastodon.url
    module.exports.mastodon.token = process.env.NR_MASTODON_TOKEN || module.exports.mastodon.token

    module.exports.slack.webhook = process.env.NR_SLACK_WEBHOOK || module.exports.slack.webhook;

    if (process.env.NR_MODULE_BLOCKLIST) {
        module.exports.modules.block = process.env.NR_MODULE_BLOCKLIST.split(",").map(t =>t.trim())
    }
    module.exports.aws.iconBucket = process.env.NR_AWS_BUCKET || module.exports.aws.iconBucket
    module.exports.aws.accessKeyId = process.env.NR_AWS_ACCESS_KEY_ID || module.exports.aws.accessKeyId
    module.exports.aws.secretAccessKey = process.env.NR_AWS_SECRET_ACCESS_KEY || module.exports.aws.secretAccessKey
    module.exports.aws.region = process.env.NR_AWS_REGION || module.exports.aws.region

    module.exports.app.zipUrl = process.env.APP_FLOW_URL ||  module.exports.app.zipUrl

    
    module.exports.git.domain = process.env.NR_GIT_DOMAIN || module.exports.git.domain;
    module.exports.git.clientId = process.env.NR_GIT_CLIENTID || module.exports.git.clientId;
    module.exports.git.secret = process.env.NR_GIT_SECRET || module.exports.git.secret;
    module.exports.git.domain = process.env.NR_GIT_DOMAIN || module.exports.git.domain;
    module.exports.git.host = process.env.NR_GIT_HOST || module.exports.git.host;
    module.exports.git.accessToken = process.env.NR_GIT_ACCESSTOKEN || module.exports.git.accessToken;
}
