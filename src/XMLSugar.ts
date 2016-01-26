/**
 * Created by mortimer on 26/1/16.
 */

module CocoonSDK {

    var cocoonNS = 'http://cocoon.io/ns/1.0';
    var xmlnsNS = 'http://www.w3.org/2000/xmlns/';


    export enum Orientation {
        PORTRAIT = 0,
        LANDSCAPE = 1,
        BOTH = 2,
        SYSTEM_DEFAULT = 3
    }

    export enum Environment {
        WEBVIEW = 0,
        WEBVIEW_PLUS = 1,
        CANVAS_PLUS = 2
    }

    export class XMLSugar {

        parser:DOMParser;
        doc:XMLDocument;
        serializer:XMLSerializer;
        root:Element;


        constructor(text:string) {
            var parser = new DOMParser();
            this.doc = parser.parseFromString(text, 'text/xml');
            this.serializer = new XMLSerializer();

            var root = this.doc.getElementsByTagName('widget')[0];
            if (root && !root.getAttributeNS(xmlnsNS, 'cocoon')) {
                root.setAttributeNS(xmlnsNS, 'xmlns:cocoon', cocoonNS);
            }
            this.root = root;
            (<any>this.doc).root = root
        }

        isErrored(): boolean {
            return this.doc.getElementsByTagName('parsererror').length > 0 || !this.root;
        }

        xml():string {
            var xml = this.serializer.serializeToString(this.doc);
            //remove empty xmls
            xml = xml.replace(/[ ]xmlns[=]["]["]/g, '');
            //remove empty lines
            xml = xml.replace(/^\s*[\r\n]/gm, '');
            //fix </platform> indentation
            xml = xml.replace(/^[<][/]platform[>]/gm, '    </platform>');
            //fix </plugin> indentation
            xml = xml.replace(/^[<][/]cocoon[:]plugin[>]/gm, '    </cocoon:plugin>');
            return xml;
        }

        getBundleId(platform?:string, fallback?:boolean):string {
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
        }

