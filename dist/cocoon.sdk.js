var CocoonSDK;
(function (CocoonSDK) {
    (function (Status) {
        Status[Status["Created"] = "created"] = "Created";
        Status[Status["Waiting"] = "waiting"] = "Waiting";
        Status[Status["Compiling"] = "compiling"] = "Compiling";
        Status[Status["Completed"] = "completed"] = "Completed";
        Status[Status["Disabled"] = "disabled"] = "Disabled";
    })(CocoonSDK.Status || (CocoonSDK.Status = {}));
    var Status = CocoonSDK.Status;
    var Platform = (function () {
        function Platform() {
        }
        Platform.IOS = "ios";
        Platform.ANDROID = "android";
        Platform.platforms = [Platform.IOS, Platform.ANDROID];
        return Platform;
    })();
    CocoonSDK.Platform = Platform;
    var Compilation = (function () {
        function Compilation(platform, data) {
            this.platform = platform;
            this.data = data;
        }
        Compilation.prototype.isDevApp = function () {
            return this.data.devapp && this.data.devapp.length > 0 && this.data.devapp.indexOf(this.platform) >= 0;
        };
        Compilation.prototype.isErrored = function () {
            return this.data.error && this.data.error.hasOwnProperty(this.platform);
        };
        Compilation.prototype.getError = function () {
            return this.isErrored() ? this.data.error[this.platform] : "";
        };
        Compilation.prototype.getStatus = function () {
            if (this.data.status && this.data.status.hasOwnProperty(this.platform)) {
                return this.data.status[this.platform];
            }
            if (this.data.date_compiled) {
                return Status.Disabled;
            }
            else {
                return Status.Created;
            }
        };
        Compilation.prototype.getDownloadLink = function () {
            if (this.data.download && this.data.download.hasOwnProperty(this.platform)) {
                return this.data.download[this.platform];
            }
            return "";
        };
        return Compilation;
    })();
    CocoonSDK.Compilation = Compilation;
    var Project = (function () {
        function Project(data, client) {
            this.data = data;
            this.compilations = [];
            this.client = client;
            for (var i = 0; i < Platform.platforms.length; ++i) {
                this.compilations.push(new Compilation(Platform.platforms[i], this.data));
            }
        }
        Project.prototype.syncNewData = function (newData) {
            for (var key in newData) {
                if (newData.hasOwnProperty(key)) {
                    this.data[key] = newData[key];
                }
            }
        };
        Project.prototype.isCompiling = function () {
            for (var i = 0; i < this.compilations.length; ++i) {
                var status = this.compilations[i].getStatus();
                if (status === Status.Compiling || status === Status.Waiting) {
                    return true;
                }
            }
            return false;
        };
        Project.prototype.getLastUse = function () {
            return Math.max(this.data.date_compiled || 0, this.data.date_created || 0, this.data.date_updated || 0);
        };
        Project.prototype.compile = function (callback) {
            this.client.project.compile(this.data.id, callback);
        };
        Project.prototype.compileDevApp = function (callback) {
            this.client.project.compileDevApp(this.data.id, callback);
        };
        Project.prototype.getConfigXml = function (callback) {
            this.client.project.getConfigXml(this.data.config, function (xml, error) {
                if (xml) {
                    this.cachedXml = xml;
                }
                if (callback) {
                    callback(xml, error);
                }
            });
        };
        Project.prototype.putConfigXml = function (xml, callback) {
            this.cachedXml = xml;
            this.client.project.putConfigXml(this.data.config, xml, callback);
        };
        Project.prototype.refresh = function (callback) {
            var _this = this;
            this.client.request("GET", "project/" + this.data.id, null, function (response, error) {
                if (response && !error) {
                    _this.syncNewData(response);
                }
                if (callback) {
                    callback(error);
                }
            });
        };
        Project.prototype.refreshUntilCompleted = function (callback) {
            var _this = this;
            this.refresh(function (error) {
                if (_this.isCompiling()) {
                    callback(false);
                    setTimeout(_this.refreshUntilCompleted.bind(_this, callback), 10000);
                }
                else {
                    callback(true);
                }
            });
        };
        Project.prototype.syncRepository = function (repo, callback) {
            this.client.project.syncRepository(this.data.id, repo, callback);
        };
        Project.prototype.uploadZip = function (file, callback) {
            var _this = this;
            this.client.project.uploadZip(this.data.id, file, function (data, error) {
                if (error) {
                    callback(error);
                }
                else {
                    _this.syncNewData(data);
                    callback(null);
                }
            });
        };
        Project.prototype.updatePublicZip = function (url, callback) {
            var _this = this;
            this.client.project.updatePublicZip(this.data.id, url, function (data, error) {
                if (error) {
                    callback(error);
                }
                else {
                    _this.syncNewData(data);
                    callback(null);
                }
            });
        };
        Project.prototype.getIconSrc = function (platform) {
            return this.client.project.getIconSrc(this.data.id, platform);
        };
        Project.prototype.getIconBlob = function (platform, callback) {
            this.client.project.getIconBlob(this.data.id, platform, callback);
        };
        Project.prototype.getCompilation = function (platform) {
            for (var i = 0; i < this.compilations.length; ++i) {
                if (this.compilations[i].platform === platform) {
                    return this.compilations[i];
                }
            }
            return null;
        };
        Project.prototype.getDownloadLink = function (platform) {
            var compilation = this.getCompilation(platform);
            if (compilation && compilation.getDownloadLink()) {
                return compilation.getDownloadLink() + "?access_token=" + this.client.getAccessToken();
            }
            return "";
        };
        Project.prototype.delete = function (callback) {
            this.client.project.delete(this.data.id, callback);
        };
        return Project;
    })();
    CocoonSDK.Project = Project;
})(CocoonSDK || (CocoonSDK = {}));
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
        APIURL.COMPILE = function (projectId) { return 'project/' + projectId + '/compile/'; };
        APIURL.DEVAPP = function (projectId) { return 'project/' + projectId + '/devapp/'; };
        APIURL.ICON = function (projectId, platform) { return 'project/' + projectId + '/icon/'; };
        APIURL.PROJECT = 'project/';
        APIURL.USER_PROFILE = 'me/';
        APIURL.SINGNING_KEY = 'signkey/';
        APIURL.GITHUB_CREATE = 'project/github/';
        APIURL.GITHUB_SYNC = 'github/';
        APIURL.URL_CREATE = 'project/url/';
        APIURL.URL_SYNC = 'url/';
        APIURL.COCOON_TEMPLATES = 'cocoon/templates/';
        APIURL.COCOON_VERSIONS = 'cocoon/versions/';
        APIURL.SPLASH = 'splash/';
        return APIURL;
    })();
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
            if (typeof document !== 'undefined') {
                var iframe = document.createElement("iframe");
                iframe.style.display = "none";
                iframe.onload = function () {
                    if (this.parentNode) {
                        this.parentNode.removeChild(this);
                    }
                };
                iframe.src = this.config.oauthURL.replace('oauth', 'logout');
                document.body.appendChild(iframe);
            }
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
        APIClient.prototype.me = function (callback) {
            this.request("GET", APIURL.USER_PROFILE, null, callback);
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
    CocoonSDK.APIClient = APIClient;
    var ProjectAPI = (function () {
        function ProjectAPI(client) {
            this.client = client;
        }
        ProjectAPI.prototype.createFromRepository = function (data, callback) {
            this.client.request("POST", APIURL.GITHUB_CREATE, { params: data }, function (response, error) {
                if (error) {
                    callback(null, error);
                }
                else {
                    callback(new CocoonSDK.Project(response, this.client), null);
                }
            });
        };
        ProjectAPI.prototype.createFromPublicZip = function (url, callback) {
            this.client.request("POST", APIURL.URL_CREATE, { params: { url: url } }, function (response, error) {
                if (error) {
                    callback(null, error);
                }
                else {
                    callback(new CocoonSDK.Project(response, this.client), null);
                }
            });
        };
        ProjectAPI.prototype.createFromZipUpload = function (file, callback) {
            var formData = new FormData();
            formData.append('file', file);
            var xhrOptions = {
                contentType: "multipart/form-data",
                params: formData
            };
            this.client.request("POST", APIURL.PROJECT, xhrOptions, function (response, error) {
                if (error) {
                    callback(null, error);
                }
                else {
                    callback(new CocoonSDK.Project(response, this.client), null);
                }
            });
        };
        ProjectAPI.prototype.get = function (projectId, callback) {
            this.client.request("GET", APIURL.PROJECT + projectId, null, function (response, error) {
                if (error) {
                    callback(null, error);
                }
                else {
                    callback(new CocoonSDK.Project(response, this.client), null);
                }
            });
        };
        ProjectAPI.prototype.delete = function (projectId, callback) {
            this.client.request("DELETE", "project/" + projectId, null, function (response, error) {
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
                        result.push(new CocoonSDK.Project(data[i], this.client));
                    }
                    callback(result, null);
                }
            });
        };
        ProjectAPI.prototype.compile = function (projectId, callback) {
            this.client.request("POST", APIURL.COMPILE(projectId), null, function (response, error) {
                if (callback) {
                    callback(error);
                }
            });
        };
        ProjectAPI.prototype.compileDevApp = function (projectId, callback) {
            this.client.request("POST", APIURL.DEVAPP(projectId), null, function (response, error) {
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
        ProjectAPI.prototype.uploadZip = function (projectId, file, callback) {
            var formData = new FormData();
            formData.append('file', file);
            var xhrOptions = {
                contentType: "multipart/form-data",
                params: formData
            };
            this.client.request("PUT", APIURL.PROJECT + projectId, xhrOptions, function (response, error) {
                if (callback) {
                    callback(response, error);
                }
            });
        };
        ProjectAPI.prototype.updatePublicZip = function (projectId, url, callback) {
            this.client.request("PUT", APIURL.URL_SYNC + projectId, { params: { url: url } }, function (response, error) {
                if (callback) {
                    callback(response, error);
                }
            });
        };
        ProjectAPI.prototype.syncRepository = function (projectId, repo, callback) {
            this.client.request("PUT", APIURL.GITHUB_SYNC + projectId, { params: repo }, function (response, error) {
                if (callback) {
                    callback(error);
                }
            });
        };
        return ProjectAPI;
    })();
    CocoonSDK.ProjectAPI = ProjectAPI;
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
})(CocoonSDK || (CocoonSDK = {}));
