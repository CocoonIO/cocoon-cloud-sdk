"use strict";

import * as detectNode from "detect-node";
import {default as popsicle, plugins, Request, RequestOptions} from "popsicle/dist/common";
import status = require("popsicle-status");

import APIURL from "./api-url";
import CookieCredentialStorage from "./cookie-credential-storage";
import {ICocoonTemplate} from "./interfaces/i-cocoon-template";
import {ICocoonVersion} from "./interfaces/i-cocoon-version";
import {ICredentialStorage} from "./interfaces/i-credential-storage";
import MemoryCredentialStorage from "./memory-credential-storage";

export default class CocoonAPI {

	public static get credentials(): ICredentialStorage {
		return this._credentials;
	}

	/**
	 * Checks if the API access works.
	 * @returns {boolean} If the API access works.
	 */
	public static checkAPIAccess(): boolean {
		if (CocoonAPI.credentials) {
			return !!CocoonAPI.credentials.getAccessToken();
		} else {
			return false;
		}
	}

	/**
	 * Prepares the API to be used. After successfully setting up the API access, you can use the whole SDK.
	 * @param accessToken Access token provided by the Cocoon.io server.
	 * @param refreshToken Refresh token provided by the Cocoon.io server.
	 * @param expiration Time, in seconds, the access token is valid.
	 * @param apiURL URL where the Cocoon.io API is located.
	 */
	public static setupAPIAccess(accessToken: string, refreshToken: string, expiration?: number, apiURL?: string): void {
		if (apiURL) {
			APIURL.BASE = apiURL;
		}
		CocoonAPI._credentials = (detectNode) ? new MemoryCredentialStorage() : new CookieCredentialStorage();
		CocoonAPI._credentials.setAccessToken(accessToken, expiration);
		CocoonAPI._credentials.setRefreshToken(refreshToken);
	}

	/**
	 * Removes the stored credentials.
	 */
	public static closeAPIAccess(): void {
		CocoonAPI.credentials.logout();
	}

	/**
	 * Get a list of the available templates for Cocoon.io projects from the API.
	 * @returns {Promise<ICocoonTemplate[]>} Promise of the list of the available templates for Cocoon.io projects.
	 */
	public static getCocoonTemplates(): Promise<ICocoonTemplate[]> {
		return CocoonAPI.request({
			method: "GET",
			url: APIURL.COCOON_TEMPLATES,
		})
		.use(plugins.parse("json"))
		.then((response) => {
			return response.body;
		})
		.catch((error) => {
			console.trace(error);
			throw error;
		});
	}

	/**
	 * Get a list of the available Cocoon.io versions.
	 * @returns {Promise<ICocoonVersion[]>} Promise of the list of the available Cocoon.io versions.
	 */
	public static getCocoonVersions(): Promise<ICocoonVersion[]> {
		return CocoonAPI.request({
			method: "GET",
			url: APIURL.COCOON_VERSIONS,
		})
		.use(plugins.parse("json"))
		.then((response) => {
			return response.body;
		})
		.catch((error) => {
			console.trace(error);
			throw error;
		});
	}

	/**
	 * Make a request to the API with your credentials.
	 * @param options HTTP options of the request.
	 * @param addCredentials Set to false in case you don't want to automatically add your credentials to the API.
	 * @returns {Request}
	 */
	public static request(options: RequestOptions, addCredentials: boolean = true): Request {
		if (addCredentials) {
			if (!options.headers) {
				options.headers = {};
			}
			if (CocoonAPI._credentials) {
				options.headers.Authorization = "Bearer " + CocoonAPI._credentials.getAccessToken();
			} else {
				console.error("API access has not been set up");
				return popsicle(options).abort();
			}
		}
		return popsicle(options)
		.use(status());
	}

	private static _credentials: ICredentialStorage;
}
