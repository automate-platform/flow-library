var express = require("express");
const users = require("../lib/users");
var gitlab = require("../lib/gitlab");
var settings = require('../config');
var OAuth2 = require("oauth").OAuth2;
var oauth = new OAuth2(settings.git.clientId, settings.git.secret, settings.git.domain, "oauth/authorize", "oauth/token");
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
                redirect_uri: settings.git.authCallback,
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
        redirect_uri: settings.git.authCallback,
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
        console.log(access_token);
        console.log(refresh_token);
        req.session.accessToken = access_token;
      
        console.log(req.session.accessToken)
        gitlab.getAuthedUserGitLab(req.session.accessToken).then(function (user) {
            return users.ensureExists(user.login, user).then(function () {
            
                req.session.user = {
                    login: user.login,
                    avatar_url: user.avatar_url,
                    url: user.url,
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
