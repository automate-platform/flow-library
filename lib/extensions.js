const settings = require("../config");
const github = require("./github");
const db = require("./db");
const users = require("./users");
const view = require("./view")
const multer = require('multer');
const fs = require('fs')
const path = require('path');

function getExtention(id, projection) {
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


async function putExtention(id, data) {
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

function refreshExtention(id) {
    return new Promise((resolve, reject) => {
        getExtention(id, { etag: 1, tags: 1, added_at: 1 }).then(function (app) {
            const etag = process.env.FORCE_UPDATE ? null : app.etag;
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
                    data.added_at = app.added_at;
                    data.tags = app.tags;
                    data.type = "extension";
                    resolve(addExtension(data));
                }
            }).catch(function (err) {
                removeExtension(id).then(function () {
                    reject(false);
                });
            });
        }).catch(function () {
            reject(false);
        });

    });
}

function createExtention(accessToken, extension, tags) {
    return new Promise((resolve, reject) => {
        github.createGist(extension, accessToken).then(function (data) {
            for (var i = 0; i < tags.length; i++) {
                db.tags.update({ _id: tags[i] }, { $inc: { count: 1 } }, { upsert: true });
            }
            data.added_at = Date.now();
            data.tags = tags;
            data.type = "extension";

            resolve(addExtension(data));
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

async function addExtension(data) {
    var originalFiles = data.files;
    if (!originalFiles['README.md']) {
        throw new Error("Missing file README.md");
    }
    if (originalFiles['README.md'].truncated) {
        throw new Error("README file too big - app library does not currently support truncated files from github api");
    }
    data.readme = originalFiles['README.md'].content;
    data.summary = generateSummary(data.readme);
    data.icon_flow = originalFiles['icon.ico'].content;
    delete data.files;
    delete data.history;
    data.gitOwners = [
        data.owner.login
    ]

    delete data.rateLimit;

    data.refreshed_at = Date.now();
    data._id = data.id;

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

async function updateExtension(id, data, tags) {
    for (var i = 0; i < tags.length; i++) {
        db.tags.update({ _id: tags[i] }, { $inc: { count: 1 } }, { upsert: true });
    }
    var originalFiles = data.files;
    if (!originalFiles['README.md']) {
        throw new Error("Missing file README.md");
    }
    if (originalFiles['README.md'].truncated) {
        throw new Error("README file too big - app library does not currently support truncated files from github api");
    }

    var newValues = {
        description: data.description,
        readme: originalFiles['README.md'].content,
        summary: generateSummary(originalFiles['README.md'].content),
        updated_at: (new Date).toISOString(),
        tags: tags
    };
    if (originalFiles['icon.ico'].content) newValues.icon_flow = originalFiles['icon.ico'].content

    db.flows.update({ _id: id }, { $set: newValues }, function (err, other) {
        if (err) {
            console.log(err, other);
            return;
        }
    })
}

async function updateExtensionSource(id, data) {
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


async function addExtensionById(id) {
    console.log("Add app [", id, "]");
    return github.getGist(id).then(function (data) {
        data.added_at = Date.now();
        data.tags = [];
        view.resetTypeCountCache();
        return addExtension(data);
    });
}

function removeExtension(id) {
    return new Promise((resolve, reject) => {
        getExtention(id).then(function (app) {
            for (var i = 0; i < app.tags.length; i++) {
                db.tags.update({ _id: app.tags[i] }, { $inc: { count: -1 } });
            }
            db.tags.remove({ count: { $lte: 0 } });
            db.flows.remove({ id: id }, function (err) {
                view.resetTypeCountCache();
                resolve();
            });
        });
    });
}

function getExtentions(query) {
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

function getExtentionsForUser(userId) {
    return getExtentions({ 'owner.login': userId });
}
function getExtentionsForTag(tag) {
    return getExtentions({ tags: tag });
}
function getAllExtension() {
    return getExtentions({});
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
        getExtention(id, { tags: 1, description: 1, 'files.README-md': 1, 'owner.login': 1 }).then(function (app) {
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
    add: addExtensionById,
    refresh: refreshExtention,
    remove: removeExtension,
    updateTags: updateTags,
    get: getExtention,
    getAll: getAllExtension,
    getExtentions: getExtentions,
    getForUser: getExtentionsForUser,
    getUser: getUser,
    create: createExtention,
    getAllTags: getAllTags,
    getForTag: getExtentionsForTag,
    storage, multi_upload,
    putSource: putExtention,
    update: updateExtension,
    updateSource: updateExtensionSource
};

