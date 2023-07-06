const https = require("https");
const settings = require("../config");
function sendGitLab(opts) {
    return new Promise((resolve, reject) => {
      var accessToken = opts.accessToken || defaultAccessToken;
      var method = (opts.method || "GET").toUpperCase();
      var path = opts.path;
      var headers = opts.headers || {};
      var body = opts.body;
  
      var _headers = {
        "user-agent": "node-red",
        "accept": "application/json",
        "Authorization": "Bearer " + accessToken
      };
  
      if (body) {
        _headers['content-type'] = "application/json";
      }
  
      for (var h in headers) {
        _headers[h] = headers[h];
      }
  
      var options = {
        host: "gitlab.com",
        port: 443,
        path: path ,
        method: method,
        headers: _headers
      };
  
      var req = https.request(options, function (res) {
        res.setEncoding("utf8");
        var data = "";
  
        res.on("data", function (chunk) {
          data += chunk;
        });
  
        res.on("end", function () {
          if (/^application\/json/.test(res.headers['content-type'])) {
            data = JSON.parse(data);
            data.etag = res.headers['etag'];
            data.rateLimit = {
              limit: res.headers['x-ratelimit-limit'],
              remaining: res.headers['x-ratelimit-remaining'],
              reset: res.headers['x-ratelimit-reset']
            };
          }
  
          resolve({ statusCode: res.statusCode, headers: res.headers, data: data });
        });
      });
  
      req.on("error", function (e) {
        console.log("problem with request: " + e.message);
        reject(e);
      });
  
      if (body) {
        req.write(JSON.stringify(body) + "\n");
      }
  
      req.end();
    });
  }

  
function getSimple(path,lastEtag) {
    return new Promise((resolve,reject) => {
        var headers = {};
        if (lastEtag) {
            headers['If-None-Match'] = lastEtag;
        }
        sendGitLab({path:path,headers:headers}).then(function(result) {
            if (lastEtag && result.statusCode == 304) {
                resolve(null);
            } else if (result.statusCode == 404) {
                reject(result);
            } else {
                resolve(result.data);
            }
        }).catch(function(er) { reject(er); });
    });
}



module.exports = {

    getAuthedUserGitLab: function(accessToken) {
        return new Promise((resolve, reject) => {
            sendGitLab({path:"/api/v4/user",accessToken:accessToken} )
              .then(result => {
                
                const user = {
                  login: result.data.username,
                  avatar_url: result.data.avatar_url,
                  url: result.data.web_url,
                  name: result.data.name
                };
                resolve(user);
              })
              .catch(error => {
                reject(error);
              });
          });
      },
    getUser: function(user,lastEtag) {
        return getSimple("/api/v4/users?username="+user,lastEtag);
    },

   
    createSnippet: function(gistData,accessToken) {
        return new Promise((resolve,reject) => {
         
            sendGitLab({path:"/api/v4/snippets",method:"POST",body:gistData,accessToken:accessToken}).then(function(result) {
                
                resolve(result.data);
              
            }).catch(function(er) { reject(er); });
        });
    },

}
