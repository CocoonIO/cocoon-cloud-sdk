/// <reference path='APIClient.ts'/>

namespace CocoonSDK {
    'use strict';

    export enum Status {
        Created   = 'created' as any,
        Waiting   = 'waiting' as any,
        Compiling = 'compiling' as any,
        Completed = 'completed' as any,
        Disabled  = 'disabled' as any,
    }

    export class Platform {
        static IOS       = 'ios';
        static ANDROID   = 'android';
        static platforms = [Platform.IOS, Platform.ANDROID];
    }

    export interface CompilationKey {
        id: string;
        title: string;
    }

    export interface ProjectData {
        id: string;
        title: string;
        package: string;
        build_count: number;
        config: string;
        icon: string;
        date_created: number;
        date_updated?: number;
        date_compiled?: number;
        status: {[key: string]: Status};
        download: {[key: string]: string};
        devapp: string[];
        keys: {[key: string]: CompilationKey};
        error: {[key: string]: string};
        icons: {[key: string]: string};
        splashes: {[key: string]: string};
        platforms: string[];
    }

    export class Compilation {
        data: ProjectData;
        platform: string;

        constructor(platform: string, data: ProjectData) {
            this.platform = platform;
            this.data     = data;
        }

        isDevApp(): boolean {
            return this.data.devapp && this.data.devapp.length > 0 && this.data.devapp.indexOf(this.platform) >= 0;
        }

        isReady(): boolean {
            return this.getStatus() === Status.Completed && !this.isErrored();
        }

        isErrored(): boolean {
            return this.data.error && this.data.error.hasOwnProperty(this.platform);
        }

        getError(): string {
            return this.isErrored() ? this.data.error[this.platform] : '';
        }

        getStatus(): Status {

            if (this.data.status && this.data.status.hasOwnProperty(this.platform)) {
                return this.data.status[this.platform];
            }
            if (this.data.date_compiled) {
                return Status.Disabled;
            }
            else {
                return Status.Created;
            }
        }

        getDownloadLink(): string {
            if (this.data.download && this.data.download.hasOwnProperty(this.platform)) {
                return this.data.download[this.platform];
            }
            return '';
        }
    }

    export class Project {

        data: ProjectData;
        compilations: Compilation[];
        cachedXml: string;
        client: APIClient;

        constructor(data: ProjectData, client: APIClient) {
            this.data         = data;
            this.compilations = [];
            this.client       = client;
            for (var i = 0; i < Platform.platforms.length; ++i) {
                this.compilations.push(new Compilation(Platform.platforms[i], this.data));
            }
        }

        private syncNewData(newData: ProjectData) {
            for (var key in newData) {
                if (newData.hasOwnProperty(key)) {
                    (<any>this.data)[key] = (<any>newData)[key];
                }
            }
        }

        isCompiling(): boolean {
            for (var i = 0; i < this.compilations.length; ++i) {
                var status = this.compilations[i].getStatus();
                if (status === Status.Compiling || status === Status.Waiting) {
                    return true;
                }
            }
            return false;
        }

        getLastUse(): number {
            return Math.max(this.data.date_compiled || 0, this.data.date_created || 0, this.data.date_updated || 0);
        }

        compile(callback: (error: Error) => void) {
            this.client.project.compile(this.data.id, callback);
        }

        compileDevApp(callback: (error: Error) => void) {
            this.client.project.compileDevApp(this.data.id, callback);
        }

        getConfigXml(callback: (xml: string, error: Error) => void) {
            this.client.project.getConfigXml(this.data.config, function (xml: string, error: Error) {
                if (xml) {
                    this.cachedXml = xml;
                }
                if (callback) {
                    callback(xml, error);
                }
            });
        }

        putConfigXml(xml: string, callback: (error: Error) => void) {
            this.cachedXml = xml;
            this.client.project.putConfigXml(this.data.config, xml, callback);
        }

        refresh(callback: (error: Error) => void) {
            this.client.request('GET', 'project/' + this.data.id, null, (response: ProjectData, error: Error) => {
                if (response && !error) {
                    this.syncNewData(response);
                }
                if (callback) {
                    callback(error);
                }
            });
        }

        refreshUntilCompleted(callback: (completed: boolean) => void) {
            this.refresh((error: Error) => {
                if (this.isCompiling()) {
                    callback(false);
                    setTimeout(this.refreshUntilCompleted.bind(this, callback), 20000);
                }
                else {
                    callback(true);
                }
            });
        }

        syncRepository(repo: {url: string, branch?: string}, callback: (error: Error) => void) {
            this.client.project.syncRepository(this.data.id, repo, callback);
        }

        uploadZip(file: File, callback: (error: Error) => void) {
            this.client.project.uploadZip(this.data.id, file, (data: ProjectData, error: Error) => {
                if (error) {
                    callback(error);
                }
                else {
                    this.syncNewData(data);
                    callback(null);
                }
            });
        }

        updatePublicZip(url: string, callback: (error: Error) => void) {
            this.client.project.updatePublicZip(this.data.id, url, (data: ProjectData, error: Error) => {
                if (error) {
                    callback(error);
                }
                else {
                    this.syncNewData(data);
                    callback(null);
                }
            });
        }

        getIconSrc(platform: string) {
            return this.client.project.getIconSrc(this.data.id, platform);
        }

        getIconBlob(platform: string, callback: (data: Blob, error: Error) => void) {
            this.client.project.getIconBlob(this.data.id, platform, callback);
        }

        getCompilation(platform: string): Compilation {
            for (var i = 0; i < this.compilations.length; ++i) {
                if (this.compilations[i].platform === platform) {
                    return this.compilations[i];
                }
            }
            return null;
        }

        getDownloadLink(platform: string): string {
            var compilation = this.getCompilation(platform);
            if (compilation && compilation.getDownloadLink()) {
                return compilation.getDownloadLink() + '?access_token=' + this.client.getAccessToken();
            }
            return '';
        }

        delete(callback: (error: Error) => void) {
            this.client.project.delete(this.data.id, callback);
        }

    }
}
