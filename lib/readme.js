const settings = require("../config");
const github = require("./github");
const db = require("./db");
const users = require("./users");
const view = require("./view")
const multer = require('multer');
const fs = require('fs')
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const readme = path.join(settings.app.readme,);
        if (!fs.existsSync(readme)) {
            fs.mkdirSync(readme);
        }
        cb(null, readme);
    },
    filename: function (req, file, cb) {
        let readmeName = file.originalname.split('.')[0].replace(/[\s~`!@#$%^&*()_+\-={[}\]|\\:;"'<,>.?/]+/g, '_') + path.extname(file.originalname)
        cb(null, Date.now() + '-' + readmeName);
    }
});

const multi_upload = multer({ storage });

module.exports = {
    storage, multi_upload,
};