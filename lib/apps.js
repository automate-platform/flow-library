const settings = require("../config");
const github = require("./github");
const gitlab = require("./gitlab");
const db = require("./db");
const users = require("./users");
const view = require("./view")
const multer = require('multer');
const fs = require('fs')
const path = require('path');

function getApp(id, projection) {
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


async function putApp(id, data) {
    try {
        const result = await db.flows.update(
            { _id: id },
            {
                $set: {
                    guideline_img: data.guideline_img,
                    zip_url: data.zip_url
                }
            },
            { returnOriginal: false }
        );
        return result;
    } catch (error) {
        console.log(error);
        return null;
    }
}

function refreshApp(id) {
    return new Promise((resolve, reject) => {
        getApp(id, { etag: 1, tags: 1, added_at: 1 }).then(function (app) {
            const etag = process.env.FORCE_UPDATE ? null : app.etag;
            gitlab.getSnippet(id, etag).then(function (data) {
                if (data == null) {
                    // no update needed
                    db.flows.update({ _id: id }, { $set: { refreshed_at: Date.now() } }, function (err) {
                        if (err) {
                            console.log(err);
                        }
                        reject(true);
                    });
                } else {
                    data.added_at = app.added_at;
                    data.tags = app.tags;
                    data.type = "app";
                    resolve(addApp(data));
                }
            }).catch(function (err) {
                removeApp(id).then(function () {
                    reject(false);
                });
            });
        }).catch(function () {
            reject(false);
        });

    });
}

function createApp(accessToken, app, tags) {
    return new Promise((resolve, reject) => {
        gitlab.createSnippet(app, accessToken).then(function (data) {
            for (var i = 0; i < tags.length; i++) {
                db.tags.update({ _id: tags[i] }, { $inc: { count: 1 } }, { upsert: true });
            }
            data.added_at = Date.now();
            data.tags = tags;
            data.type = "app";
            data.visibility ="Private";
            // data.files = app.files;
            data.flow = app.files.find(file => file.file_path === 'app.json').content;
            data.icon_flow =app.files.find(file => file.file_path === 'icon.ico').content;
            resolve(addApp(data));
        }).catch(function (err) {
            console.log("ERROR", err);
            reject(err);
        });

        // github.createGist(app, accessToken).then(function (data) {
        //     for (var i = 0; i < tags.length; i++) {
        //         db.tags.update({ _id: tags[i] }, { $inc: { count: 1 } }, { upsert: true });
        //     }
        //     data.added_at = Date.now();
        //     data.tags = tags;
        //     data.type = "app";
        //     // data.files = app.files;

        //     resolve(addApp(data));

        // }).catch(function (err) {
        //     console.log("ERROR", err);
        //     reject(err);
        // });

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

async function addApp(data) {
    var originalFiles = data.files;

    if (!Array.isArray(originalFiles) || originalFiles.length === 0) {
        throw new Error("No files found in the snippet data");
    }
    console.log(originalFiles)
    var appFile = originalFiles[1];
    if (!appFile) {
        throw new Error("Missing file app.json");
    }
    if (appFile.truncated) {
        throw new Error("App file too big - flow library does not currently support truncated files from GitLab API");
    }
    var readme = originalFiles[0];
    if (!readme) {
        throw new Error("Missing file Readme.md");
    }
    if (readme.truncated) {
        throw new Error("Readme file too big - flow library does not currently support truncated files from GitLab API");
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
    data.comments_url = 'https://gitlab.com/api/v4/snippets/' + data.id + '/discussions';


    data.author.login = data.author.username
    data.owner = data.author

    data.forks = null
    data.truncated = null

    data.readme = data.description;
    data.summary = generateSummary(data.readme);
    data.description = data.title

    data.gitOwners =[data.owner.username]

    
    delete data.files;
    delete data.history;


    delete data.rateLimit;

    data.refreshed_at = Date.now();


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

async function updateApp(id, data, tags) {
    for (var i = 0; i < tags.length; i++) {
        db.tags.update({ _id: tags[i] }, { $inc: { count: 1 } }, { upsert: true });
    }
    var originalFiles = data.files;
    if (!originalFiles['app.json']) {
        throw new Error("Missing file app.json");
    }
    if (originalFiles['app.json'].truncated) {
        throw new Error("App file too big - app library does not currently support truncated files from github api");
    }
    if (!originalFiles['README.md']) {
        throw new Error("Missing file README.md");
    }
    if (originalFiles['README.md'].truncated) {
        throw new Error("README file too big - app library does not currently support truncated files from github api");
    }

    var newValues = {
        description: data.description,
        flow: originalFiles['app.json'].content,
        readme: originalFiles['README.md'].content,
        summary: generateSummary(originalFiles['README.md'].content),
        icon_flow: originalFiles['icon.ico'].content,
        updated_at: (new Date).toISOString(),
        tags: tags
    };

    db.flows.update({ _id: id }, { $set: newValues }, function (err, other) {
        if (err) {
            console.log(err, other);
            return;
        }
    })
}

async function updateAppSource(id, data) {
    var newValues = {}
    if (data.guideline_img.length) newValues.guideline_img = data.guideline_img;
    if (data.zip_url) newValues.zip_url = data.zip_url;
    try {
        const result = await db.flows.update(
            { _id: id },
            {
                $set: newValues
            },
            { returnOriginal: false }
        );
        return result;
    } catch (error) {
        console.log(error);
        return null;
    }
}


function removeApp(id) {
    return new Promise((resolve, reject) => {
        getApp(id).then(function (app) {
            for (var i = 0; i < app.tags.length; i++) {
                db.tags.update({ _id: app.tags[i] }, { $inc: { count: -1 } });
            }
            db.tags.remove({ count: { $lte: 0 } });
            db.flows.remove({ _id: id }, function (err) {
                view.resetTypeCountCache();
                resolve();
            });
        });
    });
}

function getApps(query) {
    return new Promise((resolve, reject) => {
        query.type = "app";
        db.flows.find({ $query: query, $orderby: { refreshed_at: -1 } }, { id: 1, description: 1, tags: 1, refreshed_at: 1, 'owner.login': true }, function (err, gists) {
            if (err) {
                return reject(err);
            }
            resolve(gists);
        });
    });
}

function getAppsForUser(userId) {
    return getApps({ 'owner.login': userId });
}
function getAppsForTag(tag) {
    return getApps({ tags: tag });
}
function getAllApps() {
    return getApps({});
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
        getApp(id, { tags: 1, description: 1, 'files.README-md': 1, 'owner.login': 1 }).then(function (app) {
            var oldTags = app.tags;

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

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const url_zip = path.join(settings.app.zipUrl, req.body.id + '');
        if (!fs.existsSync(url_zip)) {
            fs.mkdirSync(url_zip);
        }
        cb(null, url_zip);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const multi_upload = multer({ storage });

module.exports = {
    refresh: refreshApp,
    remove: removeApp,
    updateTags: updateTags,
    get: getApp,
    getAll: getAllApps,
    getApps: getApps,
    getForUser: getAppsForUser,
    getUser: getUser,
    create: createApp,
    getAllTags: getAllTags,
    getForTag: getAppsForTag,
    storage, multi_upload,
    putSource: putApp,
    update: updateApp,
    updateSource: updateAppSource
};

