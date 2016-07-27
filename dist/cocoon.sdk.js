var CocoonSDK;
(function (CocoonSDK) {
    'use strict';
    (function (Status) {
        Status[Status["Created"] = 'created'] = "Created";
        Status[Status["Waiting"] = 'waiting'] = "Waiting";
        Status[Status["Compiling"] = 'compiling'] = "Compiling";
        Status[Status["Completed"] = 'completed'] = "Completed";
        Status[Status["Disabled"] = 'disabled'] = "Disabled";
    })(CocoonSDK.Status || (CocoonSDK.Status = {}));
    var Status = CocoonSDK.Status;
    var Platform = (function () {
        function Platform() {
        }
        Platform.IOS = 'ios';
        Platform.ANDROID = 'android';
        Platform.platforms = [Platform.IOS, Platform.ANDROID];
        return Platform;
    }());
    CocoonSDK.Platform = Platform;
    var Compilation = (function () {
        function Compilation(platform, data) {
            this.platform = platform;
            this.data = data;
        }
        Compilation.prototype.isDevApp = function () {
            return this.data.devapp && this.data.devapp.length > 0 && this.data.devapp.indexOf(this.platform) >= 0;
        };
        Compilation.prototype.isReady = function () {
            return this.getStatus() === Status.Completed && !this.isErrored();
        };
        Compilation.prototype.isErrored = function () {
            return this.data.error && this.data.error.hasOwnProperty(this.platform);
        };
        Compilation.prototype.getError = function () {
            return this.isErrored() ? this.data.error[this.platform] : '';
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
            return '';
        };
        return Compilation;
    }());
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
            this.client.request('GET', 'project/' + this.data.id, null, function (response, error) {
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
                    setTimeout(_this.refreshUntilCompleted.bind(_this, callback), 20000);
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
                return compilation.getDownloadLink() + '?access_token=' + this.client.getAccessToken();
            }
            return '';
        };
        Project.prototype.delete = function (callback) {
            this.client.project.delete(this.data.id, callback);
        };
        return Project;
    }());
    CocoonSDK.Project = Project;
})(CocoonSDK || (CocoonSDK = {}));
var CocoonSDK;
(function (CocoonSDK) {
    'use strict';
})(CocoonSDK || (CocoonSDK = {}));
var CocoonSDK;
(function (CocoonSDK) {
    'use strict';
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
        APIURL.COMPILE = function (projectId) {
            return 'project/' + projectId + '/compile/';
        };
        APIURL.DEVAPP = function (projectId) {
            return 'project/' + projectId + '/devapp/';
        };
        APIURL.ICON = function (projectId, platform) {
            return 'project/' + projectId + '/icon/';
        };
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
    }());
    var APIClient = (function () {
        function APIClient(options) {
            if (!options || !options.clientId) {
                throw new Error('Missing parameter clientId');
            }
            this.config = {
                clientId: options.clientId,
                clientSecret: options.clientSecret,
                apiURL: options.apiURL || 'https://api.cocoon.io/v1/',
                oauthURL: options.oauthURL || 'https://cloud.cocoon.io/oauth/'
            };
            this.setOauthMode({ grantType: GrantType.Implicit });
            this.project = new ProjectAPI(this);
        }
        APIClient.prototype.setOauthMode = function (options) {
            this.oauthMode = options || { grantType: GrantType.Implicit };
            if (this.oauthMode.storageType === StorageType.Memory || typeof document === 'undefined') {
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
        APIClient.prototype.logInWithPassword = function (user, password, callback) {
            var _this = this;
            var url = this.config.oauthURL + 'access_token';
            var params = {
                client_id: this.config.clientId,
                client_secret: this.config.clientSecret,
                grant_type: 'password',
                username: user,
                password: password
            };
            callback = callback || function () {
            };
            this.request('POST', url, {
                params: params,
                contentType: 'application/x-www-form-urlencoded'
            }, function (response, error) {
                if (error) {
                    callback(false, error);
                }
                else if (response.access_token) {
                    _this.setAccessToken(response.access_token, response.expires_in);
                    callback(true, null);
                }
                else {
                    callback(false, { code: 0, message: 'No error but access_token not found in the response' });
                }
            });
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
            var windowOptions = 'width=' + w + ',height=' + h;
            windowOptions += ',toolbar=0,scrollbars=1,status=1,resizable=1,location=1,menuBar=0';
            windowOptions += ',left=' + left + ',top=' + top;
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
                window.addEventListener('message', getMessage, false);
            }
            else if (window.attachEvent) {
                window.attachEvent('onmessage', getMessage);
            }
            else if (document.attachEvent) {
                document.attachEvent('onmessage', getMessage);
            }
            var chrome = window.chrome;
            if (chrome && chrome.runtime && chrome.runtime.onMessageExternal) {
                chrome.runtime.onMessageExternal.addListener(function (request, sender, sendResponse) {
                    request.origin = sender.url.match(/^.{2,5}:\/\/[^\/]+/)[0];
                    return getMessage(request);
                });
            }
            var wnd = window.open(url, 'Authorization', windowOptions);
            function checkUrl() {
                if (tokenReceived) {
                    return true;
                }
                var url = wnd.location.href;
                if (url.indexOf(redirectUri) >= 0) {
                    var access_token = url.split('access_token=')[1];
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
                            callback(null, { message: 'The popup was closed', code: 0 });
                        }
                    }
                }, 100);
            }
            else {
                callback(null, { message: 'Cannot open window', code: 0 });
            }
        };
        APIClient.prototype.logout = function () {
            this.credentials.logout();
            if (typeof document !== 'undefined') {
                var iframe = document.createElement('iframe');
                iframe.style.display = 'none';
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
            var xhr;
            if (typeof XMLHttpRequest !== 'undefined') {
                xhr = new XMLHttpRequest();
            }
            else {
                xhr = new (require('xmlhttprequest').XMLHttpRequest);
            }
            var url = path;
            if (path.indexOf('://') < 0) {
                url = this.config.apiURL + path;
            }
            xhr.open(method || 'GET', url);
            xhr.setRequestHeader('Authorization', 'Bearer ' + this.credentials.getAccessToken());
            xhr.onerror = function () {
                if (callback) {
                    callback(null, { message: this.statusText || 'Error with status ' + this.status, code: this.status });
                }
            };
            xhr.onload = function () {
                if (callback) {
                    if (this.status < 200 || this.status >= 300) {
                        var errorMessage = { code: this.status, message: 'Error with code: ' + this.status };
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
                        callback(null, { message: 'Error parsing json: ' + ex, code: 0 });
                    }
                }
            };
            if (options && options.responseType) {
                xhr.responseType = options.responseType;
            }
            if (options && options.params) {
                if (options.contentType === 'multipart/form-data') {
                    xhr.send(options.params);
                }
                else if (options.contentType === 'application/x-www-form-urlencoded' && typeof options.params === 'object') {
                    xhr.setRequestHeader('Content-Type', options.contentType);
                    var sendData = '';
                    for (var key in options.params) {
                        if (options.params.hasOwnProperty(key)) {
                            if (sendData.length > 0) {
                                sendData += '&';
                            }
                            sendData += key + '=' + encodeURIComponent(options.params[key]);
                        }
                    }
                    xhr.send(sendData);
                }
                else if (options.contentType) {
                    xhr.setRequestHeader('Content-Type', options.contentType);
                    xhr.send(options.params);
                }
                else if (typeof options.params === 'object') {
                    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
                    xhr.send(JSON.stringify(options.params));
                }
            }
            else {
                xhr.send();
            }
        };
        APIClient.prototype.me = function (callback) {
            this.request('GET', APIURL.USER_PROFILE, null, callback);
        };
        APIClient.prototype.getLoginURL = function (redirect_uri) {
            var result = this.config.oauthURL + 'authorization?client_id=' + this.config.clientId;
            result += '&response_type=token';
            if (redirect_uri) {
                result += '&redirect_uri=' + encodeURI(redirect_uri);
            }
            return result;
        };
        return APIClient;
    }());
    CocoonSDK.APIClient = APIClient;
    var ProjectAPI = (function () {
        function ProjectAPI(client) {
            this.client = client;
        }
        ProjectAPI.prototype.createFromRepository = function (data, callback) {
            var _this = this;
            this.client.request('POST', APIURL.GITHUB_CREATE, { params: data }, function (response, error) {
                if (error) {
                    callback(null, error);
                }
                else {
                    callback(new CocoonSDK.Project(response, _this.client), null);
                }
            });
        };
        ProjectAPI.prototype.createFromPublicZip = function (url, callback) {
            var _this = this;
            this.client.request('POST', APIURL.URL_CREATE, { params: { url: url } }, function (response, error) {
                if (error) {
                    callback(null, error);
                }
                else {
                    callback(new CocoonSDK.Project(response, _this.client), null);
                }
            });
        };
        ProjectAPI.prototype.createFromZipUpload = function (file, callback) {
            var _this = this;
            var formData = typeof FormData !== 'undefined' ? new FormData() : new (require('form-data'));
            formData.append('file', file);
            var xhrOptions = {
                contentType: 'multipart/form-data',
                params: formData
            };
            this.client.request('POST', APIURL.PROJECT, xhrOptions, function (response, error) {
                if (error) {
                    callback(null, error);
                }
                else {
                    callback(new CocoonSDK.Project(response, _this.client), null);
                }
            });
        };
        ProjectAPI.prototype.get = function (projectId, callback) {
            var _this = this;
            this.client.request('GET', APIURL.PROJECT + projectId, null, function (response, error) {
                if (error) {
                    callback(null, error);
                }
                else {
                    callback(new CocoonSDK.Project(response, _this.client), null);
                }
            });
        };
        ProjectAPI.prototype.delete = function (projectId, callback) {
            this.client.request('DELETE', 'project/' + projectId, null, function (response, error) {
                if (callback) {
                    callback(error);
                }
            });
        };
        ProjectAPI.prototype.list = function (callback) {
            this.client.request('GET', 'project', null, function (response, error) {
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
            this.client.request('POST', APIURL.COMPILE(projectId), null, function (response, error) {
                if (callback) {
                    callback(error);
                }
            });
        };
        ProjectAPI.prototype.compileDevApp = function (projectId, callback) {
            this.client.request('POST', APIURL.DEVAPP(projectId), null, function (response, error) {
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
            this.client.request('GET', configURL, xhrOptions, function (response, error) {
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
            this.client.request('GET', APIURL.ICON(projectId, platform), xhrOptions, function (response, error) {
                callback(response, error);
            });
        };
        ProjectAPI.prototype.getIconSrc = function (projectId, platform) {
            return this.client.config.apiURL + APIURL.ICON(projectId, platform) + '?access_token=' + this.client.credentials.getAccessToken();
        };
        ProjectAPI.prototype.putConfigXml = function (configURL, xml, callback) {
            var formData = new FormData();
            var blob = new Blob([xml], { type: 'text/xml;charset=utf-8;' });
            formData.append('file', blob, 'config.xml');
            var xhrOptions = {
                contentType: 'multipart/form-data',
                params: formData
            };
            this.client.request('PUT', configURL, xhrOptions, function (response, error) {
                if (callback) {
                    callback(error);
                }
            });
        };
        ProjectAPI.prototype.uploadZip = function (projectId, file, callback) {
            if (typeof FormData !== 'undefined') {
                var formData = new FormData();
                formData.append('file', file);
                var xhrOptions = {
                    contentType: 'multipart/form-data',
                    params: formData
                };
                this.client.request('PUT', APIURL.PROJECT + projectId, xhrOptions, function (response, error) {
                    if (callback) {
                        callback(response, error);
                    }
                });
            }
            else {
                var url = require('url').parse(this.client.config.apiURL + APIURL.PROJECT + projectId);
                var form = new (require('form-data'));
                form.append('file', file);
                form.submit({
                    protocol: url.protocol,
                    method: 'put',
                    host: url.hostname,
                    path: url.path,
                    headers: { 'Authorization': 'Bearer ' + this.client.credentials.getAccessToken() }
                }, function (err, res) {
                    var data = '';
                    if (err) {
                        callback(null, { message: err.message, code: err.http_code });
                        return;
                    }
                    res.on('data', function (chunk) {
                        data += chunk;
                    });
                    res.on('end', function () {
                        try {
                            var result = JSON.parse(data);
                            if (res.statusCode < 200 || res.statusCode >= 300) {
                                var errorMessage = { code: res.statusCode, message: res.statusMessage };
                                if (result.description) {
                                    errorMessage = { code: result.code, message: result.description };
                                }
                                callback(null, errorMessage);
                            }
                            else {
                                callback(result, null);
                            }
                        }
                        catch (ex) {
                            callback(null, { code: 0, message: ex.message });
                        }
                    });
                });
            }
        };
        ProjectAPI.prototype.updatePublicZip = function (projectId, url, callback) {
            this.client.request('PUT', APIURL.URL_SYNC + projectId, { params: { url: url } }, function (response, error) {
                if (callback) {
                    callback(response, error);
                }
            });
        };
        ProjectAPI.prototype.syncRepository = function (projectId, repo, callback) {
            this.client.request('PUT', APIURL.GITHUB_SYNC + projectId, { params: repo }, function (response, error) {
                if (callback) {
                    callback(error);
                }
            });
        };
        return ProjectAPI;
    }());
    CocoonSDK.ProjectAPI = ProjectAPI;
    var MemoryCredentialStorage = (function () {
        function MemoryCredentialStorage() {
        }
        MemoryCredentialStorage.prototype.getAccessToken = function () {
            return this.access_token;
        };
        MemoryCredentialStorage.prototype.getRefreshToken = function () {
            return this.refresh_token;
        };
        MemoryCredentialStorage.prototype.setAccessToken = function (value, expires) {
            this.access_token = value;
            this.expires = expires;
        };
        MemoryCredentialStorage.prototype.setRefreshToken = function (value) {
            this.refresh_token = value;
        };
        MemoryCredentialStorage.prototype.logout = function () {
            this.access_token = null;
            this.refresh_token = null;
            this.expires = 0;
        };
        return MemoryCredentialStorage;
    }());
    var CookieCredentialStorage = (function () {
        function CookieCredentialStorage() {
        }
        CookieCredentialStorage.prototype.getAccessToken = function () {
            return CookieHelper.getItem('access_token');
        };
        CookieCredentialStorage.prototype.getRefreshToken = function () {
            return CookieHelper.getItem('refresh_token');
        };
        CookieCredentialStorage.prototype.setAccessToken = function (value, expires) {
            CookieHelper.setItem('access_token', value, expires || Infinity);
        };
        CookieCredentialStorage.prototype.setRefreshToken = function (value) {
            CookieHelper.setItem('access_token', value, Infinity);
        };
        CookieCredentialStorage.prototype.logout = function () {
            CookieHelper.removeItem('access_token');
            CookieHelper.removeItem('refresh_token');
        };
        return CookieCredentialStorage;
    }());
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
    }());
})(CocoonSDK || (CocoonSDK = {}));
if (typeof module !== 'undefined') {
    module.exports = CocoonSDK;
}
var CocoonSDK;
(function (CocoonSDK) {
    'use strict';
    var cocoonNS = 'http://cocoon.io/ns/1.0';
    var cordovaNS = 'http://cordova.apache.org/ns/1.0';
    var xmlnsNS = 'http://www.w3.org/2000/xmlns/';
    (function (Orientation) {
        Orientation[Orientation["PORTRAIT"] = 0] = "PORTRAIT";
        Orientation[Orientation["LANDSCAPE"] = 1] = "LANDSCAPE";
        Orientation[Orientation["BOTH"] = 2] = "BOTH";
        Orientation[Orientation["SYSTEM_DEFAULT"] = 3] = "SYSTEM_DEFAULT";
    })(CocoonSDK.Orientation || (CocoonSDK.Orientation = {}));
    var Orientation = CocoonSDK.Orientation;
    (function (Environment) {
        Environment[Environment["WEBVIEW"] = 0] = "WEBVIEW";
        Environment[Environment["WEBVIEW_PLUS"] = 1] = "WEBVIEW_PLUS";
        Environment[Environment["CANVAS_PLUS"] = 2] = "CANVAS_PLUS";
    })(CocoonSDK.Environment || (CocoonSDK.Environment = {}));
    var Environment = CocoonSDK.Environment;
    var XMLSugar = (function () {
        function XMLSugar(text) {
            var parser;
            if (typeof document !== 'undefined') {
                parser = new DOMParser();
                this.serializer = new XMLSerializer();
                this.document = document;
            }
            else {
                var xmldom = require('xmldom');
                parser = new xmldom.DOMParser();
                this.serializer = new xmldom.XMLSerializer();
                var dom = new xmldom.DOMImplementation();
                this.document = dom.createDocument();
            }
            this.doc = this.replaceOldSyntax(parser.parseFromString(text, 'text/xml'));
            var root = this.doc.getElementsByTagName('widget')[0];
            if (root && !root.getAttributeNS(xmlnsNS, 'cdv')) {
                root.setAttributeNS(xmlnsNS, 'xmlns:cdv', cordovaNS);
            }
            this.root = root;
        }
        XMLSugar.prototype.isErrored = function () {
            return this.doc.getElementsByTagName('parsererror').length > 0 || !this.root;
        };
        XMLSugar.prototype.xml = function () {
            var xml = this.serializer.serializeToString(this.doc);
            xml = xml.replace(/[ ]xmlns[=]["]["]/g, '');
            return this.formatXml(xml);
        };
        XMLSugar.prototype.formatXml = function (xml) {
            var reg = /(>)\s*(<)(\/*)/g;
            var wsexp = / *(.*) +\n/g;
            var contexp = /(<.+>)(.+\n)/g;
            xml = xml.replace(reg, '$1\n$2$3').replace(wsexp, '$1\n').replace(contexp, '$1\n$2');
            var formatted = '';
            var lines = xml.split('\n');
            var indent = 0;
            var lastType = 'other';
            var transitions = {
                'single->single': 0,
                'single->closing': -1,
                'single->opening': 0,
                'single->other': 0,
                'closing->single': 0,
                'closing->closing': -1,
                'closing->opening': 0,
                'closing->other': 0,
                'opening->single': 1,
                'opening->closing': 0,
                'opening->opening': 1,
                'opening->other': 1,
                'other->single': 0,
                'other->closing': -1,
                'other->opening': 0,
                'other->other': 0
            };
            for (var i = 0; i < lines.length; i++) {
                var ln = lines[i];
                var single = Boolean(ln.match(/<.+\/>/));
                var closing = Boolean(ln.match(/<\/.+>/));
                var opening = Boolean(ln.match(/<[^!].*>/));
                var type = single ? 'single' : closing ? 'closing' : opening ? 'opening' : 'other';
                var fromTo = lastType + '->' + type;
                lastType = type;
                var padding = '';
                indent += transitions[fromTo];
                for (var j = 0; j < indent; j++) {
                    padding += '\t';
                }
                if (fromTo === 'opening->closing') {
                    formatted = formatted.substr(0, formatted.length - 1) + ln + '\n';
                }
                else {
                    formatted += padding + ln + '\n';
                }
            }
            return formatted;
        };
        XMLSugar.prototype.getBundleId = function (platform, fallback) {
            if (platform) {
                var name = bundleIdAliases[platform];
                var value = this.root.getAttribute(name);
                if (value) {
                    return value;
                }
                else if (!fallback) {
                    return '';
                }
            }
            return this.root.getAttribute('id');
        };
        XMLSugar.prototype.getVersion = function (platform, fallback) {
            if (platform) {
                var version = this.root.getAttribute(platform + '-version');
                if (version) {
                    return version;
                }
                else if (fallback) {
                    this.getVersion(null);
                }
                else {
                    return '';
                }
            }
            return this.root.getAttribute('version');
        };
        XMLSugar.prototype.getVersionCode = function (platform, fallback) {
            if (platform) {
                var name = versionCodeAliases[platform];
                if (name) {
                    var version = this.root.getAttribute(name);
                    if (version) {
                        return version;
                    }
                    else if (!fallback || platform === 'android') {
                        return '';
                    }
                    else {
                        this.getVersion(platform);
                    }
                }
            }
            return this.root.getAttribute('version');
        };
        XMLSugar.prototype.setBundleId = function (value, platform) {
            if (platform) {
                var name = bundleIdAliases[platform];
                if (name) {
                    if (value) {
                        this.root.setAttribute(name, value);
                    }
                    else {
                        this.root.removeAttribute(name);
                    }
                    return;
                }
            }
            return this.root.setAttribute('id', value);
        };
        XMLSugar.prototype.setVersion = function (value, platform) {
            if (platform) {
                var name = platform + '-version';
                if (name) {
                    if (value) {
                        this.root.setAttribute(name, value);
                    }
                    else {
                        this.root.removeAttribute(name);
                    }
                    return;
                }
            }
            return this.root.setAttribute('version', value);
        };
        XMLSugar.prototype.setVersionCode = function (value, platform) {
            if (platform) {
                var name = versionCodeAliases[platform];
                if (name) {
                    if (value) {
                        this.root.setAttribute(name, value);
                    }
                    else {
                        this.root.removeAttribute(name);
                    }
                    return;
                }
            }
            return this.root.setAttribute('version', value);
        };
        XMLSugar.prototype.getNode = function (tagName, platform, fallback) {
            return findNode(this, {
                tag: tagName,
                platform: platform,
                fallback: fallback
            });
        };
        XMLSugar.prototype.getValue = function (tagName, platform, fallback) {
            var node = this.getNode(tagName, platform, fallback);
            return node ? node.textContent : null;
        };
        XMLSugar.prototype.getNodeValue = function (tagName, platform, fallback) {
            return this.getNode(tagName, platform, fallback);
        };
        XMLSugar.prototype.setValue = function (tagName, value, platform) {
            updateOrAddNode(this, {
                platform: platform,
                tag: tagName
            }, {
                value: value
            });
        };
        XMLSugar.prototype.removeValue = function (tagName, platform) {
            removeNode(this, {
                tag: tagName,
                platform: platform
            });
        };
        XMLSugar.prototype.getPreference = function (name, platform, fallback) {
            var filter = {
                tag: 'preference',
                platform: platform,
                attributes: [
                    { name: 'name', value: name }
                ],
                fallback: fallback
            };
            var node = findNode(this, filter);
            return node ? node.getAttribute('value') : null;
        };
        XMLSugar.prototype.setPreference = function (name, value, platform) {
            var filter = {
                tag: 'preference',
                platform: platform,
                attributes: [
                    { name: 'name', value: name }
                ]
            };
            if (value) {
                var update = {
                    attributes: [
                        { name: 'name', value: name },
                        { name: 'value', value: value }
                    ]
                };
                updateOrAddNode(this, filter, update);
            }
            else {
                removeNode(this, filter);
            }
        };
        XMLSugar.prototype.getCocoonVersion = function () {
            return this.getPreference('cocoon-version');
        };
        XMLSugar.prototype.setCocoonVersion = function (version) {
            this.setPreference('cocoon-version', version);
        };
        XMLSugar.prototype.getOrientation = function (platform, fallback) {
            var value = this.getPreference('Orientation', platform, fallback);
            if (!value) {
                return Orientation.SYSTEM_DEFAULT;
            }
            else if (value === 'portrait') {
                return Orientation.PORTRAIT;
            }
            else if (value === 'landscape') {
                return Orientation.LANDSCAPE;
            }
            else {
                return Orientation.BOTH;
            }
        };
        XMLSugar.prototype.setOrientation = function (value, platform) {
            var cordovaValue = null;
            if (value === Orientation.PORTRAIT) {
                cordovaValue = 'portrait';
            }
            else if (value === Orientation.LANDSCAPE) {
                cordovaValue = 'landscape';
            }
            else if (value === Orientation.BOTH) {
                cordovaValue = 'default';
            }
            this.setPreference('Orientation', cordovaValue, platform);
        };
        XMLSugar.prototype.isFullScreen = function (platform, fallback) {
            var value = this.getPreference('Fullscreen', platform, fallback);
            return value ? value !== 'false' : false;
        };
        XMLSugar.prototype.setFullScreen = function (value, platform) {
            this.setPreference('Fullscreen', value === null ? null : (!!value).toString(), platform);
        };
        XMLSugar.prototype.getCocoonPlatform = function (platform) {
            var filter = {
                tag: 'platform',
                attributes: [
                    { name: 'name', value: platform }
                ]
            };
            return findNode(this, filter);
        };
        XMLSugar.prototype.getCocoonEngine = function (platform) {
            var filter = {
                tag: 'engine',
                attributes: [
                    { name: 'name', value: platform }
                ]
            };
            return findNode(this, filter);
        };
        XMLSugar.prototype.getCocoonPlatformVersion = function (platform) {
            return this.getCocoonEngineSpec(platform);
        };
        XMLSugar.prototype.getCocoonEngineSpec = function (platform) {
            var node = this.getCocoonEngine(platform);
            return node ? node.getAttribute('spec') : null;
        };
        XMLSugar.prototype.setCocoonPlatformVersion = function (platform, value) {
            this.setCocoonEngineSpec(platform, value);
        };
        XMLSugar.prototype.setCocoonEngineSpec = function (platform, spec) {
            if (spec === void 0) { spec = '*'; }
            var filter = {
                tag: 'engine',
                attributes: [
                    { name: 'name', value: platform }
                ]
            };
            var update = {
                attributes: [
                    { name: 'name', value: platform },
                    { name: 'spec', value: spec }
                ]
            };
            updateOrAddNode(this, filter, update);
        };
        XMLSugar.prototype.isCocoonPlatformEnabled = function (platform) {
            var preference = this.getPreference('enabled', platform);
            return !(preference === 'false');
        };
        XMLSugar.prototype.setCocoonPlatformEnabled = function (platform, enabled) {
            this.setPreference('enabled', enabled ? null : 'false', platform);
        };
        XMLSugar.prototype.getContentURL = function (platform, fallback) {
            var filter = {
                tag: 'content',
                platform: platform,
                fallback: fallback
            };
            var node = findNode(this, filter);
            return node ? node.getAttribute('src') : '';
        };
        XMLSugar.prototype.setContentURL = function (value, platform) {
            var filter = {
                tag: 'content',
                platform: platform
            };
            if (value) {
                var update = {
                    attributes: [
                        { name: 'src', value: value }
                    ]
                };
                updateOrAddNode(this, filter, update);
            }
            else {
                removeNode(this, filter);
            }
        };
        XMLSugar.prototype.addPlugin = function (name, spec) {
            if (spec === void 0) { spec = '*'; }
            var filter = {
                tag: 'plugin',
                attributes: [
                    { name: 'name', value: name }
                ]
            };
            var update = {
                attributes: [
                    { name: 'name', value: name },
                    { name: 'spec', value: spec }
                ]
            };
            updateOrAddNode(this, filter, update);
        };
        XMLSugar.prototype.removePlugin = function (name) {
            var filter = {
                tag: 'plugin',
                attributes: [
                    { name: 'name', value: name }
                ]
            };
            removeNode(this, filter);
        };
        XMLSugar.prototype.findPlugin = function (name) {
            var filter = {
                tag: 'plugin',
                attributes: [
                    { name: 'name', value: name }
                ]
            };
            return findNode(this, filter);
        };
        XMLSugar.prototype.findAllPlugins = function () {
            var filter = {
                tag: 'plugin'
            };
            return findNodes(this, filter);
        };
        XMLSugar.prototype.findPluginParameter = function (pluginName, paramName) {
            return this.findPluginVariable(pluginName, paramName);
        };
        XMLSugar.prototype.findPluginVariable = function (pluginName, varName) {
            var plugin = this.findPlugin(pluginName);
            var result = null;
            if (plugin) {
                var nodes = plugin.childNodes;
                for (var i = 0; i < nodes.length; ++i) {
                    if (nodes[i].nodeType === 1 && nodes[i].getAttribute('name') === varName) {
                        result = this.decode(nodes[i].getAttribute('value')) || '';
                        break;
                    }
                }
            }
            return result;
        };
        XMLSugar.prototype.getPluginVariables = function (pluginName) {
            var plugin = this.findPlugin(pluginName);
            return plugin ? plugin.getElementsByTagName('variable') : null;
        };
        XMLSugar.prototype.addPluginParameter = function (pluginName, paramName, paramValue) {
            this.addPluginVariable(pluginName, paramName, paramValue);
        };
        XMLSugar.prototype.addPluginVariable = function (pluginName, varName, varValue) {
            this.addPlugin(pluginName);
            var plugin = this.findPlugin(pluginName);
            if (plugin) {
                var nodes = plugin.childNodes;
                var node = null;
                for (var i = 0; i < nodes.length; ++i) {
                    if (nodes[i].nodeType === 1 && nodes[i].getAttribute('name') === varName) {
                        node = nodes[i];
                        break;
                    }
                }
                if (!node) {
                    node = this.document.createElementNS(null, 'variable');
                    node.setAttribute('name', varName || '');
                    addNodeIndented(this, node, plugin);
                }
                node.setAttribute('value', this.encode(varValue) || '');
            }
        };
        XMLSugar.prototype.getEnvironment = function (platform) {
            if (!platform) {
                var envs = [this.getEnvironment('ios'), this.getEnvironment('android')];
                for (var j = 1; j < envs.length; ++j) {
                    if (envs[j] !== envs[j - 1]) {
                        return Environment.WEBVIEW;
                    }
                }
                return envs[0];
            }
            var infos = [canvasPlusPlugins, webviewPlusPlugins];
            var env = Environment.WEBVIEW;
            for (var i = 0; i < infos.length; ++i) {
                var info = infos[i][platform];
                if (info) {
                    var plugin = this.findPlugin(info.plugin);
                    if (plugin) {
                        env = infos[i].value;
                    }
                }
            }
            return env;
        };
        XMLSugar.prototype.setEnvironment = function (value, platform) {
            var names = platform ? [platform] : ['ios', 'android'];
            for (var i = 0; i < names.length; ++i) {
                var name = names[i];
                var info;
                if (value === Environment.CANVAS_PLUS) {
                    info = canvasPlusPlugins[name];
                    if (info) {
                        this.addPlugin(info.plugin);
                        this.removePlugin(webviewPlusPlugins[name].plugin);
                    }
                }
                else if (value === Environment.WEBVIEW_PLUS) {
                    info = webviewPlusPlugins[name];
                    if (info) {
                        this.addPlugin(info.plugin);
                        this.removePlugin(canvasPlusPlugins[name].plugin);
                    }
                }
                else {
                    var infos = [canvasPlusPlugins, webviewPlusPlugins];
                    for (var j = 0; j < infos.length; ++j) {
                        info = infos[j][name];
                        if (!info) {
                            continue;
                        }
                        this.removePlugin(info.plugin);
                    }
                }
            }
        };
        XMLSugar.prototype.encode = function (str) {
            if (!str) {
                return str;
            }
            return str.replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&apos;');
        };
        XMLSugar.prototype.decode = function (str) {
            if (!str) {
                return str;
            }
            return str.replace(/&apos;/g, '\'')
                .replace(/&quot;/g, '"')
                .replace(/&gt;/g, '>')
                .replace(/&lt;/g, '<')
                .replace(/&amp;/g, '&');
        };
        XMLSugar.prototype.replaceOldSyntax = function (doc) {
            var newDoc = this.replaceOldPlatformSyntax(doc);
            newDoc = this.replaceOldPluginSyntax(newDoc);
            return newDoc;
        };
        XMLSugar.prototype.replaceOldPlatformSyntax = function (doc) {
            var platforms = doc.getElementsByTagNameNS(cocoonNS, 'platform');
            for (var i = platforms.length - 1; i >= 0; i--) {
                var platform = doc.createElementNS(null, 'platform');
                platform.setAttribute('name', platforms[i].getAttribute('name'));
                if (platforms[i].getAttribute('version')) {
                    var engine = doc.createElementNS(null, 'engine');
                    engine.setAttribute('spec', platforms[i].getAttribute('version'));
                    platforms[i].parentNode.insertBefore(engine, platforms[i]);
                }
                var childs = platforms[i].childNodes;
                for (var j = childs.length - 1; j >= 0; j--) {
                    if (childs[j].nodeType === 1) {
                        platform.appendChild(childs[j]);
                    }
                }
                if (platforms[i].getAttribute('enabled')) {
                    var preference = doc.createElementNS(null, 'preference');
                    preference.setAttribute('name', 'enabled');
                    preference.setAttribute('value', platforms[i].getAttribute('enabled'));
                    platform.appendChild(preference);
                }
                platforms[i].parentNode.insertBefore(platform, platforms[i]);
                platforms[i].parentNode.removeChild(platforms[i]);
            }
            return doc;
        };
        XMLSugar.prototype.replaceOldPluginSyntax = function (doc) {
            var plugins = doc.getElementsByTagNameNS(cocoonNS, 'plugin');
            for (var i = plugins.length - 1; i >= 0; i--) {
                var plugin = doc.createElementNS(null, 'plugin');
                plugin.setAttribute('name', plugins[i].getAttribute('name'));
                if (plugins[i].getAttribute('version')) {
                    plugin.setAttribute('spec', plugins[i].getAttribute('version'));
                }
                var childs = plugins[i].childNodes;
                for (var j = childs.length - 1; j >= 0; j--) {
                    if (childs[j].nodeName.toUpperCase() === 'PARAM') {
                        var variable = doc.createElementNS(null, 'variable');
                        variable.setAttribute('name', childs[j].getAttribute('name'));
                        variable.setAttribute('value', childs[j].getAttribute('value'));
                        plugin.appendChild(variable);
                    }
                }
                plugins[i].parentNode.insertBefore(plugin, plugins[i]);
                plugins[i].parentNode.removeChild(plugins[i]);
            }
            return doc;
        };
        return XMLSugar;
    }());
    CocoonSDK.XMLSugar = XMLSugar;
    var canvasPlusPlugins = {
        value: Environment.CANVAS_PLUS,
        ios: {
            plugin: 'com.ludei.canvasplus.ios'
        },
        android: {
            plugin: 'com.ludei.canvasplus.android'
        }
    };
    var webviewPlusPlugins = {
        value: Environment.WEBVIEW_PLUS,
        ios: {
            plugin: 'com.ludei.webviewplus.ios'
        },
        android: {
            plugin: 'com.ludei.webviewplus.android'
        }
    };
    var bundleIdAliases = {
        android: 'android-packageName',
        ios: 'ios-CFBundleIdentifier',
        osx: 'osx-tmpPlaceholder',
        ubuntu: 'ubuntu-tmpPlaceholder',
        windows: 'windows-tmpPlaceholder'
    };
    var versionCodeAliases = {
        android: 'android-versionCode',
        ios: 'ios-CFBundleVersion',
        osx: 'osx-CFBundleVersion',
        ubuntu: 'ubuntu-tmpVersionPlaceholder',
        windows: 'windows-packageVersion'
    };
    function matchesFilter(sugar, node, filter) {
        filter = filter || {};
        var parent = node.parentNode;
        if (filter.platform) {
            if (parent.tagName !== 'platform' || parent.getAttribute && parent.getAttribute('name') !== filter.platform) {
                return false;
            }
        }
        else if (parent !== sugar.root) {
            return false;
        }
        if (filter.tag && filter.tag !== node.tagName && filter.tag.indexOf('*') < 0) {
            return false;
        }
        if (filter.attributes) {
            for (var i = 0; i < filter.attributes.length; ++i) {
                var attr = filter.attributes[i];
                if (node.getAttribute(attr.name) !== attr.value) {
                    return false;
                }
            }
        }
        return true;
    }
    function hasNS(tag) {
        return tag.indexOf(':') !== -1;
    }
    function cleanNS(tag) {
        if (!tag) {
            return null;
        }
        var nsIndex = tag.indexOf(':');
        if (nsIndex >= 0) {
            return tag.slice(nsIndex + 1);
        }
        return tag;
    }
    function getElements(sugar, filter) {
        return sugar.doc.getElementsByTagName(filter.tag || '*');
    }
    function findNode(sugar, filter) {
        filter = filter || {};
        var nodes = getElements(sugar, filter);
        for (var i = 0; i < nodes.length; ++i) {
            if (matchesFilter(sugar, nodes[i], filter)) {
                return nodes[i];
            }
        }
        if (filter.platform && filter.fallback) {
            delete filter.platform;
            return findNode(sugar, filter);
        }
        return null;
    }
    function findNodes(doc, filter) {
        filter = filter || {};
        var nodes = getElements(doc, filter);
        var result = [];
        for (var i = 0; i < nodes.length; ++i) {
            if (matchesFilter(doc, nodes[i], filter)) {
                result.push(nodes[i]);
            }
        }
        return result;
    }
    function addNodeIndented(sugar, node, parent) {
        parent.appendChild(sugar.document.createTextNode('\n'));
        var p = parent.parentNode;
        do {
            parent.appendChild(sugar.document.createTextNode('    '));
            p = p.parentNode;
        } while (!!p);
        parent.appendChild(node);
        node.setAttribute('xmlns', '');
        parent.appendChild(sugar.document.createTextNode('\n'));
    }
    function parentNodeForPlatform(sugar, platform) {
        if (!platform) {
            return sugar.root;
        }
        var platformNode = findNode(sugar, {
            tag: 'platform',
            attributes: [
                { name: 'name', value: platform }
            ]
        });
        if (!platformNode) {
            platformNode = sugar.document.createElementNS(null, 'platform');
            platformNode.setAttribute('name', platform);
            addNodeIndented(sugar, platformNode, sugar.root);
        }
        return platformNode;
    }
    function updateOrAddNode(sugar, filter, data) {
        filter = filter || {};
        var found = findNode(sugar, filter);
        if (!found) {
            var parent = parentNodeForPlatform(sugar, filter.platform);
            found = sugar.document.createElementNS(null, filter.tag);
            addNodeIndented(sugar, found, parent);
        }
        if (typeof data.value !== 'undefined') {
            found.textContent = data.value || '';
        }
        if (data.attributes) {
            for (var i = 0; i < data.attributes.length; ++i) {
                var attr = data.attributes[i];
                if (attr.value === null) {
                    found.removeAttribute(attr.name);
                }
                else {
                    found.setAttribute(attr.name, attr.value);
                }
            }
        }
    }
    function removeNode(sugar, filter) {
        var node = findNode(sugar, filter);
        if (node && node.parentNode) {
            var parent = node.parentNode;
            parent.removeChild(node);
            if (parent.tagName === 'platform' && parent.parentNode) {
                var children = parent.childNodes;
                for (var i = 0; i < children.length; ++i) {
                    if (children[i].nodeType !== 3) {
                        return;
                    }
                }
                parent.parentNode.removeChild(parent);
            }
        }
    }
})(CocoonSDK || (CocoonSDK = {}));
//# sourceMappingURL=cocoon.sdk.js.map