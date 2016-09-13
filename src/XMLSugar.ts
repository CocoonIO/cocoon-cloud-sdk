/**
 * Created by mortimer on 26/1/16.
 */

namespace CocoonSDK {
    'use strict';

    var cocoonNS  = 'http://cocoon.io/ns/1.0';
    var cordovaNS = 'http://cordova.apache.org/ns/1.0';
    var xmlnsNS   = 'http://www.w3.org/2000/xmlns/';

    export enum Orientation {
        PORTRAIT       = 0,
        LANDSCAPE      = 1,
        BOTH           = 2,
        SYSTEM_DEFAULT = 3
    }

    export enum Environment {
        WEBVIEW      = 0,
        WEBVIEW_PLUS = 1,
        CANVAS_PLUS  = 2
    }

    declare var require: any;

    export class XMLSugar {
        doc: XMLDocument;
        serializer: XMLSerializer;
        root: Element;
        document: HTMLDocument;

        constructor(text: string) {

            var parser: DOMParser;

            if (typeof document !== 'undefined') { //We are on a full browser
                parser          = new DOMParser();
                this.serializer = new XMLSerializer();
                this.document   = document;
            }
            else { //We are on NodeJS
                var xmldom      = require('xmldom');
                parser          = new xmldom.DOMParser();
                this.serializer = new xmldom.XMLSerializer();
                var dom         = new xmldom.DOMImplementation();
                this.document   = dom.createDocument();
            }

            this.doc = this.replaceOldSyntax(parser.parseFromString(text, 'text/xml'));
            var root = this.doc.getElementsByTagName('widget')[0];
            if (root && !root.getAttributeNS(xmlnsNS, 'cdv')) {
                root.setAttributeNS(xmlnsNS, 'xmlns:cdv', cordovaNS);
            }
            this.root = root;
        }

        isErrored(): boolean {
            return this.doc.getElementsByTagName('parsererror').length > 0 || !this.root;
        }

        xml(): string {
            var xml = this.serializer.serializeToString(this.doc);
            //remove empty xmls
            xml     = xml.replace(/[ ]xmlns[=]["]["]/g, '');
            return this.formatXml(xml);
        }

