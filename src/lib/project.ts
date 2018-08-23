"use strict";

import XMLSugar from "cocoon-xml-sugar";

import APIURL from "./api-url";
import Compilation from "./compilation";
import {Platform} from "./enums/e-platform";
import {Status} from "./enums/e-status";
import {IProjectData} from "./interfaces/i-project-data";
import ProjectAPI from "./project-api";
import SigningKey from "./signing-key";

export default class Project {
	public get id(): string {
		return this._id;
	}

	public get name(): string {
		return this._name;
	}

	public set name(value: string) {
		this.getConfigXML()
			.then((xmlSugar) => {
				xmlSugar.setName(value);
			})
			.catch((error) => {
				console.trace(error);
				throw error;
			});
		this._name = value;
	}

	public get bundleID(): string {
		return this._bundleID;
	}

	public set bundleID(value: string) {
		this.getConfigXML()
			.then((xmlSugar) => {
				xmlSugar.setBundleId(value);
			})
			.catch((error) => {
				console.trace(error);
				throw error;
			});
		this._bundleID = value;
	}

	public get version(): string {
		return this._version;
	}

	public set version(value: string) {
		this.getConfigXML()
			.then((xmlSugar) => {
				xmlSugar.setVersion(value);
			})
			.catch((error) => {
				console.trace(error);
				throw error;
			});
		this._version = value;
	}

	get origin(): {[p: string]: string} {
		return this._origin;
	}

	public get dateCompiled(): Date {
		return this._dateCompiled;
	}

	public get dateCreated(): Date {
		return this._dateCreated;
	}

	public get dateUpdated(): Date {
		return this._dateUpdated;
	}

	public get compilations(): {[platform: string]: Compilation} {
		return this._compilations;
	}

	public get errors(): {[p: string]: string} {
		return this._errors;
	}

	public get keys(): {[platform: string]: SigningKey} {
		return this._keys;
	}

	public get sourceURL(): string {
		return this._sourceURL;
	}

	public get configURL(): string {
		return APIURL.CONFIG(this._id);
	}

	private readonly DEFAULT_WAIT_TIME = 10000;
	private readonly MAX_WAIT_TIME = 3600000;

	private _id: string;
	private _name: string;
	private _bundleID: string;
	private _version: string;
	private _origin: {[key: string]: string};
	private _dateCompiled: Date;
	private _dateCreated: Date;
	private _dateUpdated: Date;
	// TODO: private icon: string;
	// TODO: private icons: {[platform: string]: string};
	// TODO: private splashes: {[platform: string]: string};
	private _compilations: {[platform: string]: Compilation};
	private _errors: {[key: string]: string};
	private _keys: {[platform: string]: SigningKey};
	private _sourceURL: string;
	private configXML: XMLSugar;

	public constructor(projectData: IProjectData) {
		this.init(projectData);
	}

	/**
	 * Get the date of the last usage of the project.
	 * @returns {Date} Date of the last usage of the project.
	 */
	public getLastUse(): Date {
		const dates = [];
		dates.push(this._dateCreated);
		dates.push(this._dateCompiled);
		dates.push(this._dateUpdated);
		return new Date(Math.max.apply(null, dates));
	}

