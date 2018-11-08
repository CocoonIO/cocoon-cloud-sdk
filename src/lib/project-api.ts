"use strict";

import {form, plugins} from "popsicle";

import APIURL from "./api-url";
import CocoonAPI from "./cocoon-api";
import {Platform} from "./enums/e-platform";
import {IProjectData} from "./interfaces/i-project-data";
import {IRepositoryData} from "./interfaces/i-repository-data";
import Project from "./project";

export default class ProjectAPI {
	/**
	 * Create a project from a Zip file.
	 * @param file Zip file containing the source code. Can contain a config.xml file too.
	 * @returns {Promise<Project>} Promise of the project created.
	 */
	public static async createFromZipUpload(file: File): Promise<Project> {
		return new Project(await ProjectAPI.createFromZipUploadUnprocessed(file));
	}

	/**
	 * Create a project from a Zip file.
	 * @param file Zip file containing the source code. Can contain a config.xml file too.
	 * @returns {Promise<IProjectData>} Promise of the data of the project created.
	 */
	public static async createFromZipUploadUnprocessed(file: File): Promise<IProjectData> {
		const formData = form({});
		formData.append("file", file, "sourceURL.zip");

		return (await CocoonAPI.request({
			body: formData,
			method: "POST",
			url: APIURL.CREATE_PROJECT_ZIP,
		}, [plugins.parse("json")])).body;
	}

	/**
	 * Create a project from an URL .
	 * @param pUrl URL to fetch the source code. Can contain a config.xml file too.
	 * @returns {Promise<Project>} Promise of the project created.
	 */
	public static async createFromURL(pUrl: string): Promise<Project> {
		return new Project(await ProjectAPI.createFromURLUnprocessed(pUrl));
	}

	/**
	 * Create a project from an URL .
	 * @param pUrl URL to fetch the source code. Can contain a config.xml file too.
	 * @returns {Promise<IProjectData>} Promise of the data of the project created.
	 */
	public static async createFromURLUnprocessed(pUrl: string): Promise<IProjectData> {
		return (await CocoonAPI.request({
			body: {url: pUrl},
			method: "POST",
			url: APIURL.CREATE_PROJECT_URL,
		}, [plugins.parse("json")])).body;
	}

	/**
	 * Create a project from a git repository to clone.
	 * @param repo Object containing a URL of the git repo and the name of the branch to checkout
	 * (defaults to master if not set). It's used to fetch the source code for the project. Can contain a config.xml too.
	 * @returns {Promise<Project>} Promise of the project created.
	 */
	public static async createFromRepository(repo: IRepositoryData): Promise<Project> {
		return new Project(await ProjectAPI.createFromRepositoryUnprocessed(repo));
	}

	/**
	 * Create a project from a git repository to clone.
	 * @param repo Object containing a URL of the git repo and the name of the branch to checkout
	 * (defaults to master if not set). It's used to fetch the source code for the project. Can contain a config.xml too.
	 * @returns {Promise<IProjectData>} Promise of the data of the project created.
	 */
	public static async createFromRepositoryUnprocessed(repo: IRepositoryData): Promise<IProjectData> {
		return (await CocoonAPI.request({
			body: repo,
			method: "POST",
			url: APIURL.CREATE_PROJECT_GITHUB,
		}, [plugins.parse("json")])).body;
	}

	/**
	 * Fetch the information of a project.
	 * @param projectId ID of the project to fetch.
	 * @returns {Promise<Project>} Promise of the project fetched.
	 */
	public static async get(projectId: string): Promise<Project> {
		return new Project(await ProjectAPI.getUnprocessed(projectId));
	}

	/**
	 * Fetch the information of a project.
	 * @param projectId ID of the project to fetch.
	 * @returns {Promise<IProjectData>} Promise of the data of the project fetched.
	 */
	public static async getUnprocessed(projectId: string): Promise<IProjectData> {
		return (await CocoonAPI.request({
			method: "GET",
			url: APIURL.PROJECT(projectId),
		}, [plugins.parse("json")])).body;
	}

	/**
	 * Delete a project.
	 * @param projectId ID of the project to delete.
	 * @returns {Promise<void>} Promise of a successful operation.
	 */
	public static async delete(projectId: string): Promise<void> {
		await CocoonAPI.request({
			method: "DELETE",
			url: APIURL.PROJECT(projectId),
		});
	}

	/**
	 * Fetch a list containing the information of all the projects.
	 * @returns {Promise<Project[]>} Promise of the list of all the projects.
	 */
	public static async list(): Promise<Project[]> {
		return (await ProjectAPI.listUnprocessed()).map((projectData) => {
			return new Project(projectData);
		});
	}

