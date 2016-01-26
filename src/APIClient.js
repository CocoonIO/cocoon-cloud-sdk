var CocoonSDK;
(function (CocoonSDK) {
    (function (GrantType) {
        GrantType[GrantType["Implicit"] = 0] = "Implicit";
        GrantType[GrantType["AuthorizationCode"] = 1] = "AuthorizationCode";
    })(CocoonSDK.GrantType || (CocoonSDK.GrantType = {}));
    var GrantType = CocoonSDK.GrantType;
    (function (StorageType) {
        StorageType[StorageType["Cookies"] = 0] = "Cookies";
        StorageType[StorageType["Memory"] = 1] = "Memory";
    })(CocoonSDK.StorageType || (CocoonSDK.StorageType = {}));
    var StorageType = CocoonSDK.StorageType;
    var APIURL = (function () {
        function APIURL() {
        }
        APIURL.COMPILE = function (projectId) { return '/project/' + projectId + '/compile/'; };
        APIURL.PROJECT = '/project/';
        APIURL.USER_PROFILE = '/me/';
        APIURL.DEVAPP = '/project/devapp/';
        return APIURL;
    })();
    {
        return '/project/' + projectId + '/devapp/';
    }
    SINGNING_KEY = '/signkey/';
    GITHUB_CREATE = '/project/github/';
    GITHUB_SYNC = '/github/';
    COCOON_TEMPLATES = '/cocoon/templates/';
    COCOON_VERSIONS = '/cocoon/versions/';
    ICON(projectId, string, platform ?  : string);
    string;
    {
        return 'project/' + projectId + '/icon/';
    }
    SPLASH = '/splash/';
    USER_CREATE = '/user/';
    USER_RESET_PASS = '/cloud/login/password/';
    PURCHASES = '/purchases/';
})(CocoonSDK || (CocoonSDK = {}));
var APIClient = (function () {
    function APIClient(options) {
        if (!options || !options.clientId) {
            throw new Error("Missing parameter clientId");
        }
        this.config = {
            clientId: options.clientId,
            apiURL: options.apiURL || "https://api.cocoon.io/v1/",
            oauthURL: options.oauthURL || "https://cloud.cocoon.io/oauth/"
        };
        this.setOauthMode({ grantType: GrantType.Implicit });
        this.project = new ProjectAPI(this);
    }
    APIClient.prototype.setOauthMode = function (options) {
        this.oauthMode = options || { grantType: GrantType.Implicit };
        if (this.oauthMode.storageType === StorageType.Memory) {
            this.credentials = new MemoryCredentialStorage();
        }
        else {
            this.credentials = new CookieCredentialStorage();
        }
    };
    APIClient.prototype.setAccessToken = function (token, expires) {
        this.credentials.setAccessToken(token, expires);
    };
    APIClient.prototype.getAccessToken = function () {
        return this.credentials.getAccessToken();
    };
    APIClient.prototype.isLoggedIn = function () {
        return !!this.getAccessToken();
    };
    APIClient.prototype.logIn = function (options, callback) {
        var _this = this;
        if (!options) {
            options = {};
        }
        var redirectUri = options.redirectUri || window.location.href;
        var url = this.getLoginURL(redirectUri);
        console.log(url);
        var w, h;
        if (options.width && options.height) {
            w = options.width;
            h = options.height;
        }
        else {
            w = Math.min(Math.floor(window.outerWidth * 0.8), 1000);
            h = Math.min(Math.floor(window.outerHeight * 0.5), 630);
        }
        var left = Math.floor(window.screenX + (window.outerWidth - w) / 2);
        var top = Math.floor(window.screenY + (window.outerHeight - h) / 8);
        var windowOptions = "width=" + w + ",height=" + h;
        windowOptions += ",toolbar=0,scrollbars=1,status=1,resizable=1,location=1,menuBar=0";
        windowOptions += ",left=" + left + ",top=" + top;
        var tokenReceived = false;
        var me = this;
        function processToken(accessToken) {
            tokenReceived = true;
            try {
                if (wnd) {
                    wnd.close();
                }
            }
            catch (error) {
            }
            me.setAccessToken(accessToken, 3600);
            callback(accessToken, null);
        }
        var getMessage = function (e) {
            if (!tokenReceived) {
                if (e.origin !== _this.config.oauthURL) {
                    return;
                }
                processToken(e.data);
            }
        };
        if (window.addEventListener) {
            window.addEventListener("message", getMessage, false);
        }
        else if (window.attachEvent) {
            window.attachEvent("onmessage", getMessage);
        }
        else if (document.attachEvent) {
            document.attachEvent("onmessage", getMessage);
        }
        var chrome = window.chrome;
        if (chrome && chrome.runtime && chrome.runtime.onMessageExternal) {
            chrome.runtime.onMessageExternal.addListener(function (request, sender, sendResponse) {
                request.origin = sender.url.match(/^.{2,5}:\/\/[^\/]+/)[0];
                return getMessage(request);
            });
        }
        var wnd = window.open(url, "Authorization", windowOptions);
        function checkUrl() {
            if (tokenReceived) {
                return true;
            }
            var url = wnd.location.href;
            console.log(url);
            if (url.indexOf(redirectUri) >= 0) {
                var access_token = url.split("access_token=")[1];
                if (access_token) {
                    processToken(access_token);
                    return true;
                }
            }
            return false;
        }
        if (wnd) {
            wnd.onload = function (e) {
                checkUrl();
            };
            wnd.focus();
            var interval = window.setInterval(function () {
                if (checkUrl() || wnd === null || wnd.closed) {
                    window.clearInterval(interval);
                    if (!tokenReceived) {
                        callback(null, { message: "The popup was closed", code: 0 });
                    }
                }
            }, 100);
        }
        else {
            callback(null, { message: "Cannot open window", code: 0 });
        }
    };
    APIClient.prototype.logout = function () {
        this.credentials.logout();
    };
    APIClient.prototype.request = function (method, path, options, callback) {
        var xhr = new XMLHttpRequest();
        var url = path;
        if (path.indexOf('://') < 0) {
            url = this.config.apiURL + path;
        }
        xhr.open(method || "GET", url);
        xhr.setRequestHeader("Authorization", "Bearer " + this.credentials.getAccessToken());
        xhr.onerror = function () {
            if (callback) {
                callback(null, { message: this.statusText || 'Error with status ' + this.status, code: this.status });
            }
        };
        xhr.onload = function () {
            if (callback) {
                if (this.status < 200 || this.status >= 300) {
                    var errorMessage = { code: this.status, message: "Error with code: " + this.status };
                    try {
                        data = JSON.parse(this.responseText);
                        if (data.description) {
                            errorMessage = { code: data.code, message: data.description };
                        }
                    }
                    catch (ex) {
                    }
                    callback(null, errorMessage);
                    return;
                }
                try {
                    var data;
                    if (options && options.transform) {
                        data = options.transform(this);
                    }
                    else if (this.responseText) {
                        data = JSON.parse(this.responseText);
                    }
                    else {
                        data = this.responseText;
                    }
                    callback(data || null, null);
                }
                catch (ex) {
                    callback(null, { message: "Error parsing json: " + ex, code: 0 });
                }
            }
        };
        if (options && options.responseType) {
            xhr.responseType = options.responseType;
        }
        if (options && options.params) {
            if (options.contentType === "multipart/form-data") {
                xhr.send(options.params);
            }
            else if (options.contentType) {
                xhr.setRequestHeader("Content-Type", options.contentType);
                xhr.send(options.params);
            }
            else if (typeof options.params === 'object') {
                xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
                xhr.send(JSON.stringify(options.params));
            }
        }
        else {
            xhr.send();
        }
    };
    APIClient.prototype.getMe = function (callback) {
        this.request("GET", "me", null, callback);
    };
    APIClient.prototype.getLoginURL = function (redirect_uri) {
        var result = this.config.oauthURL + "authorization?client_id=" + this.config.clientId;
        result += "&response_type=token";
        if (redirect_uri) {
            result += "&redirect_uri=" + encodeURI(redirect_uri);
        }
        return result;
    };
    return APIClient;
})();
exports.APIClient = APIClient;
var ProjectAPI = (function () {
    function ProjectAPI(client) {
        this.client = client;
    }
    ProjectAPI.prototype.get = function (projectId, callback) {
        this.client.request("GET", APIURL.PROJECT + projectId, function (response, error) {
            if (error) {
                callback(null, error);
            }
            else {
                callback(new Project(response, this.client), null);
            }
        });
    };
    ProjectAPI.prototype.delete = function (projectId, callback) {
        this.client.request("DELETE", "project/" + projectId, function (response, error) {
            if (callback) {
                callback(error);
            }
        });
    };
    ProjectAPI.prototype.list = function (callback) {
        this.client.request("GET", "project", null, function (response, error) {
            if (error) {
                callback(null, error);
            }
            else {
                var data = response || [];
                var result = [];
                for (var i = 0; i < data.length; ++i) {
                    result.push(new Project(data[i], this.client));
                }
                callback(result, null);
            }
        });
    };
    ProjectAPI.prototype.compile = function (projectId, callback) {
        this.client.request("GET", APIURL.COMPILE + projectId, function (response, error) {
            if (callback) {
                callback(error);
            }
        });
    };
    ProjectAPI.prototype.compileDevApp = function (id, callback) {
        this.client.request("GET", APIURL.DEVAPP, function (response, error) {
            if (callback) {
                callback(error);
            }
        });
    };
    ProjectAPI.prototype.getConfigXml = function (configURL, callback) {
        var xhrOptions = {
            transform: function (xhr) {
                return xhr.responseText;
            }
        };
        this.client.request("GET", configURL, xhrOptions, function (response, error) {
            callback(response, error);
        });
    };
    ProjectAPI.prototype.getIconBlob = function (projectId, platform, callback) {
        var xhrOptions = {
            responseType: 'blob',
            transform: function (xhr) {
                return xhr.response;
            }
        };
        this.client.request("GET", APIURL.ICON(projectId, platform), xhrOptions, function (response, error) {
            callback(response, error);
        });
    };
    ProjectAPI.prototype.getIconSrc = function (projectId, platform) {
        return this.client.config.apiURL + APIURL.ICON(projectId, platform) + '?access_token=' + this.client.credentials.getAccessToken();
    };
    ProjectAPI.prototype.putConfigXml = function (configURL, xml, callback) {
        var formData = new FormData();
        var blob = new Blob([xml], { type: 'text/xml;charset=utf-8;' });
        formData.append('file', blob, "config.xml");
        var xhrOptions = {
            contentType: "multipart/form-data",
            params: formData
        };
        this.client.request("PUT", configURL, xhrOptions, function (response, error) {
            if (callback) {
                callback(error);
            }
        });
    };
    ProjectAPI.prototype.syncGithub = function (projectId, repo, callback) {
        this.client.request("PUT", APIURL.GITHUB_SYNC, { params: repo }, function (response, error) {
            if (callback) {
                callback(error);
            }
        });
    };
    return ProjectAPI;
})();
exports.ProjectAPI = ProjectAPI;
var MemoryCredentialStorage = (function () {
    function MemoryCredentialStorage() {
    }
    MemoryCredentialStorage.prototype.getAccessToken = function () { return this.access_token; };
    MemoryCredentialStorage.prototype.getRefreshToken = function () { return this.refresh_token; };
    MemoryCredentialStorage.prototype.setAccessToken = function (value, expires) { this.access_token = value; this.expires = expires; };
    MemoryCredentialStorage.prototype.setRefreshToken = function (value) { this.refresh_token = value; };
    MemoryCredentialStorage.prototype.logout = function () {
        this.access_token = null;
        this.refresh_token = null;
        this.expires = 0;
    };
    return MemoryCredentialStorage;
})();
var CookieCredentialStorage = (function () {
    function CookieCredentialStorage() {
    }
    CookieCredentialStorage.prototype.getAccessToken = function () {
        return CookieHelper.getItem("access_token");
    };
    CookieCredentialStorage.prototype.getRefreshToken = function () {
        return CookieHelper.getItem("refresh_token");
    };
    CookieCredentialStorage.prototype.setAccessToken = function (value, expires) {
        CookieHelper.setItem("access_token", value, expires || Infinity);
    };
    CookieCredentialStorage.prototype.setRefreshToken = function (value) {
        CookieHelper.setItem("access_token", value, Infinity);
    };
    CookieCredentialStorage.prototype.logout = function () {
        CookieHelper.removeItem("access_token");
        CookieHelper.removeItem("refresh_token");
    };
    return CookieCredentialStorage;
})();
var CookieHelper = (function () {
    function CookieHelper() {
    }
    CookieHelper.getItem = function (key) {
        var result = new RegExp('(?:^|; )' + encodeURIComponent(key) + '=([^;]*)').exec(document.cookie);
        return result ? result[1] : null;
    };
    CookieHelper.setItem = function (key, value, expires, path, domain, secure) {
        var strExpires = expires === Infinity ? '; expires=Fri, 31 Dec 9999 23:59:59 GMT' : '; max-age=' + expires;
        document.cookie = encodeURIComponent(key) + '=' + encodeURIComponent(value) + strExpires + (domain ? '; domain=' + domain : '') + (path ? '; path=' + path : '') + (secure ? '; secure' : '');
    };
    CookieHelper.removeItem = function (key, path, domain) {
        if (!CookieHelper.hasItem(key)) {
            return;
        }
        document.cookie = encodeURIComponent(key) + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT' + (domain ? '; domain=' + domain : '') + (path ? '; path=' + path : '');
    };
    CookieHelper.hasItem = function (key) {
        return (new RegExp('(?:^|;\\s*)' + encodeURIComponent(key).replace(/[\-\.\+\*]/g, '\\$&') + '\\s*\\=')).test(document.cookie);
    };
    return CookieHelper;
})();
