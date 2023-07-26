const express = require("express");
const mustache = require('mustache');
const multer = require('multer');
const db = require("../lib/db");
const viewster = require("../lib/view");
const templates = require("../lib/templates");
const appUtils = require("../lib/utils");
const setting = require('../default-settings');
var upload_file = require("../lib/readme").multi_upload.any();


const querystring = require('querystring');

const app = express();

app.post("/readme-img/upload", (req, res) => {
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
        const files = req.files;
        res.status(200).end(setting.server.url + '/readme/' + files[0].filename);
    });
});

module.exports = app;
