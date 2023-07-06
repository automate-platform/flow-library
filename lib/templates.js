const mustache = require('mustache');
const fs = require("fs");
const path = require("path");
var settings = require("../default-settings");



var renderTemplates = {};
var partialTemplates = {};
const templateDir = path.join(__dirname,"..","template");

fs.readdir(templateDir,function(err,files) {
    files.forEach(function(fn) {
        if (/.html$/.test(fn)) {
            var partname = fn.substring(0,fn.length-5);
            fs.readFile(path.join(templateDir,fn),'utf8',function(err,data) {
                if (fn[0] == "_" && (settings.template.footer ? partname !== "":partname !== "_footer")) {
                    partialTemplates[partname] = data;
                } else {
                    mustache.parse(data);
                    renderTemplates[partname] = data;
                }
            });
        }
    });
});

renderTemplates.partials = partialTemplates;
module.exports = renderTemplates;
