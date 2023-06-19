const settings = require("../config");
const github = require("./github");
const db = require("./db");
const users = require("./users");
const view = require("./view")
const multer = require('multer');
const mongojs = require('mongojs');

function getApp(id,projection) {
    return new Promise((resolve,reject) => {
        projection = projection || {};
        db.flows.findOne({_id:id},projection,function(err,data) {
            if (err||!data) {
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
            { $set: { icon_flow: data.icon_flow,
                     zip_url: data.zip_url 
                    } },
            { returnOriginal: false }
        );
        return result;
    } catch (error) {
        console.log(error);
        return null;
    }

}

function refreshApp(id) {
    return new Promise((resolve,reject) => {
        getApp(id,{etag:1,tags:1,added_at:1}).then(function(app) {
            const etag = process.env.FORCE_UPDATE? null:app.etag;
            github.getGist(id,etag).then(function(data) {
                if (data == null) {
                    // no update needed
                    db.flows.update({_id:id},{$set: {refreshed_at:Date.now()}},function(err) {
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
            }).catch(function(err) {
                removeApp(id).then(function() {
                    reject(false);
                });
            });
        }).catch(function() {
            reject(false);
        });

    });
}

function createApp(accessToken,app,tags) {
    return new Promise((resolve,reject) => {
        github.createGist(app,accessToken).then(function(data) {
            for (var i=0;i<tags.length;i++) {
                db.tags.update({_id:tags[i]},{$inc:{count:1}},{upsert:true});
            }
            data.added_at = Date.now();
            data.tags = tags;
            data.type = "app";
            // data.files = app.files;

            resolve(addApp(data));
        }).catch(function(err) {
            console.log("ERROR",err);
            reject(err);
        });
    });
}

function generateSummary(desc) {
    var summary = (desc||"").split("\n")[0];
    var re = /\[(.*?)\]\(.*?\)/g;
    var m;
    while((m=re.exec(summary)) !== null) {
        summary = summary.substring(0,m.index)+m[1]+summary.substring(m.index+m[0].length);
    }

    if (summary.length > 150) {
        summary = summary.substring(0,150).split("\n")[0]+"...";
    }
    return summary;
}

async function addApp(data) {
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
    data.flow = originalFiles['app.json'].content;
    data.readme = originalFiles['README.md'].content;
    data.summary = generateSummary(data.readme);
    delete data.files;
    delete data.history;
    data.gitOwners = [
        data.owner.login
    ]

    delete data.rateLimit;

    data.refreshed_at = Date.now();
    data._id = data.id;

    db.flows.save(data,function(err,other) {
        if (err) {
            console.log(err,other);
            return;
        }
    });

    return users.ensureExists(data.owner.login).then(function() {
        view.resetTypeCountCache();
        return data.id;
    });
}

async function addAppById(id) {
    console.log("Add app [",id,"]");
    return github.getGist(id).then(function(data) {
        data.added_at = Date.now();
        data.tags = [];
        view.resetTypeCountCache();
        return addApp(data);
    });
}

function removeApp(id) {
    return new Promise((resolve,reject) => {
        getApp(id).then(function(app) {
            for (var i=0;i<app.tags.length;i++) {
                db.tags.update({_id:app.tags[i]},{$inc:{count:-1}});
            }
            db.tags.remove({count:{$lte:0}});
            db.flows.remove({id:id}, function(err) {
                view.resetTypeCountCache();
                resolve();
            });
        });
    });
}

function getApps(query) {
    return new Promise((resolve,reject) => {
        query.type = "app";
        db.flows.find({$query:query,$orderby:{refreshed_at:-1}},{id:1,description:1,tags:1,refreshed_at:1,'owner.login':true},function(err,gists) {
            if (err) {
                return reject(err);
            }
            resolve(gists);
        });
    });
}

function getAppsForUser(userId) {
    return getApps({'owner.login':userId});
}
function getAppsForTag(tag) {
    return getApps({tags:tag});
}
function getAllApps() {
    return getApps({});
}

function getUser(id) {
    return new Promise((resolve,reject) => {
        db.users.findOne({_id:id}, function(err,user) {
            if (user == null) {
                reject();
            } else {
                resolve(user);
            }
        });
    });
}


function updateTags(id,tags) {
    tags = tags||[];
    return new Promise((resolve,reject) => {
        getApp(id,{tags:1,description:1,'files.README-md':1,'owner.login':1}).then(function(app) {
            var oldTags = app.tags;

            if (oldTags.length == tags.length) {
                var matches = true;
                for (var i=0;i<oldTags.length;i++) {
                    if (tags.indexOf(oldTags[i]) == -1) {
                        matches= false;
                        break;
                    }
                }
                if (matches) {
                    resolve();
                    return;
                }
            }

            for (var i=0;i<oldTags.length;i++) {
                if (tags.indexOf(oldTags[i]) == -1) {
                    db.tags.update({_id:oldTags[i]},{$inc:{count:-1}});
                }
            }
            for (var i=0;i<tags.length;i++) {
                if (oldTags.indexOf(tags[i]) == -1) {
                    db.tags.update({_id:tags[i]},{$inc:{count:1}},{upsert:true});
                }
            }
            db.tags.remove({count:{$lte:0}});

            db.flows.update({_id:id},{$set: {tags:tags}},function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });

        }).catch(function(err) {
            console.log(err);
            reject(err);
        });
    });
}


function getTags(query) {
    return new Promise((resolve,reject) => {
    db.tags.find({$query:query,$orderby:{count:-1,_id:1}},function(err,gists) {
        resolve(gists);
    });

    });
}
function getAllTags() {
    return getTags({});
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'app/');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage });

module.exports = {
    add: addAppById,
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
    storage, upload,
    update: putApp
}

//var repo = "https://app.github.com/6c3b201624588e243f82.git";
//var sys = require('sys');
//var exec = require('child_process').exec;
//function puts(error, stdout, stderr) { sys.puts(stdout); sys.puts(stderr);  }
//exec("git clone "+repo, puts);
//
