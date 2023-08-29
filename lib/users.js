const github = require("./github");
const gitlab = require("./gitlab");
const db = require("./db");

function extractGitInfo(data) {
    return {
        _id: data.login,
        login: data.login,
        avatar_url: data.avatar_url,
        name: data.name,
        bio: data.bio,
        html_url: data.html_url,
        etag: null
    }
}

function ensureExists(login, userData) {
    return new Promise((resolve, reject) => {
        // console.log("ensureUserExists:",login);
        db.users.findOne({ _id: login }, function (err, user) {
            if (user) {
                // console.log(" - exists");
                resolve();
            } else {
                // console.log(" - not found");
                var lookupPromise;
                if (userData) {
                    lookupPromise = Promise.resolve(userData);
                } else {
                    if (settings.git.gitlab == true) {
                        lookupPromise = gitlab.getUser(login);
                    }
                    else if (settings.git.github == true) {
                        lookupPromise = github.getUser(login);
                    }
                }
                lookupPromise.then(function (data) {
                    var userRecord = extractGitInfo(data);
                    userRecord.npm_verified = false
                    db.users.save(userRecord);
                    resolve();
                }).catch(function (err) {
                    reject(err);
                });
            }
        });
    });
}

function refreshUserGitHub(login) {
    return new Promise((resolve, reject) => {
        db.users.findOne({ _id: login }, function (err, user) {
            if (!err && user) {

                if (settings.git.github == true) {
                    github.getUser(login).then(function (data) {
                        var userRecord = extractGitInfo(data);
                        return update(userRecord);
                    }

                    ).then(function () {
                        resolve();
                    }).catch(function (err) {
                        reject(err);
                    })
                } else if (settings.git.gitlab == true) {
                    gitlab.getUser(login).then(function (data) {
                        var userRecord = extractGitInfo(data);
                        return update(userRecord);
                    }

                    ).then(function () {
                        resolve();
                    }).catch(function (err) {
                        reject(err);
                    })
                }
            } else {
                reject("User not found")
            }
        });
    });
}

function get(login) {
    return new Promise((resolve, reject) => {
        console.log("get", login)
        db.users.findOne({ _id: login }, function (err, user) {
            if (err) {
                reject(err);
            } else {
                resolve(user);
            }
        });
    });
}
function update(user) {
    return new Promise((resolve, reject) => {
        console.log("Update user", user._id, user);
        db.users.update(
            { _id: user._id },
            { $set: user },
            function (err) {
                if (err) {
                    //console.log(err);
                    util.log("Update User", user._id, "ERR", err.toString())
                    reject({ name: user._id, error: err });
                } else {
                    resolve(user);
                }
            }
        );
    });
}

function checkAllExist(userList) {
    return new Promise((resolve, reject) => {
        db.users.find({ _id: { $in: userList } }, { _id: 1 }, function (err, docs) {
            if (err) {
                reject(err);
                return;
            }
            var matched = {};
            userList.forEach(u => { matched[u] = true })
            docs.forEach(d => {
                delete matched[d._id]
            });
            var unmatched = Object.keys(matched);
            resolve(unmatched);
        })
    })
}
module.exports = {
    get: get,
    ensureExists: ensureExists,
    update: update,
    refreshUserGitHub: refreshUserGitHub,
    checkAllExist: checkAllExist
}
