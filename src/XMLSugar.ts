/**
 * Created by mortimer on 26/1/16.
 */

namespace CocoonSDK {
    'use strict';

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

            // Replace old syntax
            text = this.replaceOldSyntax(text);

            this.doc  = parser.parseFromString(text, 'text/xml');
            this.root = this.doc.getElementsByTagName('widget')[0];
        }

        isErrored(): boolean {
            return this.doc.getElementsByTagName('parsererror').length > 0 || !this.root;
        }

        xml(): string {
            var xml = this.serializer.serializeToString(this.doc);
            //remove empty xmls
            xml     = xml.replace(/[ ]xmlns[=]["]["]/g, '');
            //remove empty lines
            xml     = xml.replace(/^\s*[\r\n]/gm, '');
            //fix </platform> indentation
            xml     = xml.replace(/^[<][/]platform[>]/gm, '    </platform>');
            //fix </plugin> indentation
            xml     = xml.replace(/^[<][/]plugin[>]/gm, '    </plugin>');
            return xml;
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
         * Gets the XML node of the engine specified.
         * @deprecated As of release 1.2.0, replaced by {@link getCocoonEngine(string)}.
         * @param engine name of the engine (aka platform).
         * @returns {string} The node of the engine specified.
         */
        getCocoonPlatform(engine: string): Element {
            return this.getCocoonEngine(engine);
        }

        /**
         * Gets the XML node of the engine specified.
         * @param engine name of the engine (aka platform).
         * @returns {string} The node of the engine specified.
         */
        getCocoonEngine(engine: string): Element {
            var filter = {
                tag       : 'engine',
                attributes: [
                    {name: 'name', value: engine}
                ]
            };

            return findNode(this, filter);
        }

        /**
         * Gets the semantic version of the engine specified that will be required in a compilation of a project with this XML.
         * @deprecated As of release 1.2.0, replaced by {@link getCocoonEngineSpec(string)}.
         * @param platform name of the engine (aka platform).
         * @returns {string} The SemVer of the engine specified.
         */
        getCocoonPlatformVersion(platform: string): string {
            return this.getCocoonEngineSpec(platform);
        }

        /**
         * Gets the semantic version of the engine specified that will be required in a compilation of a project with this XML.
         * @param engine name of the engine (aka platform).
         * @returns {string} The SemVer of the engine specified.
         */
        getCocoonEngineSpec(engine: string): string {
            var node = this.getCocoonEngine(engine);
            return node ? node.getAttribute('spec') : null;
        }

        /**
         * Sets the semantic version of the specified engine. This version will be required in a compilation of a project with this XML.
         * @deprecated As of release 1.2.0, replaced by {@link setCocoonEngineSpec(string,string)}.
         * @param engine Name of the engine (aka platform).
         * @param value SemVer of the version.
         */
        setCocoonPlatformVersion(engine: string, value: string) {
            this.setCocoonEngineSpec(engine, value);
        }

        /**
         * Sets the semantic version of the specified engine. This version will be required in a compilation of a project with this XML.
         * @param engine Name of the engine (aka platform).
         * @param spec SemVer of the version.
         */
        setCocoonEngineSpec(engine: string, spec: string = '*') {
            var filter = {
                tag       : 'engine',
                attributes: [
                    {name: 'name', value: engine}
                ]
            };

            var update = {
                attributes: [
                    {name: 'name', value: engine},
                    {name: 'spec', value: spec}
                ]
            };
            updateOrAddNode(this, filter, update);
        }

        /**
         * Returns a boolean indicating if a project with this XML will be compiled for the specified engine.
         * @deprecated As of release 1.2.0, replaced by {@link isCocoonEngineEnabled(string)}.
         * @param engine Name of the engine (aka platform).
         * @returns {boolean} If the engine is enabled.
         */
        isCocoonPlatformEnabled(engine: string): boolean {
            return this.isCocoonEngineEnabled(engine);
        }

        /**
         * Returns a boolean indicating if a project with this XML will be compiled for the specified engine.
         * @param engine Name of the engine (aka platform).
         * @returns {boolean} If the engine is enabled.
         */
        isCocoonEngineEnabled(engine: string): boolean {
            var preference = this.getPreference('enabled', engine);
            return !(preference === 'false');
        }

        /**
         * Sets if a project with this XML should be compiled for the specified engine.
         * @deprecated As of release 1.2.0, replaced by {@link setCocoonEngineEnabled(string,boolean)}.
         * @param engine Name of the engine (aka platform).
         * @param enabled If the engine should be enabled.
         */
        setCocoonPlatformEnabled(engine: string, enabled: boolean) {
            this.setCocoonEngineEnabled(engine, enabled);
        }

        /**
         * Sets if a project with this XML should be compiled for the specified engine.
         * @param engine Name of the engine (aka platform).
         * @param enabled If the engine should be enabled.
         */
        setCocoonEngineEnabled(engine: string, enabled: boolean) {
            this.setPreference('enabled', enabled ? null : 'false', engine);
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
         * @param str configuration of a Cocoon or Cordova project in XML format.
         * @returns {string} the same configuration using only Cordova tags.
         */
        replaceOldSyntax(str: string): string {
            var newSyntax = str.replace(/<cocoon:platform\s+enabled="([^"]*)"\s+name="([^"]*)"\s*\/?>/g, function (substring, enabled, engine) {
                return '<platform name="' + engine + '">' +
                    '<preference name="enabled" value="' + enabled + '" />' +
                    '</platform>';
            });
            newSyntax     = newSyntax.replace(/<cocoon:platform\s+name="([^"]*)"\s+enabled="([^"]*)"\s*\/?>/g, function (substring, engine, enabled) {
                return '<platform name="' + engine + '">' +
                    '<preference name="enabled" value="' + enabled + '" />' +
                    '</platform>';
            });
            newSyntax     = newSyntax.replace(/cocoon:platform/g, 'engine');
            newSyntax     = newSyntax.replace(/cocoon:plugin/g, 'plugin');
            newSyntax     = newSyntax.replace(/<param/g, '<variable');
            newSyntax     = newSyntax.replace(/<plugin\s+(.*?)\s*version=/g, function (substring, middleData) {
                return '<plugin ' + (middleData ? middleData + ' ' : '') + 'spec=';
            });
            newSyntax     = newSyntax.replace(/<engine\s+(.*?)\s*version=/g, function (substring, middleData) {
                return '<engine ' + (middleData ? middleData + ' ' : '') + 'spec=';
            });
            return newSyntax;
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

}
