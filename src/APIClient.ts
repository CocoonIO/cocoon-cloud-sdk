/// <reference path="User.ts"/>

module CocoonSDK {
    export enum GrantType {Implicit = 0, AuthorizationCode = 1}
    export enum StorageType {Cookies = 0, Memory = 1}
    export interface OauthMode {
        grantType: GrantType,
        storageType?: StorageType,
        customServer?: string,
    }

    export interface Credentials {
        accessToken:string,
        refreshToken:string
    }

    export interface Error {
        message: string,
        code: number
    }


    export interface Configuration {
        clientId: string,
        clientSecret:string,
        apiURL:string,
        oauthURL:string
    }

    export interface RequestXHROptions {
        responseType?:string,
        contentType?:string,
        transform?:(xhr:XMLHttpRequest) => any
        params?:any
    }

    export interface RepositoryData {
        url: string,
        branch?: string
    }

    declare var require: any;

    class APIURL {
        static PROJECT = 'project/';
        static USER_PROFILE = 'me/';
        static COMPILE(projectId:string) { return 'project/' + projectId + '/compile/';}
        static DEVAPP(projectId:string) { return 'project/' + projectId + '/devapp/';}
        static SINGNING_KEY = 'signkey/';
        static GITHUB_CREATE = 'project/github/';
        static GITHUB_SYNC = 'github/';
        static URL_CREATE = 'project/url/';
        static URL_SYNC = 'url/';
        static COCOON_TEMPLATES = 'cocoon/templates/';
        static COCOON_VERSIONS = 'cocoon/versions/';
        static ICON(projectId:string, platform?:string): string {return 'project/' + projectId + '/icon/'}
        static SPLASH = 'splash/';
    }

    export class APIClient {

        config: Configuration;
        oauthMode: OauthMode;
        credentials: CredentialStorage;
        project: ProjectAPI;

        constructor(options : {clientId:string, clientSecret?:string, apiURL?:string, oauthURL?:string}) {
            if (!options || !options.clientId) {
                throw new Error("Missing parameter clientId");
            }

            this.config = {
                clientId: options.clientId,
                clientSecret: options.clientSecret,
                apiURL: options.apiURL || "https://api.cocoon.io/v1/",
                oauthURL: options.oauthURL || "https://cloud.cocoon.io/oauth/"
            };
            this.setOauthMode({grantType: GrantType.Implicit});
            this.project = new ProjectAPI(this);
        }

        setOauthMode(options: OauthMode) {
            this.oauthMode = options || {grantType: GrantType.Implicit};
            if (this.oauthMode.storageType === StorageType.Memory || typeof document === 'undefined') {
                this.credentials = new MemoryCredentialStorage();
            }
            else {
                this.credentials = new CookieCredentialStorage();
            }
        }

        setAccessToken(token:string, expires?:number) {
            this.credentials.setAccessToken(token, expires);
        }

        getAccessToken(): string {
            return this.credentials.getAccessToken();
        }

        isLoggedIn(): boolean {
            return !!this.getAccessToken();
        }


        logInWithPassword(user:string, password:string, callback?:(loggedIn:boolean, error:Error)=> void) {
            var url =  this.config.oauthURL + "access_token";
            var params = {
                client_id: this.config.clientId,
                client_secret: this.config.clientSecret,
                grant_type: 'password',
                username: user,
                password: password
            };
            callback = callback || function(){};
            this.request("POST", url, {params:params, contentType:"application/x-www-form-urlencoded"}, (response:any, error:Error) => {

                if (error) {
                    callback(false, error);
                }
                else if (response.access_token) {
                    this.setAccessToken(response.access_token, response.expires_in);
                    callback(true, null);
                }
                else {
                    callback(false, {code:0, message:"No error but access_token not found in the response"});
                }
            });
        }

