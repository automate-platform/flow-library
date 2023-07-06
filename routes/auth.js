var express = require("express");
const users = require("../lib/users");
var gitlab = require("../lib/gitlab");
var settings = require('../config');
var OAuth2 = require("oauth").OAuth2;
var oauth = new OAuth2(settings.gitlab.clientId, settings.gitlab.secret, "https://gitlab.com/", "oauth/authorize", "oauth/token");
//login/oauth/access_token
var app = express();

function login(req, res) {
    if (!req.session.accessToken) {
        if (req.query.return) {
            req.session.returnPath = req.query.return;
        } else {
            delete req.session.returnPath;
        }

        res.writeHead(303, {
            Location: oauth.getAuthorizeUrl({
                redirect_uri: settings.gitlab.authCallback,
                response_type: 'code',
                scope: 'openid profile email api'
            })

        });
        res.end();
        return;
    } else {
        res.writeHead(302, {
            Location: req.query.return || "/"
        });
        res.end();
        return;
    }
}
function logout(req, res) {
    req.session.destroy(function (err) {
        res.redirect('/');
    })
}
function loginCallback(req, res) {
    if (!req.query.code) {
        res.writeHead(403);
        res.end();
        return;
    }
    oauth.getOAuthAccessToken(req.query.code, {
        grant_type: 'authorization_code',
        redirect_uri: settings.gitlab.authCallback,
    }, function (err, access_token, refresh_token) {
        if (err) {
            console.log(err);
            res.writeHead(500);
            res.end(err + "");
            return;
        }
        if (!access_token) {
            res.writeHead(403);
            res.end();
            return;
        }

        req.session.accessToken = access_token;
      
        console.log(req.session.accessToken)
        gitlab.getAuthedUserGitLab(req.session.accessToken).then(function (user) {
            return users.ensureExists(user.login, user).then(function () {

                req.session.user = {
                    login: user.username,
                    avatar_url: user.avatar_url,
                    url: user.web_url,
                    name: user.name
                };

                res.writeHead(303, {
                    Location: req.session.returnPath || "/"
                });
                res.end();
                // res.redirect(req.session.returnPath || "/"); 
            });
        }).catch(function (err) {
            if (err) {
                console.log(err)
                res.writeHead(err.code);
                res.end(err + "");
            }
        });
    });
}

app.get("/login", login);
app.get("/logout", logout);
app.get("/login/callback", loginCallback);

module.exports = app;
