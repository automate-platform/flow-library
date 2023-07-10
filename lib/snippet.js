const settings = require("../config");
const gitlab = require("./gitlab");
const db = require("./db");
const users = require("./users");
const view = require("./view")
const https = require('https');

function getSnippet(id, projection) {
    return new Promise((resolve, reject) => {


        projection = projection || {};


        db.flows.findOne({ _id: id }, projection, function (err, data) {

            if (err || !data) {
                reject();
            } else {
                
                resolve(data);
            }
        });
    });
}


function createSnippet(accessToken, gist, tags) {
    return new Promise((resolve, reject) => {
        gitlab.createSnippet(gist, accessToken).then(function (data) {
            for (var i = 0; i < tags.length; i++) {
                db.tags.update({ _id: tags[i] }, { $inc: { count: 1 } }, { upsert: true });
            }
            data.added_at = Date.now();
            data.tags = tags;
            data.type = "flow";
            data.flow = gist.files.find(file => file.file_path === 'flow.json').content;
            resolve(addSnippet(data));
        }).catch(function (err) {
            console.log("ERROR", err);
            reject(err);
        });
    });

}

function generateSummary(desc) {
    var summary = (desc || "").split("\n")[0];
    var re = /\[(.*?)\]\(.*?\)/g;
    var m;
    while ((m = re.exec(summary)) !== null) {
        summary = summary.substring(0, m.index) + m[1] + summary.substring(m.index + m[0].length);
    }

    if (summary.length > 150) {
        summary = summary.substring(0, 150).split("\n")[0] + "...";
    }
    return summary;
}


async function addSnippet(data) {
    var originalFiles = data.files;
    
    if (!Array.isArray(originalFiles) || originalFiles.length === 0) {
        throw new Error("No files found in the snippet data");
    }

    var firstFile = originalFiles[1];
    if (!firstFile) {
        throw new Error("Missing file flow.json");
    }
    if (firstFile.truncated) {
        throw new Error("Flow file too big - flow library does not currently support truncated files from GitLab API");
    }
    data._id = '' + data.id;
    data.url = data.web_url;
    data.forks_url = null;
    data.commits_url = null;
    data.node_id = data.id;

    data.git_pull_url = data.http_url_to_repo;
    data.git_push_url = data.http_url_to_repo;

    data.html_url = data.web_url;
    data.public = false;

    data.comments = null;
    data.user = null;
    data.comments_url = 'https://gitlab.com/api/v4/snippets/' + data.id +'/discussions';

    data.author.login = data.author.username
    data.owner = data.author

    data.forks = null
    data.truncated = null

    data.readme = data.description;
    data.summary = generateSummary(data.readme);
    data.description = data.title
    data.icon_flow = null

    data.gitOwners = data.owner.username





    data.refreshed_at = Date.now();
 
    delete data.rateLimit;

    delete data.file_name
    db.flows.save(data, function (err, other) {
        if (err) {
            console.log(err, other);
            return;
        }
    });

    return users.ensureExists(data.owner.login).then(function () {
        view.resetTypeCountCache();
        return data.id;
    });
    
}


function getUser(id) {
    return new Promise((resolve, reject) => {
        db.users.findOne({ _id: id }, function (err, user) {
            if (user == null) {
                reject();
            } else {
                resolve(user);
            }
        });
    });
}




function updateTags(id, tags) {
    tags = tags || [];
    return new Promise((resolve, reject) => {
        getGist(id, { tags: 1, description: 1, 'files.README-md': 1, 'owner.login': 1 }).then(function (gist) {
            var oldTags = gist.tags;

            if (oldTags.length == tags.length) {
                var matches = true;
                for (var i = 0; i < oldTags.length; i++) {
                    if (tags.indexOf(oldTags[i]) == -1) {
                        matches = false;
                        break;
                    }
                }
                if (matches) {
                    resolve();
                    return;
                }
            }

            for (var i = 0; i < oldTags.length; i++) {
                if (tags.indexOf(oldTags[i]) == -1) {
                    db.tags.update({ _id: oldTags[i] }, { $inc: { count: -1 } });
                }
            }
            for (var i = 0; i < tags.length; i++) {
                if (oldTags.indexOf(tags[i]) == -1) {
                    db.tags.update({ _id: tags[i] }, { $inc: { count: 1 } }, { upsert: true });
                }
            }
            db.tags.remove({ count: { $lte: 0 } });

            db.flows.update({ _id: id }, { $set: { tags: tags } }, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });

        }).catch(function (err) {
            console.log(err);
            reject(err);
        });
    });
}


function getTags(query) {
    return new Promise((resolve, reject) => {
        db.tags.find({ $query: query, $orderby: { count: -1, _id: 1 } }, function (err, gists) {
            resolve(gists);
        });

    });
}
function getAllTags() {
    return getTags({});
}


function refreshSnippet(id) {
    return new Promise((resolve, reject) => {
        getGist(id, { etag: 1, tags: 1, added_at: 1 }).then(function (gist) {
            const etag = process.env.FORCE_UPDATE ? null : gist.etag;
            github.getGist(id, etag).then(function (data) {
                if (data == null) {
                    // no update needed
                    db.flows.update({ _id: id }, { $set: { refreshed_at: Date.now() } }, function (err) {
                        if (err) {
                            console.log(err);
                        }
                        reject(true);
                    });
                } else {
                    data.added_at = gist.added_at;
                    data.tags = gist.tags;
                    data.type = "flow";
                    resolve(addGist(data));
                }
            }).catch(function (err) {
                removeGist(id).then(function () {
                    reject(false);
                });
            });
        }).catch(function () {
            reject(false);
        });

    });
}


module.exports = {
    get: getSnippet,
    refresh: refreshSnippet,
    updateTags: updateTags,  
    getUser: getUser,
    create: createSnippet,
    getAllTags: getAllTags,
}