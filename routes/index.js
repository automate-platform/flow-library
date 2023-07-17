const express = require("express");
const mustache = require('mustache');
const db = require("../lib/db");
const viewster = require("../lib/view");
const templates = require("../lib/templates");
const appUtils = require("../lib/utils");
const setting = require('../default-settings');

const querystring = require('querystring');

const app = express();


function queryFromRequest(req) {
    var query = Object.assign({}, req.query);
    query.page = Number(query.page) || 1;
    query.num_pages = Number(query.num_pages) || 1;
    query.page_size = Number(query.page_size) || viewster.DEFAULT_PER_PAGE;
    query.type = query.type || "app";
    return query;
}
function getNextPageQueryString(count, query) {
    var currentPage = parseInt(query.page) || 1;
    if (viewster.DEFAULT_PER_PAGE * currentPage < count) {
        return querystring.stringify(Object.assign({}, query, { page: currentPage + 1 }))
    }
    return null
}
function getPrevPageQueryString(count, query) {
    var currentPage = parseInt(query.page) || 1;
    if (currentPage > 1) {
        return querystring.stringify(Object.assign({}, query, { page: currentPage - 1 }))
    }
    return null
}

app.get("/", function (req, res) {
    var context = {};

    context.sessionuser = req.session.user;
    context.display = setting.template;
    context.nodes = {
        type: 'node',
        per_page: context.sessionuser ? 6 : 6,
        hideOptions: true,
        hideNav: true,
        ignoreQueryParams: true,
        showIndex: setting.template.nodes
    }

    context.flows = {
        type: 'flow',
        per_page: context.sessionuser ? 6 : 6,
        hideOptions: true,
        hideNav: true,
        ignoreQueryParams: true,
        showIndex: setting.template.flows
    }

    context.collections = {
        type: 'collection',
        per_page: context.sessionuser ? 6 : 6,
        hideOptions: true,
        hideNav: true,
        ignoreQueryParams: true,
        showIndex: setting.template.collection
    }

    context.apps = {
        type: 'app',
        per_page: context.sessionuser ? 6 : 6,
        hideOptions: true,
        hideNav: true,
        ignoreQueryParams: true,
        showIndex: setting.template.apps
    }

    viewster.getTypeCounts().then(function (counts) {
        context.nodes.count = counts.node;
        context.flows.count = counts.flow;
        context.collections.count = counts.collection;
        context.apps.count = counts.app;

        res.send(mustache.render(templates.index, context, templates.partials));
    });
});

app.get("/things", function (req, res) {

    var response = {
        links: {
            self: "/things?" + querystring.stringify(req.query),
            prev: null,
            next: null
        },
        meta: {
            pages: {
                current: parseInt(req.query.page) || 1
            },
            results: {

            }
        }
    };
    var query = queryFromRequest(req);

    viewster.getForQuery(query).then(function (result) {
        result.things = result.things || [];
        result.things.forEach(function (thing) {
            thing.isApp = thing.type === 'app';
            thing.isNode = thing.type === 'node';
            thing.isFlow = thing.type === 'flow';
            thing.isCollection = thing.type === 'collection';
            thing.nodeShow = setting.template.nodes;
            thing.flowsShow = setting.template.flows;
            thing.collectionShow = setting.template.collection;
            thing.appsShow = setting.template.apps;
        })
        response.meta.results.count = result.count;
        response.meta.results.total = result.total;
        response.meta.pages.total = Math.ceil(result.count / viewster.DEFAULT_PER_PAGE);
        var nextQS = getNextPageQueryString(result.count, req.query);
        var prevQS = getPrevPageQueryString(result.count, req.query);

        if (nextQS) {
            response.links.next = "/things?" + nextQS;
        }
        if (prevQS) {
            response.links.prev = "/things?" + prevQS;
        }
        var context = {
            things: result.things,
            toFixed: function () {
                return function (num, render) {
                    return parseFloat(render(num)).toFixed(1);
                }
            }
        };
        if (req.session.user) {
            context.showTools = {};
            if (result.collectionOwners) {
                for (var i = 0; i < result.collectionOwners.length; i++) {
                    if (result.collectionOwners[i] === req.session.user.login) {
                        context.showTools.ownedCollection = true;
                        break;
                    }
                }
            }
        }
        if (query.collection) {
            context.collection = query.collection;
        }
        if (query.format !== 'json') {
            response.html = mustache.render(templates.partials._gistitems, context, templates.partials);
        } else {
            response.data = result.things;
        }
        setTimeout(function () {
            res.json(response);
        }, 0);//2000);
    }).catch(function (err) {
        response.err = err;
        res.json(response);
    });
});


app.get("/search", function (req, res) {
    var context = {};
    context.sessionuser = req.session.user;
    context.fullsearch = true;
    var query = queryFromRequest(req);
    context.query = query;
    context.display = setting.template;
    res.send(mustache.render(templates.search, context, templates.partials));
});

app.get("/add", function (req, res) {
    var context = {};
    context.sessionuser = req.session.user;
    context.display = setting.template;
    res.send(mustache.render(templates.add, context, templates.partials));
});

app.get("/inspect", function (req, res) {
    var context = {};
    res.send(mustache.render(templates.flowInspector, context, templates.partials));
})

app.get("/readme-img", function (req, res) {
    var context = {};
    context.sessionuser = req.session.user;
    context.display = setting.template;
    res.send(mustache.render(templates.uploadReadmeImg, context, templates.partials));
});

module.exports = app;
