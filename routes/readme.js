const express = require("express");
const mustache = require('mustache');
const db = require("../lib/db");
const viewster = require("../lib/view");
const templates = require("../lib/templates");
const appUtils = require("../lib/utils");
const setting = require('../default-settings');
var { storage, multi_upload } = require("../lib/readme");


const querystring = require('querystring');

const app = express();

app.post("/readme-img/upload", multi_upload.any(), (req, res) => {
    const files = req.files;
    res.status(200).send(setting.server.url + '/readme/'+ files[0].filename);
    res.end();
});

module.exports = app;
