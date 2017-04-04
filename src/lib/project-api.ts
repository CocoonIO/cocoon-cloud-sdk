"use strict";

import {form, plugins} from "popsicle/dist/common";

import APIURL from "./api-url";
import CocoonAPI from "./cocoon-api";
import {Platform} from "./enums/e-platform";
import {IProjectData} from "./interfaces/i-project-data";
import {IRepositoryData} from "./interfaces/i-repository-data";

export default class ProjectAPI {
	/**
	 * Create a project from a Zip file.
	 * @param file Zip file containing the source code. Can contain a config.xml file too.
	 */
	public static createFromZipUpload(file: File): Promise<IProjectData> {
		const formData = form({});
		formData.append("file", file, "sourceURL.zip");

		return CocoonAPI.request({
			body: formData,
			method: "POST",
			url: APIURL.CREATE_PROJECT_ZIP,
		})
		.use(plugins.parse("json"))
		.then((response) => {
			return response.body;
		})
		.catch((error) => {
			return error;
		});
	}

	/**
	 * Create a project from an URL .
	 * @param pUrl URL to fetch the source code. Can contain a config.xml file too.
	 */
	public static createFromURL(pUrl: string): Promise<IProjectData> {
		return CocoonAPI.request({
			body: {url: pUrl},
			method: "POST",
			url: APIURL.CREATE_PROJECT_URL,
		})
		.use(plugins.parse("json"))
		.then((response) => {
			return response.body;
		})
		.catch((error) => {
			return error;
		});
	}

	/**
	 * Create a project from a git repository to clone.
	 * @param repo Object containing a URL of the git repo and the name of the branch to checkout
	 * (defaults to master if not set). It's used to fetch the source code for the project. Can contain a config.xml too.
	 */
	public static createFromRepository(repo: IRepositoryData): Promise<IProjectData> {
		return CocoonAPI.request({
			body: repo,
			method: "POST",
			url: APIURL.CREATE_PROJECT_GITHUB,
		})
		.use(plugins.parse("json"))
		.then((response) => {
			return response.body;
		})
		.catch((error) => {
			return error;
		});
	}

	/**
	 * Fetch the information of a project.
	 * @param projectId ID of the project to fetch.
	 */
	public static get(projectId: string): Promise<IProjectData> {
		return CocoonAPI.request({
			method: "GET",
			url: APIURL.PROJECT(projectId),
		})
		.use(plugins.parse("json"))
		.then((response) => {
			return response.body;
		})
		.catch((error) => {
			return error;
		});
	}

	/**
	 * Delete a project.
	 * @param projectId ID of the project to delete.
	 */
	public static delete(projectId: string): Promise<void> {
		return CocoonAPI.request({
			method: "DELETE",
			url: APIURL.PROJECT(projectId),
		})
		.then(() => {
			return;
		})
		.catch((error) => {
			return error;
		});
	}

	/**
	 * Fetch a list containing the information of all the project.
	 */
	public static list(): Promise<IProjectData[]> {
		return CocoonAPI.request({
			method: "GET",
			url: APIURL.BASE_PROJECT,
		})
		.use(plugins.parse("json"))
		.then((response) => {
			return response.body;
		})
		.catch((error) => {
			return error;
		});
	}

	/**
	 * Get the icon of a project.
	 * @param projectId ID of the project to get the icon.
	 * @param platform Platform to get the icon. If not set the default icon will be fetched.
	 */
	public static getIconBlob(projectId: string, platform: Platform): Promise<Blob> {
		return CocoonAPI.request({
			method: "GET",
			url: APIURL.ICON(projectId, platform),
		}, false)
		.then((response) => {
			return response.body;
		})
		.catch((error) => {
			return error;
		});
	}

	/**
	 * Set the icon of a project.
	 * @param icon Image to use as new icon. Recommended 2048x2048 PNG.
	 * @param projectId ID of the project to set the icon.
	 * @param platform Platform to set the icon. If not set the default icon will be updated.
	 */
	public static setIconBlob(icon: File, projectId: string, platform: Platform): Promise<void> {
		const formData = form({});
		formData.append("file", icon, "icon.png");

		return CocoonAPI.request({
			body: formData,
			method: "PUT",
			url: APIURL.ICON(projectId, platform || Platform.ExplicitDefault),
		})
		.then(() => {
			return;
		})
		.catch((error) => {
			return error;
		});
	}

	/**
	 * Get the splash of the project.
	 * @param projectId ID of the project to get the splash.
	 * @param platform Platform to get the splash. If not set the default splash will be fetched.
	 */
	public static getSplashBlob(projectId: string, platform: Platform): Promise<Blob> {
		return CocoonAPI.request({
			method: "GET",
			url: APIURL.SPLASH(projectId, platform),
		}, false)
		.then((response) => {
			return response.body;
		})
		.catch((error) => {
			return error;
		});
	}

