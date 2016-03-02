declare module CocoonSDK {
    enum Status {
        Created,
        Waiting,
        Compiling,
        Completed,
        Disabled,
    }
    class Platform {
        static IOS: string;
        static ANDROID: string;
        static platforms: string[];
    }
    interface CompilationKey {
        id: string;
        title: string;
    }
    interface ProjectData {
        id: string;
        title: string;
        package: string;
        build_count: number;
        config: string;
        icon: string;
        date_created: number;
        date_updated?: number;
        date_compiled?: number;
        status: {
            [key: string]: Status;
        };
        download: {
            [key: string]: string;
        };
        devapp: string[];
        keys: {
            [key: string]: CompilationKey;
        };
        error: {
            [key: string]: string;
        };
        icons: {
            [key: string]: string;
        };
        splashes: {
            [key: string]: string;
        };
        platforms: string[];
    }
    class Compilation {
        data: ProjectData;
        platform: string;
        constructor(platform: string, data: ProjectData);
        isDevApp(): boolean;
        isReady(): boolean;
        isErrored(): boolean;
        getError(): string;
        getStatus(): Status;
        getDownloadLink(): string;
    }
    class Project {
        data: ProjectData;
        compilations: Compilation[];
        cachedXml: string;
        client: APIClient;
        constructor(data: ProjectData, client: APIClient);
        private syncNewData(newData);
        isCompiling(): boolean;
        getLastUse(): number;
        compile(callback: (error: Error) => void): void;
        compileDevApp(callback: (error: Error) => void): void;
        getConfigXml(callback: (xml: string, error: Error) => void): void;
        putConfigXml(xml: string, callback: (error: Error) => void): void;
        refresh(callback: (error: Error) => void): void;
        refreshUntilCompleted(callback: (completed: boolean) => void): void;
        syncRepository(repo: {
            url: string;
            branch?: string;
        }, callback: (error: Error) => void): void;
        uploadZip(file: File, callback: (error: Error) => void): void;
        updatePublicZip(url: string, callback: (error: Error) => void): void;
        getIconSrc(platform: string): string;
        getIconBlob(platform: string, callback: (data: Blob, error: Error) => void): void;
        getCompilation(platform: string): Compilation;
        getDownloadLink(platform: string): string;
        delete(callback: (error: Error) => void): void;
    }
}
declare module CocoonSDK {
    interface PaymentPlan {
        name: string;
    }
    interface UserData {
        id: string;
        username: string;
        email: string;
        name: string;
        lastname: string;
        eula: boolean;
        plan: PaymentPlan;
        connections: string[];
        keys: {
            [key: string]: CompilationKey[];
        };
        migration: any;
    }
}
declare module CocoonSDK {
    enum GrantType {
        Implicit = 0,
        AuthorizationCode = 1,
    }
    enum StorageType {
        Cookies = 0,
        Memory = 1,
    }
    interface OauthMode {
        grantType: GrantType;
        storageType?: StorageType;
        customServer?: string;
    }
    interface Credentials {
        accessToken: string;
        refreshToken: string;
    }
    interface Error {
        message: string;
        code: number;
    }
    interface Configuration {
        clientId: string;
        clientSecret: string;
        apiURL: string;
        oauthURL: string;
    }
    interface RequestXHROptions {
        responseType?: string;
        contentType?: string;
        transform?: (xhr: XMLHttpRequest) => any;
        params?: any;
    }
    interface RepositoryData {
        url: string;
        branch?: string;
    }
    class APIClient {
        config: Configuration;
        oauthMode: OauthMode;
        credentials: CredentialStorage;
        project: ProjectAPI;
        constructor(options: {
            clientId: string;
            clientSecret?: string;
            apiURL?: string;
            oauthURL?: string;
        });
        setOauthMode(options: OauthMode): void;
        setAccessToken(token: string, expires?: number): void;
        getAccessToken(): string;
        isLoggedIn(): boolean;
        logInWithPassword(user: string, password: string, callback?: (loggedIn: boolean, error: Error) => void): void;
        logIn(options: {
            width?: number;
            height?: number;
            redirectUri?: string;
        }, callback: (accessToken?: string, error?: Error) => void): void;
        logout(): void;
        request(method: string, path: string, options: RequestXHROptions, callback?: (response: any, error: Error) => void): void;
        me(callback: (me: UserData, error: Error) => void): void;
        private getLoginURL(redirect_uri);
    }
    class ProjectAPI {
        client: APIClient;
        constructor(client: APIClient);
        createFromRepository(data: RepositoryData, callback: (project: Project, error: Error) => void): void;
        createFromPublicZip(url: string, callback: (project: Project, error: Error) => void): void;
        createFromZipUpload(file: File, callback: (project: Project, error: Error) => void): void;
        get(projectId: string, callback: (project: Project, error: Error) => void): void;
        delete(projectId: string, callback: (error: Error) => void): void;
        list(callback: (projects: Project[], error: Error) => void): void;
        compile(projectId: string, callback: (error: Error) => void): void;
        compileDevApp(projectId: string, callback: (error: Error) => void): void;
        getConfigXml(configURL: string, callback: (xml: string, error: Error) => void): void;
        getIconBlob(projectId: string, platform: string, callback: (data: Blob, error: Error) => void): void;
        getIconSrc(projectId: string, platform: string): string;
        putConfigXml(configURL: string, xml: string, callback: (error: Error) => void): void;
        uploadZip(projectId: string, file: File, callback: (data: ProjectData, error: Error) => void): void;
        updatePublicZip(projectId: string, url: string, callback: (data: ProjectData, error: Error) => void): void;
        syncRepository(projectId: string, repo: {
            url: string;
            branch?: string;
        }, callback: (error: Error) => void): void;
    }
    interface CredentialStorage {
        getAccessToken(): string;
        getRefreshToken(): string;
        setAccessToken(value: string, expires: number): void;
        setRefreshToken(value: string): void;
        logout(): void;
    }
}
declare var module: any;
declare module CocoonSDK {
    enum Orientation {
        PORTRAIT = 0,
        LANDSCAPE = 1,
        BOTH = 2,
        SYSTEM_DEFAULT = 3,
    }
    enum Environment {
        WEBVIEW = 0,
        WEBVIEW_PLUS = 1,
        CANVAS_PLUS = 2,
    }
    class XMLSugar {
        doc: XMLDocument;
        serializer: XMLSerializer;
        root: Element;
        document: HTMLDocument;
        constructor(text: string);
        isErrored(): boolean;
        xml(): string;
        getBundleId(platform?: string, fallback?: boolean): string;
        getVersion(platform?: string, fallback?: boolean): string;
        getVersionCode(platform?: string, fallback?: boolean): string;
        setBundleId(value: string, platform?: string): void;
        setVersion(value: string, platform?: string): void;
        setVersionCode(value: string, platform?: string): void;
        getNode(tagName: string, platform?: string, fallback?: boolean): Element;
        getValue(tagName: string, platform?: string, fallback?: boolean): string;
        getNodeValue(tagName: string, platform?: string, fallback?: boolean): Element;
        setValue(tagName: string, value: string, platform?: string): void;
        removeValue(tagName: string, platform?: string): void;
        getPreference(name: string, platform?: string, fallback?: boolean): any;
        setPreference(name: string, value: string, platform?: string): void;
        getCocoonVersion(): string;
        setCocoonVersion(version: string): void;
        getOrientation(platform?: string, fallback?: boolean): Orientation;
        setOrientation(value: Orientation, platform?: string): void;
        isFullScreen(platform?: string, fallback?: boolean): boolean;
        setFullScreen(value: boolean, platform?: string): void;
        getCocoonPlatform(platform: string): Element;
        getCocoonPlatformVersion(platform: string): string;
        setCocoonPlatformVersion(platform: string, value: string): void;
        isCocoonPlatformEnabled(platform: string): boolean;
        setCocoonPlatformEnabled(platform: string, enabled: boolean): void;
        getContentURL(platform?: string, fallback?: boolean): any;
        setContentURL(value: string, platform?: string): void;
        addPlugin(name: string): void;
        removePlugin(name: string): void;
        findPlugin(name: string): Element;
        findAllPlugins(): Element[];
        findPluginParameter(pluginName: string, paramName: string): String;
        addPluginParameter(pluginName: string, paramName: string, paramValue: string): void;
        getEnvironment(platform?: string): Environment;
        setEnvironment(value: Environment, platform?: string): void;
        encode(str: string): string;
        decode(str: string): string;
    }
}
