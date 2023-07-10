var express = require("express");
var mustache = require('mustache');
var { marked } = require('marked');
var fs = require("fs");

var settings = require("../config");
var snippet = require("../lib/snippet");
var setting = require("../default-settings");
var gister = require("../lib/gists");
var appUtils = require("../lib/utils");
var npmNodes = require("../lib/nodes");
var templates = require("../lib/templates");
var collections = require("../lib/collections");
var ratings = require("../lib/ratings");
var uuid = require('uuid');

var app = express();
if (setting.template.flows) {

    app.post("/flow", function (req, res) {
        if (req.session.accessToken) {
            const files = [

                {
                    file_path: 'flow.json',
                    content: req.body.flow
                },
                {
                    file_path: 'README.md',
                    content: req.body.description
                }

            ];
            var gist_post = {
                title: req.body.title,
                files: files,
                visibility: 'private',
                description: req.body.description,
            };


            snippet.create(req.session.accessToken, gist_post, req.body.tags || []).then(function (id) {
                res.send("/flow/" + id);
            }).catch(function (err) {
                console.log("Error creating flow:", err);
                res.send(err);
            });
        } else {
            res.status(403).end();
        }
    });

    app.get("/flow/:id", appUtils.csrfProtection(), function (req, res) { getFlow(req.params.id,null, req, res); }); //req.params.id, null, req, res
    app.get("/flow/:id/in/:collection", appUtils.csrfProtection(), function (req, res) { getFlow(req.params.id, req.params.collection, req, res); });
    function getFlow(id, collection, req, res) {
        snippet.get(id).then(function (snippet) {
            snippet.sessionuser = req.session.user;
            snippet.display = setting.template;
            snippet.csrfToken = req.csrfToken();
            snippet.collection = collection;
            snippet.created_at_since = appUtils.formatDate(snippet.created_at);
            snippet.updated_at_since = appUtils.formatDate(snippet.updated_at);
            snippet.refreshed_at_since = appUtils.formatDate(snippet.refreshed_at);
            snippet.pageTitle = snippet.description + " (flow)";

            var collectionPromise;
            var ratingPromise;
            if (req.cookies.rateID) {
                if (snippet.rating && !snippet.rating.hasOwnProperty("count")) {
                    delete snippet.rating;
                    ratingPromise = Promise.resolve();
                } else {
                    ratingPromise = ratings.getUserRating(id, req.cookies.rateID).then(function (userRating) {
                        if (userRating) {
                            if (!snippet.rating) {
                                snippet.rating = {};
                            }
                            snippet.rating.userRating = userRating.rating;
                        }
                        if (snippet.rating && snippet.rating.hasOwnProperty('score')) {
                            snippet.rating.score = (snippet.rating.score || 0).toFixed(1);
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

            if (snippet.created_at_since == snippet.updated_at_since) {
                delete snippet.updated_at_since;
            }
            snippet.owned = (snippet.sessionuser &&
                (
                    (snippet.owner.login == snippet.sessionuser.login) ||
                    (settings.admins.indexOf(req.session.user.login) != -1)
                ));

                snippet.nodeTypes = [];
            if (!snippet.flow) {
                snippet.flow = [];
            } else if (snippet.flow) {
                try {
                    var nodes = JSON.parse(snippet.flow);
                    var nodeTypes = {};
                    for (var n in nodes) {
                        var node = nodes[n];
                        nodeTypes[node.type] = (nodeTypes[node.type] || 0) + 1;
                    }
                    snippet.nodeTypes = [];
                    for (var nt in nodeTypes) {
                        snippet.nodeTypes.push({ type: nt, count: nodeTypes[nt] });
                    }
                    snippet.nodeTypes.sort(function (a, b) {
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
                    snippet.flow = JSON.stringify(nodes);
                } catch (err) {
                    snippet.flow = "Invalid JSON";
                }
            }
            npmNodes.findTypes(snippet.nodeTypes.map(function (t) { return t.type; })).then(function (typeMap) {
                var nodeTypes = snippet.nodeTypes;
                snippet.nodeTypes = { core: [], other: [] };

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
                        snippet.nodeTypes.core.push(t);
                    } else {
                        snippet.nodeTypes.other.push(t);
                    }

                });
                function completeRender(data) {
                    marked(data, {}, function (err, content) {
                        snippet.readme = content;
                        ratingPromise.then(() => collectionPromise).then(function (collectionSiblings) {
                            if (collection && collectionSiblings && collectionSiblings.length > 0) {
                                snippet.collectionName = collectionSiblings[0].name;
                                snippet.collectionPrev = collectionSiblings[0].prev;
                                snippet.collectionPrevType = collectionSiblings[0].prevType;
                                snippet.collectionNext = collectionSiblings[0].next;
                                snippet.collectionNextType = collectionSiblings[0].nextType;
                            }
                            res.send(mustache.render(templates.gist, snippet, templates.partials));
                        });
                    });
                }

                if (snippet.readme) {
                    completeRender(snippet.readme);
                } else {
                    completeRender("Missing readme");
                }
            });
        }).catch(function (err) {
            // TODO: better error logging without the full stack trace
            console.log("Error loading flow:", id);
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
            snippet.get(req.params.id).then(function (gist) {
                if (gist.owner.login == req.session.user.login) {
                    next();
                } else {
                    res.status(403).end();
                }
            }).catch(function () {
                res.status(403).end();
            });
        }
    }

    app.post("/flow/:id/tags", verifyOwner, function (req, res) {
        // TODO: verify req.session.user == gist owner
        snippet.updateTags(req.params.id, req.body.tags).then(function () {
            res.status(200).end();
        }).catch(function (err) {
            console.log("Error updating tags:", err);
            res.status(200).end();
        });

    });

    app.post("/flow/:id/refresh", verifyOwner, function (req, res) {
        snippet.refresh(req.params.id).then(function () {
            res.send("/flow/" + req.params.id);
        }).catch(function (exists) {
            if (exists) {
                res.status(304).end();
            } else {
                res.status(404).send(mustache.render(templates['404'], { sessionuser: req.session.user }, templates.partials));
            }
        });
    });

    app.post("/flow/:id/rate", appUtils.csrfProtection(), function (req, res) {
        var id = req.params.id;
        try {
            var cc_cookie = JSON.parse(req.cookies.cc_cookie)
        } catch (e) {
            var cc_cookie = false
        }
        if (req.cookies.rateID) {
            ratings.rateThing(id, req.cookies.rateID, Number(req.body.rating)).then(function () {
                res.writeHead(303, {
                    Location: "/flow/" + id
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
                Location: "/flow/" + id
            });
            res.end();
        }
    });

    app.post("/flow/:id/delete", appUtils.csrfProtection(), verifyOwner, function (req, res) {
        gister.remove(req.params.id).then(function () {
            res.writeHead(303, {
                Location: "/"
            });
            res.end();
        }).catch(function (err) {
            res.send(400, err).end();
        });
    });

    app.get("/add/flow", function (req, res) {
        if (!req.session.user) {
            return res.redirect("/add")
        }
        var context = {};
        context.sessionuser = req.session.user;
        context.display = setting.template;
        res.send(mustache.render(templates.addFlow, context, templates.partials));
    });

    module.exports = app;
}