        logIn(options: {width?:number, height?:number, redirectUri?:string},
                              callback: (accessToken?:string, error?: Error)=>void) {

            if (!options) {
                options = {};
            }
            var redirectUri = options.redirectUri || window.location.href;
            var url = this.getLoginURL(redirectUri);

            var w: number, h:number;
            if (options.width && options.height) {
                w = options.width;
                h = options.height;
            }
            else {
                w =  Math.min(Math.floor(window.outerWidth * 0.8), 1000);
                h =  Math.min(Math.floor(window.outerHeight * 0.5), 630);
            }

            var left = Math.floor(window.screenX + (window.outerWidth - w) / 2);
            var top = Math.floor(window.screenY + (window.outerHeight - h) / 8);
            var windowOptions = "width=" + w + ",height=" + h;
            windowOptions += ",toolbar=0,scrollbars=1,status=1,resizable=1,location=1,menuBar=0";
            windowOptions += ",left=" + left + ",top=" + top;

            var tokenReceived = false;

            var me = this;
            function processToken(accessToken:string) {
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


            var getMessage = (e:any) => {
                if (!tokenReceived) {
                    if (e.origin !== this.config.oauthURL) {
                        return;
                    }
                    processToken(e.data);
                }
            };
            if (window.addEventListener) {
                window.addEventListener("message", getMessage, false);
            }
            else if ((<any>window).attachEvent) {
                (<any>window).attachEvent("onmessage", getMessage);
            } else if ((<any>document).attachEvent) {
                (<any>document).attachEvent("onmessage", getMessage);
            }

            var chrome = (<any>window).chrome;
            if (chrome && chrome.runtime && chrome.runtime.onMessageExternal) {
                chrome.runtime.onMessageExternal.addListener(function(request:any, sender:any, sendResponse:any) {
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
                wnd.onload =  (e:any) => {
                    checkUrl();
                };
                wnd.focus();
                var interval = window.setInterval(function() {

                    if (checkUrl() || wnd === null || wnd.closed) {
                        window.clearInterval(interval);
                        if (!tokenReceived) {
                            callback(null, {message: "The popup was closed", code:0});
                        }
                    }
                }, 100);
            }
            else {
                callback(null, {message: "Cannot open window", code:0});
            }

        }

        logout() {
            this.credentials.logout();
            if (typeof document !== 'undefined') {
                var iframe = document.createElement("iframe");
                iframe.style.display = "none";
                iframe.onload = function() {
                    if (this.parentNode) {
                        this.parentNode.removeChild(this);
                    }
                };
                iframe.src = this.config.oauthURL.replace('oauth', 'logout');
                document.body.appendChild(iframe);
            }
        }

        request(method:string, path:string, options:RequestXHROptions,  callback?:(response:any, error:Error)=> void) {
            var xhr:XMLHttpRequest;
            if (typeof XMLHttpRequest !== 'undefined'){
                xhr = new XMLHttpRequest();
            }
            else { //Node.js support
                xhr = new (require("xmlhttprequest").XMLHttpRequest);
            }

            var url = path;
            if (path.indexOf('://') < 0) {
                url = this.config.apiURL + path;
            }

            xhr.open(method || "GET", url);
            xhr.setRequestHeader("Authorization", "Bearer " + this.credentials.getAccessToken());
            xhr.onerror = function() {
                if (callback) {
                    callback(null, {message: this.statusText || 'Error with status ' + this.status, code: this.status})
                }
            };

            xhr.onload = function() {
                if (callback) {
                    if (this.status < 200 || this.status >=300) {

                        var errorMessage = {code:this.status, message: "Error with code: " + this.status};
                        try {
                            data = JSON.parse(this.responseText);
                            if (data.description) {
                                errorMessage = {code:data.code, message:data.description};
                            }
                        }
                        catch(ex) {

                        }

                        callback(null, errorMessage);
                        return;
                    }
                    try{
                        var data: any;
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
                        callback(null, {message: "Error parsing json: " + ex, code: 0});
                    }
                }
            };
            if (options && options.responseType) {
                xhr.responseType = options.responseType;
            }
            if (options && options.params) {
                if (options.contentType === "multipart/form-data") {
                    xhr.send(options.params); //the browser adds a boundary + the contentType
                }
                else if (options.contentType === "application/x-www-form-urlencoded" && typeof options.params === "object") {
                    xhr.setRequestHeader("Content-Type", options.contentType);
                    var sendData = "";
                    for (var key in options.params) {
                        if (options.params.hasOwnProperty(key)) {
                            if (sendData.length > 0) {
                                sendData += "&";
                            }
                            sendData += key + '=' + encodeURIComponent(options.params[key]);
                        }
                    }
                    xhr.send(sendData);
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
        }

        me(callback:(me:UserData, error:Error) => void) {
            this.request("GET", APIURL.USER_PROFILE, null, callback);
        }


        private getLoginURL(redirect_uri:string): string {
            var result = this.config.oauthURL + "authorization?client_id=" + this.config.clientId;
            result += "&response_type=token";
            if (redirect_uri) {
                result+= "&redirect_uri=" + encodeURI(redirect_uri);
            }
            return result;
        }
    }

    export class ProjectAPI {
        client: APIClient;
        constructor(client: APIClient) {
            this.client = client;
        }


        createFromRepository(data: RepositoryData, callback:(project:Project, error:Error) => void) {
            this.client.request("POST", APIURL.GITHUB_CREATE, {params:data} , (response:any, error:Error) => {
                if (error) {
                    callback(null, error)
                }
                else {
                    callback(new Project(response as ProjectData, this.client), null)
                }
            });
        }

        createFromPublicZip(url: string, callback:(project:Project, error:Error) => void) {
            this.client.request("POST", APIURL.URL_CREATE, {params:{url:url}} , (response:any, error:Error) => {
                if (error) {
                    callback(null, error)
                }
                else {
                    callback(new Project(response as ProjectData, this.client), null)
                }
            });
        }

        createFromZipUpload(file:File, callback:(project:Project, error:Error) => void) {
            var formData = typeof FormData !== 'undefined' ? new FormData() : new (require('form-data'));
            formData.append('file', file);

            var xhrOptions = {
                contentType: "multipart/form-data",
                params: formData
            };

            this.client.request("POST", APIURL.PROJECT, xhrOptions, (response:any, error:Error) => {
                if (error) {
                    callback(null, error)
                }
                else {
                    callback(new Project(response as ProjectData, this.client), null)
                }
            });
        }

        get(projectId:string, callback:(project: Project, error: Error) => void) {
            this.client.request("GET", APIURL.PROJECT + projectId, null, (response:any, error:Error) =>{
                if (error) {
                    callback(null, error)
                }
                else {
                    callback(new Project(response as ProjectData, this.client), null)
                }
            });
        }

        delete(projectId: string, callback:(error:Error) => void)  {
            this.client.request("DELETE", "project/" + projectId, null, (response:any, error:Error) => {
                if (callback) {
                    callback(error);
                }
            })

        }

        list(callback:(projects: Project[], error:Error) => void) {
            this.client.request("GET", "project", null, function(response: ProjectData[], error: Error){
                if (error) {
                    callback(null, error);
                }
                else {
                    var data:ProjectData[] = response || [];
                    var result:Project[] = [];
                    for (var i = 0; i < data.length; ++i) {
                        result.push(new Project(data[i], this.client));
                    }
                    callback(result, null);
                }
            });
        }

        compile(projectId: string, callback:(error:Error) => void) {
            this.client.request("POST", APIURL.COMPILE(projectId), null, (response:any, error:Error) => {
                if (callback) {
                    callback(error);
                }
            });
        }

        compileDevApp(projectId: string, callback:(error:Error) => void) {
            this.client.request("POST", APIURL.DEVAPP(projectId), null, (response:any, error:Error) => {
                if (callback) {
                    callback(error);
                }
            });
        }

        getConfigXml(configURL: string, callback:(xml:string, error:Error) => void) {

            var xhrOptions = {
                transform: function(xhr: XMLHttpRequest) {
                    return xhr.responseText;
                }
            };
            this.client.request("GET", configURL, xhrOptions, (response:string, error:Error) => {
                callback(response, error);
            });
        }

        getIconBlob(projectId: string, platform:string, callback:(data:Blob, error:Error) => void){
            var xhrOptions = {
                responseType: 'blob',
                transform: function(xhr: XMLHttpRequest) {
                    return xhr.response;
                }
            };
            this.client.request("GET", APIURL.ICON(projectId, platform), xhrOptions, (response:Blob, error:Error) => {
                callback(response, error);
            });
        }

        getIconSrc(projectId: string, platform:string) {
            return this.client.config.apiURL + APIURL.ICON(projectId, platform) + '?access_token=' + this.client.credentials.getAccessToken();
        }

        putConfigXml(configURL: string, xml:string, callback:( error:Error) => void) {

            var formData = new FormData();
            var blob = new Blob([xml], {type: 'text/xml;charset=utf-8;'});
            formData.append('file', blob, "config.xml");

            var xhrOptions = {
                contentType: "multipart/form-data",
                params: formData
            };

            this.client.request("PUT", configURL, xhrOptions, (response:string, error:Error) => {
                if (callback) {
                    callback(error);
                }
            });
        }


        uploadZip(projectId: string, file:File, callback:(data: ProjectData, error:Error) => void) {
            if (typeof FormData !== 'undefined') {
                var formData = new FormData();
                formData.append('file', file);

                var xhrOptions = {
                    contentType: "multipart/form-data",
                    params: formData
                };

                this.client.request("PUT", APIURL.PROJECT + projectId, xhrOptions, (response:ProjectData, error:Error) =>{
                    if (callback) {
                        callback(response, error);
                    }
                });
            }
            else { //node.js compatibility. //TODO: move to generic request code
                var url = require("url").parse(this.client.config.apiURL + APIURL.PROJECT + projectId);
                var form = new (require('form-data'));
                form.append('file', file); //created with fs.createReadStream

                form.submit({
                    protocol: url.protocol,
                    method: "put",
                    host: url.hostname,
                    path: url.path,
                    headers: {'Authorization': 'Bearer ' + this.client.credentials.getAccessToken()}
                }, function(err:any, res:any) {
                    var data = '';
                    if (err) {
                        callback(null, {message:err.message, code: err.http_code});
                        return;
                    }
                    res.on('data', function(chunk: any) {
                        data += chunk;
                    });
                    res.on('end', function() {
                        try {
                            var result = JSON.parse(data);
                            if (res.statusCode < 200 || res.statusCode >=300) {
                                var errorMessage = {code: res.statusCode, message: res.statusMessage};
                                if (result.description) {
                                    errorMessage = {code: result.code, message: result.description};
                                }
                                callback(null, errorMessage);
                            }
                            else {
                                callback(result, null);
                            }
                        }
                        catch (ex) {
                            callback(null, {code:0, message:ex.message});
                        }
                    });
                });
            }
        }

        updatePublicZip(projectId: string, url:string, callback:(data:ProjectData, error:Error) => void) {
            this.client.request("PUT", APIURL.URL_SYNC + projectId, {params:{url:url}}, (response:ProjectData, error:Error) => {
                if (callback) {
                    callback(response, error);
                }
            });
        }

        syncRepository(projectId:string, repo: {url: string, branch?:string}, callback: (error: Error) => void) {
            this.client.request("PUT", APIURL.GITHUB_SYNC + projectId, {params:repo}, (response:any, error:Error) =>{
                if (callback) {
                    callback(error);
                }
            });
        }

    }


    export interface CredentialStorage {
        getAccessToken(): string
        getRefreshToken() : string
        setAccessToken(value:string, expires:number): void
        setRefreshToken(value:string): void
        logout():void;
    }


    class MemoryCredentialStorage implements CredentialStorage {
        access_token: string;
        expires: number;
        refresh_token: string;

        getAccessToken(): string {return this.access_token}
        getRefreshToken() : string { return this.refresh_token}
        setAccessToken(value:string, expires:number) { this.access_token = value; this.expires = expires}
        setRefreshToken(value:string) {this.refresh_token = value}
        logout() {
            this.access_token = null;
            this.refresh_token = null;
            this.expires = 0;
        }
    }
    class CookieCredentialStorage implements CredentialStorage {
        getAccessToken(): string {
            return CookieHelper.getItem("access_token");
        }
        getRefreshToken() : string {
            return CookieHelper.getItem("refresh_token");
        }
        setAccessToken(value:string, expires:number) {
            CookieHelper.setItem("access_token", value, expires || Infinity );
        }
        setRefreshToken(value:string) {
            CookieHelper.setItem("access_token", value, Infinity);
        }
        logout() {
            CookieHelper.removeItem("access_token");
            CookieHelper.removeItem("refresh_token");
        }
    }

    class CookieHelper {

        static getItem(key:string): string {
            var result = new RegExp('(?:^|; )' + encodeURIComponent(key) + '=([^;]*)').exec(document.cookie);
            return result ?  result[1] : null;
        }

        static setItem(key:string, value:string, expires:number, path?:string, domain?:string, secure?:boolean) {
            var strExpires = expires === Infinity ? '; expires=Fri, 31 Dec 9999 23:59:59 GMT' : '; max-age=' + expires;
            document.cookie = encodeURIComponent(key) + '=' + encodeURIComponent(value) + strExpires + (domain ? '; domain=' + domain : '') + (path ? '; path=' + path : '') + (secure ? '; secure' : '');
        }
        static removeItem(key:string, path?:string, domain?:string) {
            if (!CookieHelper.hasItem(key)) {
                return;
            }
            document.cookie = encodeURIComponent(key) + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT' + (domain ? '; domain=' + domain : '') + (path ? '; path=' + path : '');
        }

        static hasItem(key:string) {
            return (new RegExp('(?:^|;\\s*)' + encodeURIComponent(key).replace(/[\-\.\+\*]/g, '\\$&') + '\\s*\\=')).test(document.cookie);
        }
    }
}

declare var module:any;

if(typeof module !== 'undefined'){
    module.exports = CocoonSDK;
}