        formatXml(xml: string): string {
            var reg: RegExp                          = /(>)\s*(<)(\/*)/g;
            var wsexp: RegExp                        = / *(.*) +\n/g;
            var contexp: RegExp                      = /(<.+>)(.+\n)/g;
            xml                                      = xml.replace(reg, '$1\n$2$3').replace(wsexp, '$1\n').replace(contexp, '$1\n$2');
            var formatted: string                    = '';
            var lines: string[]                      = xml.split('\n');
            var indent: number                       = 0;
            var lastType: string                     = 'other';
            // 4 types of tags - single, closing, opening, other (text, doctype, comment) - 4*4 = 16 transitions
            var transitions: {[key: string]: number} = {
                'single->single'  : 0,
                'single->closing' : -1,
                'single->opening' : 0,
                'single->other'   : 0,
                'closing->single' : 0,
                'closing->closing': -1,
                'closing->opening': 0,
                'closing->other'  : 0,
                'opening->single' : 1,
                'opening->closing': 0,
                'opening->opening': 1,
                'opening->other'  : 1,
                'other->single'   : 0,
                'other->closing'  : -1,
                'other->opening'  : 0,
                'other->other'    : 0
            };

            for (var i = 0; i < lines.length; i++) {
                var ln: string       = lines[i];
                var single: boolean  = Boolean(ln.match(/<.+\/>/)); // is this line a single tag? ex. <br />
                var closing: boolean = Boolean(ln.match(/<\/.+>/)); // is this a closing tag? ex. </a>
                var opening: boolean = Boolean(ln.match(/<[^!].*>/)); // is this even a tag (that's not <!something>)
                var type: string     = single ? 'single' : closing ? 'closing' : opening ? 'opening' : 'other';
                var fromTo: string   = lastType + '->' + type;
                lastType             = type;
                var padding: string  = '';

                indent += transitions[fromTo];
                for (var j = 0; j < indent; j++) {
                    padding += '\t';
                }
                if (fromTo === 'opening->closing') {
                    formatted = formatted.substr(0, formatted.length - 1) + ln + '\n';
                }// substr removes line break (\n) from prev loop
                else {
                    formatted += padding + ln + '\n';
                }
            }

            return formatted;
        }

        getBundleId(platform?: string, fallback?: boolean): string {
            if (platform) {
                var name: string = bundleIdAliases[platform];
                var value        = this.root.getAttribute(name);
                if (value) {
                    return value;
                }
                else if (!fallback) {
                    return '';
                }
            }
            return this.root.getAttribute('id');
        }

        getVersion(platform?: string, fallback?: boolean): string {
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
        }

        getVersionCode(platform?: string, fallback?: boolean): string {
            if (platform) {
                var name = versionCodeAliases[platform];
                if (name) {
                    var version = this.root.getAttribute(name);
                    if (version) {
                        return version;
                    }
                    else if (!fallback || platform === 'android') {
                        return ''; //android versionCode is a number, not a mayor.minor version name
                    }
                    else {
                        this.getVersion(platform);
                    }
                }
            }

            return this.root.getAttribute('version');
        }

        setBundleId(value: string, platform?: string) {
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
        }

        setVersion(value: string, platform?: string) {
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
        }

        setVersionCode(value: string, platform?: string) {
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
        }

        getNode(tagName: string, platform?: string, fallback?: boolean): Element {
            return findNode(this, {
                tag     : tagName,
                platform: platform,
                fallback: fallback
            });
        }

        getValue(tagName: string, platform?: string, fallback?: boolean): string {
            var node = this.getNode(tagName, platform, fallback);
            return node ? node.textContent : null;
        }

        getNodeValue(tagName: string, platform?: string, fallback?: boolean): Element {
            return this.getNode(tagName, platform, fallback);
        }

        setValue(tagName: string, value: string, platform?: string) {
            updateOrAddNode(this, {
                platform: platform,
                tag     : tagName
            }, {
                                value: value
                            });
        }

        removeValue(tagName: string, platform?: string) {
            removeNode(this, {
                tag     : tagName,
                platform: platform
            });
        }

        getPreference(name: string, platform?: string, fallback?: boolean): string {
            var filter = {
                tag       : 'preference',
                platform  : platform,
                attributes: [
                    {name: 'name', value: name}
                ],
                fallback  : fallback
            };
            var node   = findNode(this, filter);
            return node ? node.getAttribute('value') : null;
        }

        setPreference(name: string, value: string, platform?: string) {
            var filter = {
                tag       : 'preference',
                platform  : platform,
                attributes: [
                    {name: 'name', value: name}
                ]
            };

            if (value) {
                var update = {
                    attributes: [
                        {name: 'name', value: name},
                        {name: 'value', value: value}
                    ]
                };
                updateOrAddNode(this, filter, update);
            }
            else {
                removeNode(this, filter);
            }
        }

        getCocoonVersion(): string {
            return this.getPreference('cocoon-version');
        }

        setCocoonVersion(version: string) {
            this.setPreference('cocoon-version', version);
        }

        getOrientation(platform?: string, fallback?: boolean): Orientation {
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
        }

        setOrientation(value: Orientation, platform?: string) {

            var cordovaValue: string = null;
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
        }

        isFullScreen(platform?: string, fallback?: boolean): boolean {
            var value = this.getPreference('Fullscreen', platform, fallback);
            return value ? value !== 'false' : false;
        }

        setFullScreen(value: boolean, platform?: string) {
            this.setPreference('Fullscreen', value === null ? null : (!!value).toString(), platform);
        }

        /**
         * Gets the XML node of the platform specified.
         * @param platform Name of the platform.
         * @returns {string} The node of the platform specified.
         */
        getCocoonPlatform(platform: string): Element {
            var filter = {
                tag       : 'platform',
                attributes: [
                    {name: 'name', value: platform}
                ]
            };

            return findNode(this, filter);
        }

        /**
         * Gets the XML node of the engine specified.
         * @param platform Name of the platform.
         * @returns {string} The engine node of the platform specified.
         */
        getCocoonEngine(platform: string): Element {
            var filter = {
                tag       : 'engine',
                attributes: [
                    {name: 'name', value: platform}
                ]
            };

            return findNode(this, filter);
        }

        /**
         * Gets the semantic version of the engine for the platform specified that will be required in a compilation of a project with this XML.
         * @deprecated As of release 1.2.0, replaced by {@link getCocoonEngineSpec(string)}.
         * @param platform Name of the platform.
         * @returns {string} The SemVer of the engine for the platform specified.
         */
        getCocoonPlatformVersion(platform: string): string {
            return this.getCocoonEngineSpec(platform);
        }

        /**
         * Gets the semantic version of the engine for the platform specified that will be required in a compilation of a project with this XML.
         * @param platform Name of the platform.
         * @returns {string} The SemVer of the engine for the platform specified.
         */
        getCocoonEngineSpec(platform: string): string {
            var node = this.getCocoonEngine(platform);
            return node ? node.getAttribute('spec') : null;
        }

        /**
         * Sets the semantic version of the engine for the platform specified that will be required in a compilation of a project with this XML.
         * @deprecated As of release 1.2.0, replaced by {@link setCocoonEngineSpec(string,string)}.
         * @param platform Name of the platform.
         * @param value SemVer of the version.
         */
        setCocoonPlatformVersion(platform: string, value: string) {
            this.setCocoonEngineSpec(platform, value);
        }

        /**
         * Sets the semantic version of the engine for the platform specified that will be required in a compilation of a project with this XML.
         * @param platform Name of the platform.
         * @param spec SemVer of the version.
         */
        setCocoonEngineSpec(platform: string, spec: string = '*') {
            var filter = {
                tag       : 'engine',
                attributes: [
                    {name: 'name', value: platform}
                ]
            };

            var update = {
                attributes: [
                    {name: 'name', value: platform},
                    {name: 'spec', value: spec}
                ]
            };
            updateOrAddNode(this, filter, update);
        }

        /**
         * Returns a boolean indicating if a project with this XML will be compiled for the specified platform.
         * @param platform Name of the platform.
         * @returns {boolean} If the platform is enabled.
         */
        isCocoonPlatformEnabled(platform: string): boolean {
            var preference = this.getPreference('enabled', platform);
            return preference !== null && preference !== 'false';
        }

        /**
         * Sets if a project with this XML will be compiled for the specified platform.
         * @param platform Name of the platform.
         * @param enabled If the platform should be enabled.
         */
        setCocoonPlatformEnabled(platform: string, enabled: boolean) {
            this.setPreference('enabled', enabled ? 'true' : 'false', platform);
        }

        getContentURL(platform?: string, fallback?: boolean): string {
            var filter = {
                tag     : 'content',
                platform: platform,
                fallback: fallback
            };
            var node   = findNode(this, filter);
            return node ? node.getAttribute('src') : '';
        }

        setContentURL(value: string, platform?: string) {
            var filter = {
                tag     : 'content',
                platform: platform
            };
            if (value) {
                var update = {
                    attributes: [
                        {name: 'src', value: value}
                    ]
                };
                updateOrAddNode(this, filter, update);
            }
            else {
                removeNode(this, filter);
            }
        }

        addPlugin(name: string, spec: string = '*') {
            if (isValidUrl(name) && name.indexOf('.git') !== -1 && name !== spec) {
                spec = name;
            }
            var filter = {
                tag       : 'plugin',
                attributes: [
                    {name: 'name', value: name}
                ]
            };

            var update = {
                attributes: [
                    {name: 'name', value: name},
                    {name: 'spec', value: spec}
                ]
            };
            updateOrAddNode(this, filter, update);
        }

        removePlugin(name: string) {
            var filter = {
                tag       : 'plugin',
                attributes: [
                    {name: 'name', value: name}
                ]
            };

            removeNode(this, filter);
        }

        findPlugin(name: string): Element {
            var filter = {
                tag       : 'plugin',
                attributes: [
                    {name: 'name', value: name}
                ]
            };
            return findNode(this, filter);

        }

        findAllPlugins(): Element[] {
            var filter = {
                tag: 'plugin'
            };

            return findNodes(this, filter);
        }

        /**
         *
         * @deprecated As of release 1.1.0, replaced by {@link findPluginVariable(string,string)}.
         * @param pluginName Name of the plugin.
         * @param paramName Name of the parameter.
         * @returns {string} Value of the parameter in the specified plugin.
         */
        findPluginParameter(pluginName: string, paramName: string): String {
            return this.findPluginVariable(pluginName, paramName);
        }

        /**
         *
         * @param pluginName Name of the plugin.
         * @param varName Name of the variable.
         * @returns {string} Value of the variable in the specified plugin.
         */
        findPluginVariable(pluginName: string, varName: string): String {
            var plugin         = this.findPlugin(pluginName);
            var result: string = null;
            if (plugin) {
                var nodes = plugin.childNodes;
                for (var i = 0; i < nodes.length; ++i) {
                    if (nodes[i].nodeType === 1 && (<Element>nodes[i]).getAttribute('name') === varName) {
                        result = this.decode((<Element>nodes[i]).getAttribute('value')) || '';
                        break;
                    }
                }
            }
            return result;
        }

        /**
         *
         * @param pluginName Name of the plugin.
         * @returns {NodeListOf<Element>} List of the variables in the specified plugin. Null if the plugin doesn't exist.
         */
        getPluginVariables(pluginName: string): NodeListOf<Element> {
            var plugin = this.findPlugin(pluginName);
            return plugin ? plugin.getElementsByTagName('variable') : null;
        }

        /**
         *
         * @deprecated As of release 1.1.0, replaced by {@link addPluginVariable(string,string,string)}.
         * @param pluginName Name of the plugin.
         * @param paramName Name of the parameter.
         * @param paramValue Value for the parameter.
         */
        addPluginParameter(pluginName: string, paramName: string, paramValue: string) {
            this.addPluginVariable(pluginName, paramName, paramValue);
        }

        /**
         *
         * @param pluginName Name of the plugin.
         * @param varName Name of the variable.
         * @param varValue Value for the variable.
         */
        addPluginVariable(pluginName: string, varName: string, varValue: string) {
            this.addPlugin(pluginName);

            var plugin = this.findPlugin(pluginName);
            if (plugin) {
                var nodes         = plugin.childNodes;
                var node: Element = null;
                for (var i = 0; i < nodes.length; ++i) {
                    if (nodes[i].nodeType === 1 && (<Element>nodes[i]).getAttribute('name') === varName) {
                        node = <Element>nodes[i];
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
        }

        getEnvironment(platform?: string): Environment {
            if (!platform) {
                var envs = [this.getEnvironment('ios'), this.getEnvironment('android')];
                for (var j = 1; j < envs.length; ++j) {
                    if (envs[j] !== envs[j - 1]) {
                        //conflict: different environments per platform
                        return Environment.WEBVIEW;
                    }
                }

                return envs[0];
            }

            var infos: any[] = [canvasPlusPlugins, webviewPlusPlugins];

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
        }

        setEnvironment(value: Environment, platform?: string) {
            var names = platform ? [platform] : ['ios', 'android'];

            for (var i = 0; i < names.length; ++i) {
                var name = names[i];
                var info: any;
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
        }

        encode(str: string): string {
            if (!str) {
                return str;
            }
            return str.replace(/&/g, '&amp;')
                      .replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;')
                      .replace(/"/g, '&quot;')
                      .replace(/'/g, '&apos;');
        }

        decode(str: string): string {
            if (!str) {
                return str;
            }
            return str.replace(/&apos;/g, '\'')
                      .replace(/&quot;/g, '"')
                      .replace(/&gt;/g, '>')
                      .replace(/&lt;/g, '<')
                      .replace(/&amp;/g, '&');
        }

        /**
         * Replaces every Cocoon specific XML tag and parameter name with the ones from Cordova.
         * @param doc configuration of a Cocoon or Cordova project.
         * @returns {Document} the same configuration using only Cordova tags.
         */
        replaceOldSyntax(doc: Document): Document {
            var newDoc: Document = this.replaceOldPlatformSyntax(doc);
            newDoc               = this.replaceOldPluginSyntax(newDoc);
            newDoc               = this.replaceErrors(newDoc);

            return newDoc;
        }

        /**
         * Replaces every Cocoon specific XML tag and parameter name related with platforms with the ones from Cordova.
         * @param doc configuration of a Cocoon or Cordova project.
         * @returns {Document} the same configuration using only Cordova tags.
         */
        replaceOldPlatformSyntax(doc: Document): Document {
            var platforms: NodeListOf<Element> = doc.getElementsByTagNameNS(cocoonNS, 'platform');

            for (var i = platforms.length - 1; i >= 0; i--) {
                var platform: Element = doc.createElementNS(null, 'platform');
                platform.setAttribute('name', platforms[i].getAttribute('name'));
                if (platforms[i].getAttribute('version')) {
                    var engine: Element = doc.createElementNS(null, 'engine');
                    engine.setAttribute('name', platforms[i].getAttribute('name'));
                    engine.setAttribute('spec', platforms[i].getAttribute('version'));
                    platforms[i].parentNode.insertBefore(engine, platforms[i]);
                }

                var childs: NodeList = platforms[i].childNodes;
                for (var j = childs.length - 1; j >= 0; j--) {
                    if (childs[j].nodeType === 1) {
                        platform.appendChild(childs[j]);
                    }
                }

                if (platforms[i].getAttribute('enabled')) {
                    var preference: Element = doc.createElementNS(null, 'preference');
                    preference.setAttribute('name', 'enabled');
                    preference.setAttribute('value', platforms[i].getAttribute('enabled'));
                    platform.appendChild(preference);
                }

                platforms[i].parentNode.insertBefore(platform, platforms[i]);
                platforms[i].parentNode.removeChild(platforms[i]);
            }

            return doc;
        }

        /**
         * Replaces every Cocoon specific XML tag and parameter name related with plugins with the ones from Cordova.
         * @param doc configuration of a Cocoon or Cordova project.
         * @returns {Document} the same configuration using only Cordova tags.
         */
        replaceOldPluginSyntax(doc: Document): Document {
            var plugins: NodeListOf<Element> = doc.getElementsByTagNameNS(cocoonNS, 'plugin');

            for (var i = plugins.length - 1; i >= 0; i--) {
                var plugin: Element = doc.createElementNS(null, 'plugin');
                plugin.setAttribute('name', plugins[i].getAttribute('name'));
                if (isValidUrl(plugins[i].getAttribute('name')) && plugins[i].getAttribute('name').indexOf('.git') !== -1) {
                    plugin.setAttribute('spec', plugins[i].getAttribute('name'));
                } else if (plugins[i].getAttribute('version')) {
                    plugin.setAttribute('spec', plugins[i].getAttribute('version'));
                }

                var childs: NodeList = plugins[i].childNodes;
                for (var j = childs.length - 1; j >= 0; j--) {
                    if (childs[j].nodeName.toUpperCase() === 'PARAM') {
                        var variable: Element = doc.createElementNS(null, 'variable');
                        variable.setAttribute('name', (<Element> childs[j]).getAttribute('name'));
                        variable.setAttribute('value', (<Element> childs[j]).getAttribute('value'));

                        plugin.appendChild(variable);
                    } else if (childs[j].nodeType === 1) {
                        plugin.appendChild(childs[j]);
                    }
                }

                plugins[i].parentNode.insertBefore(plugin, plugins[i]);
                plugins[i].parentNode.removeChild(plugins[i]);
            }

            return doc;
        }

        /**
         * Fixes every custom plugin where the attribute name is the url where the plugin is located and the attribute spec is not by setting the spec with the value of the name.
         * @param doc configuration of a Cocoon or Cordova project.
         * @returns {Document} the same configuration using only Cordova tags.
         */
        replaceErrors(doc: Document): Document {
            var plugins: NodeListOf<Element> = doc.getElementsByTagName('plugin');

            for (var i = plugins.length - 1; i >= 0; i--) {
                if (isValidUrl(plugins[i].getAttribute('name')) && plugins[i].getAttribute('name').indexOf('.git') !== -1 && plugins[i].getAttribute('name') !== plugins[i].getAttribute('spec')) {
                    plugins[i].setAttribute('spec', plugins[i].getAttribute('name'));
                }
            }

            return doc;
        }
    }

    var canvasPlusPlugins: any = {

        value  : Environment.CANVAS_PLUS,
        ios    : {
            plugin: 'com.ludei.canvasplus.ios'
        },
        android: {
            plugin: 'com.ludei.canvasplus.android'
        }
    };

    var webviewPlusPlugins: any = {
        value  : Environment.WEBVIEW_PLUS,
        ios    : {
            plugin: 'com.ludei.webviewplus.ios'
        },
        android: {
            plugin: 'com.ludei.webviewplus.android'
        }
    };

    var bundleIdAliases: {[key: string]: string} = {
        android: 'android-packageName',
        ios    : 'ios-CFBundleIdentifier',
        osx    : 'osx-tmpPlaceholder', //TODO: find real name
        ubuntu : 'ubuntu-tmpPlaceholder', //TODO: find real name
        windows: 'windows-tmpPlaceholder' //TODO: find real name
    };

    var versionCodeAliases: {[key: string]: string} = {
        android: 'android-versionCode',
        ios    : 'ios-CFBundleVersion',
        osx    : 'osx-CFBundleVersion',
        ubuntu : 'ubuntu-tmpVersionPlaceholder', //TODO: find real name
        windows: 'windows-packageVersion'
    };

    function matchesFilter(sugar: XMLSugar, node: Element, filter: any) {
        filter     = filter || {};
        var parent = <Element>node.parentNode;
        if (filter.platform) {
            if (parent.tagName !== 'platform' || parent.getAttribute && parent.getAttribute('name') !== filter.platform) {
                return false;
            }
        }
        else if (parent !== sugar.root) {
            return false;
        }

        //double check to avoid namespace mismatches in getElementsById
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

    /**
     *
     * @deprecated As of release 1.1.0, the new syntax does not need NameSpaces.
     * @param tag
     * @returns {boolean}
     */
    function hasNS(tag: string) {
        return tag.indexOf(':') !== -1;
    }

    /**
     *
     * @deprecated As of release 1.1.0, the new syntax does not need NameSpaces.
     * @param tag
     * @returns {any}
     */
    function cleanNS(tag?: string) {
        if (!tag) {
            return null;
        }
        var nsIndex = tag.indexOf(':');
        if (nsIndex >= 0) {
            return tag.slice(nsIndex + 1);
        }

        return tag;
    }

    function getElements(sugar: XMLSugar, filter: any) {
        return sugar.doc.getElementsByTagName(filter.tag || '*');
    }

    function findNode(sugar: XMLSugar, filter: any): Element {
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

    function findNodes(doc: XMLSugar, filter: any): Element[] {
        filter = filter || {};

        var nodes = getElements(doc, filter);

        var result: Element[] = [];
        for (var i = 0; i < nodes.length; ++i) {
            if (matchesFilter(doc, nodes[i], filter)) {
                result.push(nodes[i]);
            }
        }
        return result;
    }

    function addNodeIndented(sugar: XMLSugar, node: Element, parent: Element) {
        parent.appendChild(sugar.document.createTextNode('\n'));
        var p = parent.parentNode;
        do {
            parent.appendChild(sugar.document.createTextNode('    '));
            p = p.parentNode;
        }
        while (!!p);

        parent.appendChild(node);
        node.setAttribute('xmlns', '');
        parent.appendChild(sugar.document.createTextNode('\n'));
    }

    function parentNodeForPlatform(sugar: XMLSugar, platform?: string): Element {
        if (!platform) {
            return sugar.root;
        }

        var platformNode = findNode(sugar, {
            tag       : 'platform',
            attributes: [
                {name: 'name', value: platform}
            ]
        });

        if (!platformNode) {
            platformNode = sugar.document.createElementNS(null, 'platform');
            platformNode.setAttribute('name', platform);
            addNodeIndented(sugar, platformNode, sugar.root);
        }

        return platformNode;

    }

    function updateOrAddNode(sugar: XMLSugar, filter: any, data: any) {
        filter    = filter || {};
        var found = findNode(sugar, filter);
        if (!found) {
            var parent = parentNodeForPlatform(sugar, filter.platform);
            found      = sugar.document.createElementNS(null, filter.tag);
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

    function removeNode(sugar: XMLSugar, filter: any) {
        var node = findNode(sugar, filter);
        if (node && node.parentNode) {
            var parent = <Element>node.parentNode;
            parent.removeChild(node);

            //remove empty platform node
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

    /**
     * From jQuery (https://github.com/jzaefferer/jquery-validation/blob/master/src/core.js#L1349)
     * @param value
     * @returns {boolean}
     */
    function isValidUrl(value: string) {
        return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})).?)(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(value);
    }

}