	/**
	 * Check if there is at least an ongoing compilation.
	 * @returns {boolean} If there is at least an ongoing compilation.
	 */
	public isCompiling(): boolean {
		for (const platform in this._compilations) {
			if (!this._compilations.hasOwnProperty(platform)) {
				continue;
			}
			const status = this._compilations[platform].status;
			if (status === Status.Compiling || status === Status.Waiting) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Get a sugar for the XML configuration of the project.
	 * @returns {Promise<XMLSugar>} Promise of a sugar for the XML configuration of the project.
	 */
	public getConfigXML(): Promise<XMLSugar> {
		if (this.configXML) {
			return Promise.resolve(this.configXML);
		} else {
			return ProjectAPI.getConfigXml(this._id)
				.then((xml) => {
					this.configXML = new XMLSugar(xml);
					return this.configXML;
				})
				.catch((error) => {
					console.trace(error);
					throw error;
				});
		}
	}

	/**
	 * Get the icon of the project.
	 * @param platform Platform to get the icon. If not set the default icon will be fetched.
	 * @returns {Promise<Blob>} Promise of the icon of the project.
	 */
	public getIconBlob(platform: Platform): Promise<Blob> {
		return ProjectAPI.getIconBlob(this._id, platform);
	}

	/**
	 * Set the icon of the project.
	 * @param icon Image to use as new icon. Recommended 2048x2048 PNG.
	 * @param platform Platform to set the icon. If not set the default icon will be updated.
	 * @returns {Promise<void>} Promise of a successful operation.
	 */
	public setIconBlob(icon: File, platform: Platform): Promise<void> {
		return ProjectAPI.setIconBlob(icon, this._id, platform);
	}

	/**
	 * Get the splash of the project.
	 * @param platform Platform to get the splash. If not set the default splash will be fetched.
	 * @returns {Promise<Blob>} Promise of the splash of the project.
	 */
	public getSplashBlob(platform: Platform): Promise<Blob> {
		return ProjectAPI.getSplashBlob(this._id, platform);
	}

	/**
	 * Set the splash of the project.
	 * @param splash Image to use as new splash. Recommended 2048x2048 PNG.
	 * @param platform Platform to set the splash. If not set the default splash will be updated.
	 * @returns {Promise<void>} Promise of a successful operation.
	 */
	public setSplashBlob(splash: File, platform: Platform): Promise<void> {
		return ProjectAPI.setSplashBlob(splash, this._id, platform);
	}

	/**
	 * Update the project uploading a zip file.
	 * @param file Zip file containing the source code. Can contain a config.xml file too.
	 * @returns {Promise<void>} Promise of a successful operation.
	 */
	public updateZip(file: File): Promise<void> {
		return ProjectAPI.updateZipUnprocessed(this._id, file)
			.then((projectData) => {
				this.init(projectData);
				return;
			})
			.catch((error) => {
				console.trace(error);
				throw error;
			});
	}

	/**
	 * Update the project providing a URL.
	 * @param url URL to fetch the source code. Can contain a config.xml file too.
	 * @returns {Promise<void>} Promise of a successful operation.
	 */
	public updateURL(url: string): Promise<void> {
		return ProjectAPI.updateURLUnprocessed(this._id, url)
			.then((projectData) => {
				this.init(projectData);
				return;
			})
			.catch((error) => {
				console.trace(error);
				throw error;
			});
	}

	/**
	 * Update the project providing a git repository to clone.
	 * @param repo Object containing a URL of the git repo and the name of the branch to checkout
	 * (defaults to master if not set). It's used to fetch the source code for the project. Can contain a config.xml too.
	 * @returns {Promise<void>} Promise of a successful operation.
	 */
	public updateRepository(repo: {url: string; branch?: string}): Promise<void> {
		return ProjectAPI.updateRepositoryUnprocessed(this._id, repo)
			.then((projectData) => {
				this.init(projectData);
				return;
			})
			.catch((error) => {
				console.trace(error);
				throw error;
			});
	}

	/**
	 * Update the config.xml file of the project.
	 * @param xml New config.xml for the project.
	 * @returns {Promise<void>} Promise of a successful operation.
	 */
	public updateConfigXml(xml: string): Promise<void> {
		return ProjectAPI.updateConfigXmlUnprocessed(this._id, xml)
			.then((projectData) => {
				this.init(projectData);
				this.configXML = new XMLSugar(xml);
				return;
			})
			.catch((error) => {
				console.trace(error);
				throw error;
			});
	}

	/**
	 * Places the project in the compilation queue.
	 * @returns {Promise<void>} Promise of a successful operation.
	 */
	public compile(): Promise<void> {
		return ProjectAPI.compile(this._id);
	}

	/**
	 * Places a DevApp of the project in the compilation queue.
	 * @returns {Promise<void>} Promise of a successful operation.
	 */
	public compileDevApp(): Promise<void> {
		return ProjectAPI.compileDevApp(this._id);
	}

	/**
	 * Fetches the project from Cocoon.io.
	 * @returns {Promise<void>} Promise of a successful operation.
	 */
	public refresh(): Promise<void> {
		return ProjectAPI.getUnprocessed(this._id)
			.then((projectData) => {
				this.init(projectData);
				return;
			})
			.catch((error) => {
				console.trace(error);
				throw error;
			});
	}

	/**
	 * Uploads the current config.xml extracted from the sugar.
	 * @returns {Promise<void>} Promise of a successful operation.
	 */
	public refreshCocoon(): Promise<void> {
		return this.getConfigXML()
			.then((xmlSugar) => {
				return this.updateConfigXml(xmlSugar.xml());
			})
			.catch((error) => {
				console.trace(error);
				throw error;
			});
	}

	/**
	 * Fetches the project from Cocoon.io until every compilations is completed.
	 * @param callback Function that will be called for each attempt to check if the compilations are completed.
	 * @param interval Interval between fetches.
	 * @param maxWaitTime Maximum time to wait.
	 */
	public refreshUntilCompleted(
		callback: (completed: boolean, error?: any) => void,
		interval: number = this.DEFAULT_WAIT_TIME,
		maxWaitTime: number = this.MAX_WAIT_TIME,
	): void {
		const limitTime = Date.now() + maxWaitTime;
		this.refresh()
			.then(() => {
				if (this.isCompiling()) {
					if (Date.now() < limitTime) {
						setTimeout(() => {
							this.refreshUntilCompleted(callback, interval, maxWaitTime);
						}, interval);
						callback(false);
					} else {
						throw new Error("It wasn't possible to compile the project in the time limit frame.");
					}
				} else {
					callback(true);
				}
			})
			.catch((error) => {
				callback(false, error);
			});
	}

	/**
	 * Assigns a singing key to the correspondent platform of the project. Next compilations will try to use the key.
	 * If there was another key assigned to the platform the new key overwrites it.
	 * @param signingKey Signing key to assign.
	 * @returns {Promise<void>} Promise of a successful operation.
	 */
	public assignSigningKey(signingKey: SigningKey): Promise<void> {
		return ProjectAPI.assignSigningKey(this._id, signingKey.id)
			.then(() => {
				this._keys[signingKey.platform] = signingKey;
				return;
			})
			.catch((error) => {
				console.trace(error);
				throw error;
			});
	}

	/**
	 * Removes the signing key assigned to the indicated project platform.
	 * @param platform Platform to remove the signing key from.
	 * @returns {Promise<void>} Promise of a successful operation.
	 */
	public removeSigningKey(platform: Platform): Promise<void> {
		if (this._keys[platform]) {
			return ProjectAPI.removeSigningKey(this._id, this._keys[platform].id)
				.then(() => {
					this._keys[platform] = undefined;
					return;
				})
				.catch((error) => {
					console.trace(error);
					throw error;
				});
		} else {
			console.error("There is no signing key for the " + platform + " platform in the project " + this._id);
			throw new Error("There is no signing key for the " + platform + " platform in the project " + this._id);
		}
	}

	/**
	 * Deletes the project.
	 * @returns {Promise<void>} Promise of a successful operation.
	 */
	public delete(): Promise<void> {
		return ProjectAPI.delete(this._id);
	}

	private init(projectData: IProjectData): void {
		this._id = projectData.id;
		this._name = projectData.title;
		this._bundleID = projectData.package;
		this._version = projectData.version;
		this._sourceURL = projectData.source;
		this._origin = projectData.origin;
		this._dateCreated = new Date(projectData.date_created);
		this._dateUpdated = new Date(projectData.date_updated);
		this._dateCompiled = new Date(projectData.date_compiled);
		// TODO: this.icon = projectData.icon;
		// TODO: this.icons = projectData.icons;
		// TODO: this.splashes = projectData.splashes;
		this._errors = projectData.error;
		this.configXML = null;
		this._compilations = {};
		for (const platform of projectData.platforms) {
			this._compilations[platform] = new Compilation(projectData, platform);
		}
		this._keys = {};
		Object.keys(projectData.keys).forEach((platform) => {
			this._keys[platform] = new SigningKey(projectData.keys[platform], platform as any);
		});
	}
}
