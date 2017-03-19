"use strict";

import {form, plugins} from "popsicle/dist/common";

import APIClient from "./api-client";
import APIURL from "./api-url";
import {platforms} from "./constants/c-platforms";
import {IError} from "./interfaces/i-error";
import {IProjectData} from "./interfaces/i-project-data";
import {IRepositoryData} from "./interfaces/i-repository-data";

export default class ProjectAPI {
	/**
	 * Create a project from a Zip file.
	 * @param file Zip file containing the source code. Can contain a config.xml file too.
	 * @param callback
	 */
	public static createFromZipUpload(file: File, callback: (projectData: IProjectData, error?: IError) => void) {
		const formData = form({});
		formData.append("file", file, "sourceURL.zip");

		APIClient.request({
			body: formData,
			method: "POST",
			url: APIURL.CREATE_PROJECT_ZIP,
		})
			.use(plugins.parse("json"))
			.then((response) => {
				callback(response.body);
			}, (error) => {
				callback(null, error);
			});
	}

	/**
	 * Create a project from an URL .
	 * @param pUrl URL to fetch the source code. Can contain a config.xml file too.
	 * @param callback
	 */
	public static createFromURL(pUrl: string, callback: (projectData: IProjectData, error?: IError) => void) {
		APIClient.request({
			body: {url: pUrl},
			method: "POST",
			url: APIURL.CREATE_PROJECT_URL,
		})
			.use(plugins.parse("json"))
			.then((response) => {
				callback(response.body);
			}, (error) => {
				callback(null, error);
			});
	}

	/**
	 * Create a project from a git repository to clone.
	 * @param repo Object containing a URL of the git repo and the name of the branch to checkout
	 * (defaults to master if not set). It's used to fetch the source code for the project. Can contain a config.xml too.
	 * @param callback
	 */
	public static createFromRepository(repo: IRepositoryData,
	                                   callback: (projectData: IProjectData, error?: IError) => void) {
		APIClient.request({
			body: repo,
			method: "POST",
			url: APIURL.CREATE_PROJECT_GITHUB,
		})
			.use(plugins.parse("json"))
			.then((response) => {
				callback(response.body);
			}, (error) => {
				callback(null, error);
			});
	}

	/**
	 * Fetch the information of a project.
	 * @param projectId ID of the project to fetch.
	 * @param callback
	 */
	public static get(projectId: string, callback: (projectData: IProjectData, error?: IError) => void) {
		APIClient.request({
			method: "GET",
			url: APIURL.PROJECT(projectId),
		})
			.use(plugins.parse("json"))
			.then((response) => {
				callback(response.body);
			}, (error) => {
				callback(null, error);
			});
	}

	/**
	 * Delete a project.
	 * @param projectId ID of the project to delete.
	 * @param callback
	 */
	public static delete(projectId: string, callback: (error?: IError) => void) {
		APIClient.request({
			method: "DELETE",
			url: APIURL.PROJECT(projectId),
		})
			.then(() => {
				callback();
			}, (error) => {
				callback(error);
			});
	}

	/**
	 * Fetch a list containing the information of all the project.
	 * @param callback
	 */
	public static list(callback: (projectsData: IProjectData[], error?: IError) => void) {
		APIClient.request({
			method: "GET",
			url: APIURL.BASE_PROJECT,
		})
			.use(plugins.parse("json"))
			.then((response) => {
				callback(response.body);
			}, (error) => {
				callback(null, error);
			});
	}

	/**
	 * Get the icon of a project.
	 * @param projectId ID of the project to get the icon.
	 * @param platform Platform to get the icon. If not set the default icon will be fetched.
	 * @param callback
	 */
	public static getIconBlob(projectId: string, platform: string, callback: (data: Blob, error?: IError) => void) {
		APIClient.request({
			method: "GET",
			url: APIURL.ICON(projectId, platform),
		}, false)
			.then((response) => {
				callback(response.body);
			}, (error) => {
				callback(null, error);
			});
	}

	/**
	 * Set the icon of a project.
	 * @param icon Image to use as new icon. Recommended 2048x2048 PNG.
	 * @param projectId ID of the project to set the icon.
	 * @param platform Platform to set the icon. If not set the default icon will be updated.
	 * @param callback
	 */
	public static setIconBlob(icon: File, projectId: string, platform: string, callback: (error?: IError) => void) {
		const formData = form({});
		formData.append("file", icon, "icon.png");

		APIClient.request({
			body: formData,
			method: "PUT",
			url: APIURL.ICON(projectId, platform || platforms.ExplicitDefault),
		})
			.then(() => {
				callback();
			}, (error) => {
				callback(error);
			});
	}

	/**
	 * Get the splash of the project.
	 * @param projectId ID of the project to get the splash.
	 * @param platform Platform to get the splash. If not set the default splash will be fetched.
	 * @param callback
	 */
	public static getSplashBlob(projectId: string, platform: string, callback: (data: Blob, error?: IError) => void) {
		APIClient.request({
			method: "GET",
			url: APIURL.SPLASH(projectId, platform),
		}, false)
			.then((response) => {
				callback(response.body);
			}, (error) => {
				callback(null, error);
			});
	}