	/**
	 * Fetch a list containing the information of all the projects.
	 * @returns {Promise<IProjectData[]>} Promise of the list of data of all the projects.
	 */
	public static async listUnprocessed(): Promise<IProjectData[]> {
		return (await CocoonAPI.request({
			method: "GET",
			url: APIURL.BASE_PROJECT,
		}, [plugins.parse("json")])).body;
	}

	/**
	 * Get the icon of a project.
	 * @param projectId ID of the project to get the icon.
	 * @param platform Platform to get the icon. If not set the default icon will be fetched.
	 * @returns {Promise<Blob>} Promise of the icon of the project.
	 */
	public static async getIconBlob(projectId: string, platform: Platform): Promise<Blob> {
		return (await CocoonAPI.request(
			{
				method: "GET",
				url: APIURL.ICON(projectId, platform),
			}, [], false)).body;
	}

	/**
	 * Set the icon of a project.
	 * @param icon Image to use as new icon. Recommended 2048x2048 PNG.
	 * @param projectId ID of the project to set the icon.
	 * @param platform Platform to set the icon. If not set the default icon will be updated.
	 * @returns {Promise<void>} Promise of a successful operation.
	 */
	public static async setIconBlob(icon: File, projectId: string, platform: Platform): Promise<void> {
		const formData = form({});
		formData.append("file", icon, "icon.png");

		await CocoonAPI.request({
			body: formData,
			method: "POST",
			url: APIURL.ICON(projectId, platform || Platform.ExplicitDefault),
		});
	}

	/**
	 * Get the splash of the project.
	 * @param projectId ID of the project to get the splash.
	 * @param platform Platform to get the splash. If not set the default splash will be fetched.
	 * @returns {Promise<Blob>} Promise of the splash of the project.
	 */
	public static async getSplashBlob(projectId: string, platform: Platform): Promise<Blob> {
		return (await CocoonAPI.request(
			{
				method: "GET",
				url: APIURL.SPLASH(projectId, platform),
			}, [], false)).body;
	}

	/**
	 * Set the splash of the project.
	 * @param splash Image to use as new splash. Recommended 2048x2048 PNG.
	 * @param projectId ID of the project to set the splash.
	 * @param platform Platform to set the splash. If not set the default splash will be updated.
	 * @returns {Promise<void>} Promise of a successful operation.
	 */
	public static async setSplashBlob(splash: File, projectId: string, platform: Platform): Promise<void> {
		const formData = form({});
		formData.append("file", splash, "splash.png");

		await CocoonAPI.request({
			body: formData,
			method: "POST",
			url: APIURL.SPLASH(projectId, platform),
		});
	}

	/**
	 * Update the source code of a project uploading a zip file.
	 * @param projectId ID of the project to update.
	 * @param file Zip file containing the source code. Can contain a config.xml file too.
	 * @returns {Promise<Project>} Promise of the project updated.
	 */
	public static async updateZip(projectId: string, file: File): Promise<Project> {
		return new Project(await ProjectAPI.updateZipUnprocessed(projectId, file));
	}

	/**
	 * Update the source code of a project uploading a zip file.
	 * @param projectId ID of the project to update.
	 * @param file Zip file containing the source code. Can contain a config.xml file too.
	 * @returns {Promise<IProjectData>} Promise of the data of the project updated.
	 */
	public static async updateZipUnprocessed(projectId: string, file: File): Promise<IProjectData> {
		const formData = form({});
		formData.append("file", file, "sourceURL.zip");

		return (await CocoonAPI.request({
			body: formData,
			method: "PUT",
			url: APIURL.PROJECT(projectId),
		}, [plugins.parse("json")])).body;
	}

	/**
	 * Update the source code of a project providing a URL to fetch it from.
	 * @param projectId ID of the project to update.
	 * @param pUrl URL to fetch the source code. Can contain a config.xml file too.
	 * @returns {Promise<Project>} Promise of the project updated.
	 */
	public static async updateURL(projectId: string, pUrl: string): Promise<Project> {
		return new Project(await ProjectAPI.updateURLUnprocessed(projectId, pUrl));
	}

	/**
	 * Update the source code of a project providing a URL to fetch it from.
	 * @param projectId ID of the project to update.
	 * @param pUrl URL to fetch the source code. Can contain a config.xml file too.
	 * @returns {Promise<IProjectData>} Promise of the data of the project updated.
	 */
	public static async updateURLUnprocessed(projectId: string, pUrl: string): Promise<IProjectData> {
		return (await CocoonAPI.request({
			body: {url: pUrl},
			method: "PUT",
			url: APIURL.SYNC_URL(projectId),
		}, [plugins.parse("json")])).body;
	}