        getVersion(platform?:string, fallback?:boolean): string {
            if (platform) {
                var version =  this.root.getAttribute(platform + '-version');
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

        getVersionCode(platform?:string, fallback?:boolean): string {
            if (platform) {
                var name = versionCodeAliases[platform];
                if (name) {
                    var version =  this.root.getAttribute(name);
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

        setBundleId(value:string, platform?:string) {
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

        setVersion(value:string, platform?:string) {
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

        setVersionCode(value:string, platform?:string) {
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

        getNode(tagName:string, platform?:string, fallback?:boolean): Element {
            return findNode(this.doc, {
                tag: tagName,
                platform: platform,
                fallback: fallback
            });
        }

        getValue(tagName:string, platform?:string, fallback?:boolean): string {
            var node = this.getNode(tagName, platform, fallback);
            return node ? node.textContent : null;
        }

        getNodeValue(tagName:string, platform?:string, fallback?:boolean): Element {
            var node = this.getNode(tagName, platform, fallback);
            return node;
        }

        setValue(tagName:string, value:string, platform?:string) {
            updateOrAddNode(this.doc, {
                platform: platform,
                tag: tagName
            }, {
                value: value
            });
        }

        removeValue(tagName:string,  platform?:string) {
            removeNode(this.doc, {
                tag: tagName,
                platform: platform
            });
        }

        getPreference(name:string, platform?:string, fallback?:boolean) {
            var filter = {
                tag: 'preference',
                platform: platform,
                attributes: [
                    {name:'name', value:name}
                ],
                fallback: fallback
            };
            var node = findNode(this.doc, filter);
            return node ? node.getAttribute('value') : null;
        }

        setPreference(name:string, value:string, platform?:string) {
            var filter = {
                tag: 'preference',
                platform: platform,
                attributes: [
                    {name:'name', value:name}
                ]
            };

            if (value) {
                var update = {
                    attributes: [
                        {name:'name', value:name},
                        {name:'value', value:value}
                    ]
                };
                updateOrAddNode(this.doc, filter, update);
            }
            else {
                removeNode(this.doc, filter);
            }
        }

        getCocoonVersion():string {
            return this.getPreference('cocoon-version');
        }

        setCocoonVersion(version:string) {
            this.setPreference('cocoon-version', version);
        }

        getOrientation(platform?:string, fallback?:boolean): Orientation {
            var value =  this.getPreference('Orientation', platform, fallback);
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

        setOrientation(value:Orientation, platform?:string) {

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
         }

        isFullScreen(platform?:string, fallback?:boolean) {
            var value = this.getPreference('Fullscreen', platform, fallback);
            return value ? value !== 'false' : false;
        }

        setFullScreen(value:boolean, platform?:string) {
            this.setPreference('Fullscreen', value === null ? null : (!!value).toString(), platform);
        }

        getCocoonPlatform(platform:string): Element {
            var filter = {
                tag: 'cocoon:platform',
                attributes: [
                    {name:'name', value:platform}
                ]
            };

            return findNode(this.doc, filter);
        }

        getCocoonPlatformVersion(platform:string): string {
            var node = this.getCocoonPlatform(platform);
            return node ? node.getAttribute('version') : null;
        }

        setCocoonPlatformVersion(platform:string, value:string) {
            var filter = {
                tag: 'cocoon:platform',
                attributes: [
                    {name:'name', value:platform}
                ]
            };
            if (value) {
                var update = {
                    attributes: [
                        {name:'name', value:platform},
                        {name:'version', value:value}
                    ]
                };
                updateOrAddNode(this.doc, filter, update);
            }
            else {
                removeNode(this.doc, filter);
            }
        }

        isCocoonPlatformEnabled(platform:string): boolean {
            var filter = {
                tag: 'cocoon:platform',
                attributes: [
                    {name:'name', value:platform}
                ]
            };

            var node = findNode(this.doc, filter);
            if (!node) {
                return true;
            }

            return node.getAttribute('enabled') !== 'false';
        }
        setCocoonPlatformEnabled(platform:string, enabled:boolean) {
            var filter = {
                tag: 'cocoon:platform',
                attributes: [
                    {name:'name', value:platform}
                ]
            };
            var update = {
                attributes: [
                    {name:'enabled', value:enabled ? null : 'false'},
                    {name:'name', value:platform}
                ]
            };
            updateOrAddNode(this.doc, filter, update);
        }

        getContentURL(platform?:string, fallback?:boolean) {
            var filter = {
                tag: 'content',
                platform: platform,
                fallback: fallback
            };
            var node = findNode(this.doc, filter);
            return node ? node.getAttribute('src') : '';
        }

        setContentURL(value:string, platform?:string) {
            var filter = {
                tag: 'content',
                platform: platform
            };
            if (value) {
                var update = {
                    attributes: [
                        {name:'src', value:value}
                    ]
                };
                updateOrAddNode(this.doc, filter, update);
            }
            else {
                removeNode(this.doc, filter);
            }
        }

        addPlugin(name:string) {
            var filter = {
                tag: 'cocoon:plugin',
                attributes: [
                    {name:'name', value:name}
                ]
            };

            var update = {
                attributes: [
                    {name:'name', value:name}
                ]
            };
            updateOrAddNode(this.doc, filter, update);
        }

        removePlugin(name:string) {
            var filter = {
                tag: '*:plugin',
                attributes: [
                    {name:'name', value:name}
                ]
            };

            removeNode(this.doc, filter);
        }

        findPlugin(name):Element {
            var filter = {
                tag: 'cocoon:plugin',
                attributes: [
                    {name:'name', value:name}
                ]
            };
            return findNode(this.doc, filter);

        }

        findAllPlugins(): Element[] {
            var filter = {
                tag: 'cocoon:plugin'
            };

            return findNodes(this.doc, filter);
        }

        findPluginParameter(pluginName:string, paramName:string) {
            var plugin = this.findPlugin(pluginName);
            var result = null;
            if (plugin) {
                var nodes = plugin.childNodes;
                for (var i = 0; i < nodes.length; ++i) {
                    if (nodes[i].nodeType === 1 && (<Element>nodes[i]).getAttribute('name') === paramName) {
                        result = this.decode((<Element>nodes[i]).getAttribute('value')) || '';
                        break;
                    }
                }
            }
            return result;
        }

        addPluginParameter(pluginName:string, paramName:string, paramValue:string) {
            this.addPlugin(pluginName);

            var plugin = this.findPlugin(pluginName);
            if (plugin) {
                var nodes = plugin.childNodes;
                var node = null;
                for (var i = 0; i < nodes.length; ++i) {
                    if (nodes[i].nodeType === 1 && (<Element>nodes[i]).getAttribute('name') === paramName) {
                        node = nodes[i];
                        break;
                    }
                }

                if (!node) {
                    node = document.createElementNS(null, 'param');
                    node.setAttribute('name', paramName || '');
                    addNodeIndented(node, plugin);
                }

                node.setAttribute('value', this.encode(paramValue) || '');
            }
        }

        getEnvironment(platform?:string): Environment {
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
        }

        setEnvironment(value:Environment, platform?:string) {
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
        }

        encode(str:string):string {
            if (!str) {
                return str;
            }
            return str.replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&apos;');
        }

        decode(str:string):string{
            if (!str) {
                return str;
            }
            return str.replace(/&apos;/g, '\'')
                .replace(/&quot;/g, '"')
                .replace(/&gt;/g, '>')
                .replace(/&lt;/g, '<')
                .replace(/&amp;/g, '&');
        }

    }

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
        ios: 'ios-CFBundleIdentifier',
        android: 'android-packageName'
    };

    var versionCodeAliases = {
        ios: 'ios-CFBundleVersion',
        android: 'android-versionCode'
    };

    function matchesFilter(doc, node, filter) {
        filter = filter || {};
        var parent = node.parentNode;
        if (filter.platform) {
            if (parent.tagName !== 'platform' || parent.getAttribute('name') !== filter.platform) {
                return false;
            }
        }
        else if (parent !== doc.root) {
            return false;
        }

        //double check to avoid namespace mismatches in getElementsById
        if (filter.tag && filter.tag !== node.tagName  && filter.tag.indexOf('*') < 0) {
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

    function hasNS(tag)
    {
        return tag.indexOf(':') !== -1;
    }

    function cleanNS(tag)
    {
        if (!tag) {
            return null;
        }
        var nsIndex = tag.indexOf(':');
        if (nsIndex >=0) {
            return tag.slice(nsIndex + 1);
        }

        return tag;
    }


    function getElements(doc, filter) {

        if (hasNS(filter.tag)) {
            var ns = filter.tag[0] === '*' ? '*' : cocoonNS;
            return doc.getElementsByTagNameNS(ns, cleanNS(filter.tag));
        }
        else {
            return doc.getElementsByTagName(filter.tag || '*');
        }
    }

    function findNode(doc, filter) {
        filter = filter || {};


        var nodes = getElements(doc, filter);

        for (var i = 0; i < nodes.length; ++i) {
            if (matchesFilter(doc, nodes[i], filter)) {
                return nodes[i];
            }
        }

        if (filter.platform && filter.fallback) {
            delete filter.platform;
            return findNode(doc, filter);
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

    function addNodeIndented(node, parent) {
        parent.appendChild(document.createTextNode('\n'));
        var p = parent.parentNode;
        do {
            parent.appendChild(document.createTextNode('    '));
            p = p.parentNode;
        }
        while (!!p);

        parent.appendChild(node);
        node.setAttribute('xmlns','');
        parent.appendChild(document.createTextNode('\n'));
    }

    function parentNodeForPlatform(doc, platform) {
        if (!platform) {
            return doc.root;
        }

        var platformNode = findNode(doc, {
            tag: 'platform',
            attributes: [
                {name: 'name', value: platform}
            ]
        });

        if (!platformNode) {
            platformNode = document.createElementNS(null, 'platform');
            platformNode.setAttribute('name', platform);
            addNodeIndented(platformNode, doc.root);
        }

        return platformNode;

    }

    function updateOrAddNode(doc, filter, data) {
        filter = filter || {};
        var found = findNode(doc, filter);
        if (!found) {
            var parent = parentNodeForPlatform(doc, filter.platform);
            if (hasNS(filter.tag)) {
                found = document.createElementNS(cocoonNS, filter.tag);
            }
            else {
                found = document.createElementNS(null, filter.tag);
            }
            addNodeIndented(found, parent);
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

    function removeNode(doc, filter) {
        var node = findNode(doc, filter);
        if (node && node.parentNode) {
            var parent = node.parentNode;
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