	/**
	 * Set the splash of the project.
	 * @param splash Image to use as new splash. Recommended 2048x2048 PNG.
	 * @param projectId ID of the project to set the splash.
	 * @param platform Platform to set the splash. If not set the default splash will be updated.
	 * @param callback
	 */
	public static setSplashBlob(splash: File, projectId: string, platform: string, callback: (error?: IError) => void) {
		const formData = form({});
		formData.append("file", splash, "splash.png");

		APIClient.request({
			body: formData,
			method: "PUT",
			url: APIURL.SPLASH(projectId, platform),
		})
			.then(() => {
				callback();
			}, (error) => {
				callback(error);
			});
	}

	/**
	 * Update the source code of a project uploading a zip file.
	 * @param projectId ID of the project to update.
	 * @param file Zip file containing the source code. Can contain a config.xml file too.
	 * @param callback
	 */
	public static updateZip(projectId: string, file: File, callback: (data: IProjectData, error?: IError) => void) {
		const formData = form({});
		formData.append("file", file, "sourceURL.zip");

		APIClient.request({
			body: formData,
			method: "PUT",
			url: APIURL.PROJECT(projectId),
		})
			.use(plugins.parse("json"))
			.then((response) => {
				callback(response.body);
			}, (error) => {
				callback(null, error);
			});
	}

	/**
	 * Update the source code of a project providing a URL to fetch it from.
	 * @param projectId ID of the project to update.
	 * @param pUrl URL to fetch the source code. Can contain a config.xml file too.
	 * @param callback
	 */
	public static updateURL(projectId: string, pUrl: string, callback: (data: IProjectData, error?: IError) => void) {
		APIClient.request({
			body: {url: pUrl},
			method: "PUT",
			url: APIURL.SYNC_URL(projectId),
		})
			.use(plugins.parse("json"))
			.then((response) => {
				callback(response.body);
			}, (error) => {
				callback(null, error);
			});
	}

	/**
	 * Update the source code of a project providing a git repository to clone.
	 * @param projectId ID of the project to update.
	 * @param repo Object containing a URL of the git repo and the name of the branch to checkout
	 * (defaults to master if not set). It's used to fetch the source code for the project. Can contain a config.xml too.
	 * @param callback
	 */
	public static updateRepository(projectId: string, repo: {url: string, branch?: string},
	                               callback: (data: IProjectData, error?: IError) => void) {
		APIClient.request({
			body: repo,
			method: "PUT",
			url: APIURL.SYNC_GITHUB(projectId),
		})
			.then(() => {
				ProjectAPI.get(projectId, callback);
			}, (error) => {
				callback(null, error);
			});
	}

	/**
	 * Fetches the config.xml file of a project.
	 * @param projectId ID of the project to fetch the config.xml.
	 * @param callback
	 */
	public static getConfigXml(projectId: string, callback: (xml: string, error?: IError) => void) {
		APIClient.request({
			method: "GET",
			url: APIURL.CONFIG(projectId),
		})
			.then((response) => {
				callback(response.body);
			}, (error) => {
				callback(null, error);
			});
	}

	/**
	 * Updates the config.xml file of a project.
	 * @param projectId ID of the project to update the config.xml.
	 * @param xml New config.xml for the project.
	 * @param callback
	 */
	public static updateConfigXml(projectId: string, xml: string,
	                              callback: (projectData: IProjectData, error?: IError) => void) {
		const formData = form({});
		formData.append("file", xml, "config.xml");

		APIClient.request({
			body: formData,
			method: "PUT",
			url: APIURL.CONFIG(projectId),
		})
			.then(() => {
				ProjectAPI.get(projectId, callback);
			}, (error) => {
				callback(null, error);
			});
	}

	/**
	 * Places a project in the compilation queue.
	 * @param projectId ID of the project to compile.
	 * @param callback
	 */
	public static compile(projectId: string, callback: (error?: IError) => void) {
		APIClient.request({
			method: "POST",
			url: APIURL.COMPILE(projectId),
		})
			.then(() => {
				callback();
			}, (error) => {
				callback(error);
			});
	}

	/**
	 * Places a DevApp of a project in the compilation queue.
	 * @param projectId ID of the project to compile a DevApp.
	 * @param callback
	 */
	public static compileDevApp(projectId: string, callback: (error?: IError) => void) {
		APIClient.request({
			method: "POST",
			url: APIURL.COMPILE_DEVAPP(projectId),
		})
			.then(() => {
				callback();
			}, (error) => {
				callback(error);
			});
	}

	/**
	 * Assigns a singing key to the correspondent platform of a project. Next compilations will try to use the key.
	 * If there was another key assigned to the platform the new key overwrites it.
	 * @param projectId ID of the project to assign the key.
	 * @param signingKeyId ID of the signing key that you want to assign to the project.
	 * @param callback
	 */
	public static assignSigningKey(projectId: string, signingKeyId: string, callback: (error?: IError) => void) {
		APIClient.request({
			method: "POST",
			url: APIURL.PROJECT_SIGNING_KEY(projectId, signingKeyId),
		})
			.then(() => {
				callback();
			}, (error) => {
				callback(error);
			});
	}

	/**
	 * Removes the signing key assigned to the indicated project platform.
	 * @param projectId ID of the project to remove the key.
	 * @param signingKeyId ID of the signing key that you want to remove from the project.
	 * @param callback
	 */
	public static removeSigningKey(projectId: string, signingKeyId: string, callback: (error?: IError) => void) {
		APIClient.request({
			method: "DELETE",
			url: APIURL.PROJECT_SIGNING_KEY(projectId, signingKeyId),
		})
			.then(() => {
				callback();
			}, (error) => {
				callback(error);
			});
	}
}
