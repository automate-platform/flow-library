var express = require("express");
var mustache = require('mustache');
var { marked } = require('marked');
var fs = require("fs");

var settings = require("../config");
var apper = require("../lib/apps");
var appUtils = require("../lib/utils");
var npmNodes = require("../lib/nodes");
var templates = require("../lib/templates");
var collections = require("../lib/collections");
var ratings = require("../lib/ratings");
var uuid = require('uuid');

var app = express();
if (settings.template.apps) {

    app.post("/app", function (req, res) {
        if (req.session.accessToken) {
            var app_post = {
                description: req.body.title,
                public: false,
                files: {
                    'app.json': {
                        content: req.body.flow
                    },
                    'README.md': {
                        content: req.body.description
                    }
                }
            };
            apper.create(req.session.accessToken, app_post, req.body.tags || []).then(function (id) {
                res.send("/app/" + id);
            }).catch(function (err) {
                console.log("Error creating app:", err);
                res.send(err);
            });
        } else {
            res.status(403).end();
        }
    });

    app.get("/app/:id", appUtils.csrfProtection(), function (req, res) { getFlow(req.params.id, null, req, res); });
    app.get("/app/:id/in/:collection", appUtils.csrfProtection(), function (req, res) { getFlow(req.params.id, req.params.collection, req, res); });
    function getFlow(id, collection, req, res) {
        apper.get(id).then(function (app) {
            app.sessionuser = req.session.user;
            app.csrfToken = req.csrfToken();
            app.collection = collection;
            app.created_at_since = appUtils.formatDate(app.created_at);
            app.updated_at_since = appUtils.formatDate(app.updated_at);
            app.refreshed_at_since = appUtils.formatDate(app.refreshed_at);
            app.pageTitle = app.description + " (app)";

            var collectionPromise;
            var ratingPromise;
            if (req.cookies.rateID) {
                if (app.rating && !app.rating.hasOwnProperty("count")) {
                    delete app.rating;
                    ratingPromise = Promise.resolve();
                } else {
                    ratingPromise = ratings.getUserRating(id, req.cookies.rateID).then(function (userRating) {
                        if (userRating) {
                            if (!app.rating) {
                                app.rating = {};
                            }
                            app.rating.userRating = userRating.rating;
                        }
                        if (app.rating && app.rating.hasOwnProperty('score')) {
                            app.rating.score = (app.rating.score || 0).toFixed(1);
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

            if (app.created_at_since == app.updated_at_since) {
                delete app.updated_at_since;
            }
            app.owned = (app.sessionuser &&
                (
                    (app.owner.login == app.sessionuser.login) ||
                    (settings.admins.indexOf(req.session.user.login) != -1)
                ));

            app.nodeTypes = [];
            if (!app.flow) {
                app.flow = [];
            } else if (app.flow) {
                try {
                    var nodes = JSON.parse(app.flow);
                    var nodeTypes = {};
                    for (var n in nodes) {
                        var node = nodes[n];
                        nodeTypes[node.type] = (nodeTypes[node.type] || 0) + 1;
                    }
                    app.nodeTypes = [];
                    for (var nt in nodeTypes) {
                        app.nodeTypes.push({ type: nt, count: nodeTypes[nt] });
                    }
                    app.nodeTypes.sort(function (a, b) {
                        if (a.type in npmNodes.CORE_NODES && !(b.type in npmNodes.CORE_NODES)) {
                            return -1;
                        }
                        if (!(a.type in npmNodes.CORE_NODES) && b.type in npmNodes.CORE_NODES) {
                            return 1;
                        }
                        if (a.type > b.type) return 1;
                        if (a.type < b.type) return -1;
                        return 0;
                    });
                    app.flow = JSON.stringify(nodes);
                } catch (err) {
                    app.flow = "Invalid JSON";
                }
            }
            npmNodes.findTypes(app.nodeTypes.map(function (t) { return t.type; })).then(function (typeMap) {
                var nodeTypes = app.nodeTypes;
                app.nodeTypes = { core: [], other: [] };

                nodeTypes.forEach(function (t) {
                    var type = typeMap[t.type];
                    if (type) {
                        if (type.length == 1) {
                            t.module = type[0];
                        } else if (type.length > 1) {
                            t.moduleAlternatives = type;
                        }
                    }
                    if (t.type in npmNodes.CORE_NODES) {
                        delete t.module;
                        app.nodeTypes.core.push(t);
                    } else {
                        app.nodeTypes.other.push(t);
                    }

                });
                function completeRender(data) {
                    marked(data, {}, function (err, content) {
                        app.readme = content;
                        ratingPromise.then(() => collectionPromise).then(function (collectionSiblings) {
                            if (collection && collectionSiblings && collectionSiblings.length > 0) {
                                app.collectionName = collectionSiblings[0].name;
                                app.collectionPrev = collectionSiblings[0].prev;
                                app.collectionPrevType = collectionSiblings[0].prevType;
                                app.collectionNext = collectionSiblings[0].next;
                                app.collectionNextType = collectionSiblings[0].nextType;
                            }
                            res.send(mustache.render(templates.app, app, templates.partials));
                        });
                    });
                }

                if (app.readme) {
                    completeRender(app.readme);
                } else {
                    completeRender("Missing readme");
                }
            });
        }).catch(function (err) {
            // TODO: better error logging without the full stack trace
            console.log("Error loading app:", id);
            console.log(err);
            try {
                res.status(404).send(mustache.render(templates['404'], { sessionuser: req.session.user }, templates.partials));
            } catch (err2) {
                console.log(err2);
            }
        });
    }

    function verifyOwner(req, res, next) {
        if (!req.session.user) {
            res.status(403).end();
        } else if (settings.admins.indexOf(req.session.user.login) != -1) {
            next();
        } else {
            apper.get(req.params.id).then(function (app) {
                if (app.owner.login == req.session.user.login) {
                    next();
                } else {
                    res.status(403).end();
                }
            }).catch(function () {
                res.status(403).end();
            });
        }
    }

    app.post("/app/:id/tags", verifyOwner, function (req, res) {
        // TODO: verify req.session.user == app owner
        apper.updateTags(req.params.id, req.body.tags).then(function () {
            res.status(200).end();
        }).catch(function (err) {
            console.log("Error updating tags:", err);
            res.status(200).end();
        });

    });

    app.post("/app/:id/refresh", verifyOwner, function (req, res) {
        apper.refresh(req.params.id).then(function () {
            res.send("/app/" + req.params.id);
        }).catch(function (exists) {
            if (exists) {
                res.status(304).end();
            } else {
                res.status(404).send(mustache.render(templates['404'], { sessionuser: req.session.user }, templates.partials));
            }
        });
    });

    app.post("/app/:id/rate", appUtils.csrfProtection(), function (req, res) {
        var id = req.params.id;
        try {
            var cc_cookie = JSON.parse(req.cookies.cc_cookie)
        } catch (e) {
            var cc_cookie = false
        }
        if (req.cookies.rateID) {
            ratings.rateThing(id, req.cookies.rateID, Number(req.body.rating)).then(function () {
                res.writeHead(303, {
                    Location: "/app/" + id
                });
                res.end();
            })
        } else if (cc_cookie && cc_cookie.level.includes("functionality")) {
            var rateID = uuid.v4()
            res.cookie('rateID', rateID, { maxAge: 31556952000 })
            ratings.rateThing(id, rateID, Number(req.body.rating)).then(function () {
                res.writeHead(303, {
                    Location: "/flow/" + id
                });
                res.end();
            })
        } else {
            res.writeHead(303, {
                Location: "/app/" + id
            });
            res.end();
        }
    });

    app.post("/app/:id/delete", appUtils.csrfProtection(), verifyOwner, function (req, res) {
        apper.remove(req.params.id).then(function () {
            res.writeHead(303, {
                Location: "/"
            });
            res.end();
        }).catch(function (err) {
            res.send(400, err).end();
        });
    });

    app.get("/add/app", function (req, res) {
        if (!req.session.user) {
            return res.redirect("/add")
        }
        var context = {};
        context.sessionuser = req.session.user;
        res.send(mustache.render(templates.addApp, context, templates.partials));
    });

    module.exports = app;
}