	/**
	 * Set the splash of the project.
	 * @param splash Image to use as new splash. Recommended 2048x2048 PNG.
	 * @param projectId ID of the project to set the splash.
	 * @param platform Platform to set the splash. If not set the default splash will be updated.
	 */
	public static setSplashBlob(splash: File, projectId: string, platform: Platform): Promise<void> {
		const formData = form({});
		formData.append("file", splash, "splash.png");

		return CocoonAPI.request({
			body: formData,
			method: "PUT",
			url: APIURL.SPLASH(projectId, platform),
		})
		.then(() => {
			return;
		})
		.catch((error) => {
			return error;
		});
	}

	/**
	 * Update the source code of a project uploading a zip file.
	 * @param projectId ID of the project to update.
	 * @param file Zip file containing the source code. Can contain a config.xml file too.
	 */
	public static updateZip(projectId: string, file: File): Promise<IProjectData> {
		const formData = form({});
		formData.append("file", file, "sourceURL.zip");

		return CocoonAPI.request({
			body: formData,
			method: "PUT",
			url: APIURL.PROJECT(projectId),
		})
		.use(plugins.parse("json"))
		.then((response) => {
			return response.body;
		})
		.catch((error) => {
			return error;
		});
	}

	/**
	 * Update the source code of a project providing a URL to fetch it from.
	 * @param projectId ID of the project to update.
	 * @param pUrl URL to fetch the source code. Can contain a config.xml file too.
	 */
	public static updateURL(projectId: string, pUrl: string): Promise<IProjectData> {
		return CocoonAPI.request({
			body: {url: pUrl},
			method: "PUT",
			url: APIURL.SYNC_URL(projectId),
		})
		.use(plugins.parse("json"))
		.then((response) => {
			return response.body;
		})
		.catch((error) => {
			return error;
		});
	}

	/**
	 * Update the source code of a project providing a git repository to clone.
	 * @param projectId ID of the project to update.
	 * @param repo Object containing a URL of the git repo and the name of the branch to checkout
	 * (defaults to master if not set). It's used to fetch the source code for the project. Can contain a config.xml too.
	 */
	public static updateRepository(projectId: string, repo: { url: string, branch?: string }): Promise<IProjectData> {
		return CocoonAPI.request({
			body: repo,
			method: "PUT",
			url: APIURL.SYNC_GITHUB(projectId),
		})
		.then(() => {
			return ProjectAPI.get(projectId);
		})
		.catch((error) => {
			return error;
		});
	}

	/**
	 * Fetches the config.xml file of a project.
	 * @param projectId ID of the project to fetch the config.xml.
	 */
	public static getConfigXml(projectId: string): Promise<string> {
		return CocoonAPI.request({
			method: "GET",
			url: APIURL.CONFIG(projectId),
		})
		.then((response) => {
			return response.body;
		})
		.catch((error) => {
			return error;
		});
	}

	/**
	 * Updates the config.xml file of a project.
	 * @param projectId ID of the project to update the config.xml.
	 * @param xml New config.xml for the project.
	 */
	public static updateConfigXml(projectId: string, xml: string): Promise<IProjectData> {
		const formData = form({});
		formData.append("file", xml, "config.xml");

		return CocoonAPI.request({
			body: formData,
			method: "PUT",
			url: APIURL.CONFIG(projectId),
		})
		.then(() => {
			return ProjectAPI.get(projectId);
		})
		.catch((error) => {
			return error;
		});
	}

	/**
	 * Places a project in the compilation queue.
	 * @param projectId ID of the project to compile.
	 */
	public static compile(projectId: string): Promise<void> {
		return CocoonAPI.request({
			method: "POST",
			url: APIURL.COMPILE(projectId),
		})
		.then(() => {
			return;
		})
		.catch((error) => {
			return error;
		});
	}

	/**
	 * Places a DevApp of a project in the compilation queue.
	 * @param projectId ID of the project to compile a DevApp.
	 */
	public static compileDevApp(projectId: string): Promise<void> {
		return CocoonAPI.request({
			method: "POST",
			url: APIURL.COMPILE_DEVAPP(projectId),
		})
		.then(() => {
			return;
		})
		.catch((error) => {
			return error;
		});
	}

	/**
	 * Assigns a singing key to the correspondent platform of a project. Next compilations will try to use the key.
	 * If there was another key assigned to the platform the new key overwrites it.
	 * @param projectId ID of the project to assign the key.
	 * @param signingKeyId ID of the signing key that you want to assign to the project.
	 */
	public static assignSigningKey(projectId: string, signingKeyId: string): Promise<void> {
		return CocoonAPI.request({
			method: "POST",
			url: APIURL.PROJECT_SIGNING_KEY(projectId, signingKeyId),
		})
		.then(() => {
			return;
		})
		.catch((error) => {
			return error;
		});
	}

	/**
	 * Removes the signing key assigned to the indicated project platform.
	 * @param projectId ID of the project to remove the key.
	 * @param signingKeyId ID of the signing key that you want to remove from the project.
	 */
	public static removeSigningKey(projectId: string, signingKeyId: string): Promise<void> {
		return CocoonAPI.request({
			method: "DELETE",
			url: APIURL.PROJECT_SIGNING_KEY(projectId, signingKeyId),
		})
		.then(() => {
			return;
		})
		.catch((error) => {
			return error;
		});
	}
}
