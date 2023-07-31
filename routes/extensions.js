var express = require("express");
var mustache = require('mustache');
var fs = require("fs");
var multer = require("multer")

var settings = require("../config");
var setting = require("../default-settings");
var extensioner = require("../lib/extensions");
var appUtils = require("../lib/utils");
var templates = require("../lib/templates");
var collections = require("../lib/collections");
var ratings = require("../lib/ratings");
var mark = require('../public/js/marked')
var uuid = require('uuid');
var upload_file = require("../lib/extensions").multi_upload.any();

var app = express();
if (setting.template.extensions) {

    app.post("/extension", function (req, res) {
        if (req.session.accessToken) {
            var extension_post = {
                description: req.body.title,
                public: false,
                files: {
                    'README.md': {
                        content: req.body.description
                    },
                    'icon.ico': {
                        content: req.body.icondata
                    }
                }
            };
            extensioner.create(req.session.accessToken, extension_post, req.body.tags || []).then(function (id) {
                res.send(id);
            }).catch(function (err) {
                console.error("Error creating extention:", err);
                res.send(err);
            });
        } else {
            res.status(403).end();
        }
    });

    app.post('/extension/source', function (req, res) {
        upload_file(req, res, function (err) {
            if (err instanceof multer.MulterError) {
                // A Multer error occurred when uploading.
                res.status(500).send({ error: { message: `Multer uploading error: ${err.message}` } }).end();
                return;
            } else if (err) {
                if (err.name == 'ExtensionError') {
                    res.status(413).send({ error: { message: err.message } }).end();
                } else {
                    res.status(500).send({ error: { message: `unknown uploading error: ${err.message}` } }).end();
                }
                return;
            }
            const id = req.body.id;
            let zipFileName = "";
            let files_img = [];
            if (req.files) {
                let files = req.files;
                files.forEach(file => {
                    if (file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed') {
                        zipFileName = file.originalname;
                    }
                    if (file.mimetype.startsWith('image/')) {
                        files_img.push(file.originalname)
                    }
                });
            } else {
                console.error("No file was uploaded with the request.");
                res.status(400).send({ error: "No file was uploaded with the request." });
                return;
            }
            var extension_post = {
                zip_url: zipFileName,
                guideline_img: files_img
            };
            extension_post.version = "1.0.0";
            extensioner.putSource(id, extension_post || []).then(result => {
                res.status(200).end("/extension/" + id);
            }).catch((err) => {
                console.error('Error', err)
            })
        });
    })

    app.get("/extension/:id", appUtils.csrfProtection(), function (req, res) { getFlow(req.params.id, null, req, res); });
    app.get("/extension/:id/in/:collection", appUtils.csrfProtection(), function (req, res) { getFlow(req.params.id, req.params.collection, req, res); });
    function getFlow(id, collection, req, res) {
        extensioner.get(id).then(function (extension) {
            extension.sessionuser = req.session.user;
            extension.display = setting.template;
            extension.csrfToken = req.csrfToken();
            extension.collection = collection;
            extension.created_at_since = appUtils.formatDate(extension.created_at);
            extension.updated_at_since = appUtils.formatDate(extension.updated_at);
            extension.refreshed_at_since = appUtils.formatDate(extension.refreshed_at);
            extension.pageTitle = extension.description + " (extension)";

            var imgUrl = [];
            var imgCollection = extension.guideline_img || [];
            imgCollection.forEach((img, index) => {
                let url = `${setting.server.url}/${extension._id}/${img}`;
                imgUrl.push({ idx: index, url: url })
            })

            extension.imgGuidelineUrl = imgUrl;

            var collectionPromise;
            var ratingPromise;
            if (req.cookies.rateID) {
                if (extension.rating && !extension.rating.hasOwnProperty("count")) {
                    delete extension.rating;
                    ratingPromise = Promise.resolve();
                } else {
                    ratingPromise = ratings.getUserRating(id, req.cookies.rateID).then(function (userRating) {
                        if (userRating) {
                            if (!extension.rating) {
                                extension.rating = {};
                            }
                            extension.rating.userRating = userRating.rating;
                        }
                        if (extension.rating && extension.rating.hasOwnProperty('score')) {
                            extension.rating.score = (extension.rating.score || 0).toFixed(1);
                        }
                    });
                }
            } else {
                ratingPromise = Promise.resolve();
            }
            if (collection) {
                collectionPromise = collections.getSiblings(collection, id);
            } else {
                collectionPromise = Promise.resolve();
            }

            if (extension.created_at_since == extension.updated_at_since) {
                delete extension.updated_at_since;
            }
            extension.owned = (extension.sessionuser &&
                (
                    (extension.owner.login == extension.sessionuser.login) ||
                    (settings.admins.indexOf(req.session.user.login) != -1)
                ));
            function completeRender(data) {
                mark(data, {}, function (err, content) {
                    extension.readme = content;
                    ratingPromise.then(() => collectionPromise).then(function (collectionSiblings) {
                        if (collection && collectionSiblings && collectionSiblings.length > 0) {
                            extension.collectionName = collectionSiblings[0].name;
                            extension.collectionPrev = collectionSiblings[0].prev;
                            extension.collectionPrevType = collectionSiblings[0].prevType;
                            extension.collectionNext = collectionSiblings[0].next;
                            extension.collectionNextType = collectionSiblings[0].nextType;
                        }
                        res.send(mustache.render(templates.extension, extension, templates.partials));
                    });
                });
            }

            if (extension.readme) {
                completeRender(extension.readme);
            } else {
                completeRender("Missing readme");
            }
        }).catch(function (err) {
            // TODO: better error logging without the full stack trace
            console.error("Error loading extension:", id);
            console.error(err);
            try {
                res.status(404).send(mustache.render(templates['404'], { sessionuser: req.session.user }, templates.partials));
            } catch (err2) {
                console.error(err2);
            }
        });
    }

    function verifyOwner(req, res, next) {
        if (!req.session.user) {
            res.status(403).end();
        } else if (settings.admins.indexOf(req.session.user.login) != -1) {
            next();
        } else {
            extensioner.get(req.params.id).then(function (extension) {
                if (extension.owner.login == req.session.user.login) {
                    next();
                } else {
                    res.status(403).end();
                }
            }).catch(function () {
                res.status(403).end();
            });
        }
    }

    app.get("/extension/update/:id", verifyOwner, function (req, res) {
        extensioner.get(req.params.id).then(extension => {
            extension.sessionuser = req.session.user;
            extension.display = setting.template;
            extension.lastVersion = extension.versions.pop()['version'];

            var imgUrl = [];
            var imgCollection = extension.guideline_img || [];
            imgCollection.forEach((img, index) => {
                let url = `${setting.server.url}/${extension._id}/${img}`;
                imgUrl.push({ idx: index, url: url })
            })

            extension.imgGuidelineUrl = imgUrl;
            res.send(mustache.render(templates.updateExtension, extension, templates.partials));
        }).catch(function (err) {
            // TODO: better error logging without the full stack trace
            console.error(err);
            try {
                res.status(404).send(mustache.render(templates['404'], { sessionuser: req.session.user }, templates.partials));
            } catch (err2) {
                console.error(err2);
            }
        });
    })

    app.post("/update-extension", function (req, res) {
        var extension_post = {
            description: req.body.title,
            public: false,
            files: {
                'README.md': {
                    content: req.body.description
                },
                'icon.ico': {
                    content: req.body.icondata
                }
            }
        };
        extensioner.update(req.body.id, extension_post, req.body.tags || [])
            .then(function (data) {
                res.send(data);
            }).catch(function (err) {
                console.error("Error creating app:", err);
                res.send(err);
            });

    });

    app.post('/extension/source-update', (req, res) => {
        upload_file(req, res, function (err) {
            if (err instanceof multer.MulterError) {
                // A Multer error occurred when uploading.
                res.status(500).send({ error: { message: `Multer uploading error: ${err.message}` } }).end();
                return;
            } else if (err) {
                if (err.name == 'ExtensionError') {
                    res.status(413).send({ error: { message: err.message } }).end();
                } else {
                    res.status(500).send({ error: { message: `unknown uploading error: ${err.message}` } }).end();
                }
                return;
            }
            const id = req.body.id;
            let zipFileName = "";
            let files_img = [];
            if (req.files) {
                let files = req.files;
                files.forEach(file => {
                    if (file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed' || path.extname(file.originalname) === '.zip') {
                        zipFileName = file.originalname;
                    }
                    if (file.mimetype.startsWith('image/')) {
                        files_img.push(file.originalname)
                    }
                });
            } else {
                console.error("No file was uploaded with the request.");
                res.status(400).send({ error: "No file was uploaded with the request." });
                return;
            }
            var extension_post = {
                zip_url: zipFileName,
                guideline_img: files_img,
                version: req.body.version
            };
            extensioner.updateSource(id, extension_post || []).then(result => {
                res.status(200).end("/extension/" + id);
            }).catch((err) => {
                console.error('Error', err)
            })
        });
    });


    app.post("/extension/:id/tags", verifyOwner, function (req, res) {
        // TODO: verify req.session.user == app owner
        extensioner.updateTags(req.params.id, req.body.tags).then(function () {
            res.status(200).end();
        }).catch(function (err) {
            console.error("Error updating tags:", err);
            res.status(200).end();
        });

    });



    app.post("/extension/:id/refresh", verifyOwner, function (req, res) {
        extensioner.refresh(req.params.id).then(function () {
            res.send("/extension/" + req.params.id);
        }).catch(function (exists) {
            if (exists) {
                res.status(304).end();
            } else {
                res.status(404).send(mustache.render(templates['404'], { sessionuser: req.session.user }, templates.partials));
            }
        });
    });

    app.post("/extension/:id/rate", appUtils.csrfProtection(), function (req, res) {
        var id = req.params.id;
        try {
            var cc_cookie = JSON.parse(req.cookies.cc_cookie)
        } catch (e) {
            var cc_cookie = false
        }
        if (req.cookies.rateID) {
            ratings.rateThing(id, req.cookies.rateID, Number(req.body.rating)).then(function () {
                res.writeHead(303, {
                    Location: "/extension/" + id
                });
                res.end();
            })
        } else if (cc_cookie && cc_cookie.level.includes("functionality")) {
            var rateID = uuid.v4()
            res.cookie('rateID', rateID, { maxAge: 31556952000 })
            ratings.rateThing(id, rateID, Number(req.body.rating)).then(function () {
                res.writeHead(303, {
                    Location: "/extension/" + id
                });
                res.end();
            })
        } else {
            res.writeHead(303, {
                Location: "/extension/" + id
            });
            res.end();
        }
    });

    app.post("/extension/:id/delete", appUtils.csrfProtection(), verifyOwner, function (req, res) {
        extensioner.remove(req.params.id).then(function () {
            res.writeHead(303, {
                Location: "/"
            });
            res.end();
        }).catch(function (err) {
            res.send(400, err).end();
        });
    });

    app.get("/add/extension", function (req, res) {
        if (!req.session.user) {
            return res.redirect("/add")
        }
        var context = {};
        context.sessionuser = req.session.user;
        context.display = setting.template;
        res.send(mustache.render(templates.addExtension, context, templates.partials));
    });
    module.exports = app;
}