	/**
	 * Update the source code of a project providing a git repository to clone.
	 * @param projectId ID of the project to update.
	 * @param repo Object containing a URL of the git repo and the name of the branch to checkout
	 * (defaults to master if not set). It's used to fetch the source code for the project. Can contain a config.xml too.
	 * @returns {Promise<Project>} Promise of the project updated.
	 */
	public static async updateRepository(projectId: string, repo: {url: string; branch?: string}): Promise<Project> {
		return new Project(await ProjectAPI.updateRepositoryUnprocessed(projectId, repo));
	}

	/**
	 * Update the source code of a project providing a git repository to clone.
	 * @param projectId ID of the project to update.
	 * @param repo Object containing a URL of the git repo and the name of the branch to checkout
	 * (defaults to 'master' if not set). It's used to fetch the source code for the project. Can contain a config.xml too.
	 * @returns {Promise<IProjectData>} Promise of the data of the project updated.
	 */
	public static async updateRepositoryUnprocessed(
		projectId: string,
		repo: {url: string; branch?: string},
	): Promise<IProjectData> {
		await CocoonAPI.request({
			body: repo,
			method: "PUT",
			url: APIURL.SYNC_GITHUB(projectId),
		});
		return ProjectAPI.getUnprocessed(projectId);
	}

	/**
	 * Fetches the config.xml file of a project.
	 * @param projectId ID of the project to fetch the config.xml.
	 * @returns {Promise<string>} Promise of the config.xml file of a project.
	 */
	public static async getConfigXml(projectId: string): Promise<string> {
		return (await CocoonAPI.request({
			method: "GET",
			url: APIURL.CONFIG(projectId),
		})).body;
	}

	/**
	 * Updates the config.xml file of a project.
	 * @param projectId ID of the project to update the config.xml.
	 * @param xml New config.xml for the project.
	 * @returns {Promise<Project>} Promise of the project whose config.xml was updated.
	 */
	public static async updateConfigXml(projectId: string, xml: string): Promise<Project> {
		return new Project(await ProjectAPI.updateConfigXmlUnprocessed(projectId, xml));
	}

	/**
	 * Updates the config.xml file of a project.
	 * @param projectId ID of the project to update the config.xml.
	 * @param xml New config.xml for the project.
	 * @returns {Promise<IProjectData>} Promise of the date of the project whose config.xml was updated.
	 */
	public static async updateConfigXmlUnprocessed(projectId: string, xml: string): Promise<IProjectData> {
		const formData = form({});
		formData.append("file", xml, "config.xml");

		await CocoonAPI.request({
			body: formData,
			method: "PUT",
			url: APIURL.CONFIG(projectId),
		});
		return ProjectAPI.getUnprocessed(projectId);
	}

	/**
	 * Places a project in the compilation queue.
	 * @param projectId ID of the project to compile.
	 * @returns {Promise<void>} Promise of a successful operation.
	 */
	public static async compile(projectId: string): Promise<void> {
		await CocoonAPI.request({
			method: "POST",
			url: APIURL.COMPILE(projectId),
		});
	}

	/**
	 * Places a DevApp of a project in the compilation queue.
	 * @param projectId ID of the project to compile a DevApp.
	 * @returns {Promise<void>} Promise of a successful operation.
	 */
	public static async compileDevApp(projectId: string): Promise<void> {
		await CocoonAPI.request({
			method: "POST",
			url: APIURL.COMPILE_DEVAPP(projectId),
		});
	}

	/**
	 * Assigns a singing key to the correspondent platform of a project. Next compilations will try to use the key.
	 * If there was another key assigned to the platform the new key overwrites it.
	 * @param projectId ID of the project to assign the key.
	 * @param signingKeyId ID of the signing key that you want to assign to the project.
	 * @returns {Promise<void>} Promise of a successful operation.
	 */
	public static async assignSigningKey(projectId: string, signingKeyId: string): Promise<void> {
		await CocoonAPI.request({
			method: "POST",
			url: APIURL.PROJECT_SIGNING_KEY(projectId, signingKeyId),
		});
	}

	/**
	 * Removes the signing key assigned to the indicated project platform.
	 * @param projectId ID of the project to remove the key.
	 * @param signingKeyId ID of the signing key that you want to remove from the project.
	 * @returns {Promise<void>} Promise of a successful operation.
	 */
	public static async removeSigningKey(projectId: string, signingKeyId: string): Promise<void> {
		await CocoonAPI.request({
			method: "DELETE",
			url: APIURL.PROJECT_SIGNING_KEY(projectId, signingKeyId),
		});
	}
}
