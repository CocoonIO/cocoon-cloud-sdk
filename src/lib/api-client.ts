"use strict";

import {default as popsicle, plugins, Request, RequestOptions} from "popsicle/dist/common";

import APIURL from "./api-url";
import CookieCredentialStorage from "./cookie-credential-storage";
import {GrantType} from "./enums/e-grant-type";
import {StorageType} from "./enums/e-storage-type";
import {ICocoonTemplate} from "./interfaces/i-cocoon-template";
import {ICocoonVersion} from "./interfaces/i-cocoon-version";
import {ICredentialStorage} from "./interfaces/i-credential-storage";
import {IError} from "./interfaces/i-error";
import {IOauthMode} from "./interfaces/i-oauth-mode";
import MemoryCredentialStorage from "./memory-credential-storage";

export default class APIClient {

	public static get credentials(): ICredentialStorage {
		return this._credentials;
	}

	public static isLoggedIn(): boolean {
		if (APIClient._credentials) {
			return !!APIClient._credentials.getAccessToken();
		} else {
			return false;
		}
	}

	/**
	 * Logs an user in the API. This should be the first function executed by this SDK.
	 * @param user
	 * @param pPassword
	 * @param credentials
	 * @param callback
	 */
	public static logIn(user: string, pPassword: string,
	                    credentials: {clientId: string, clientSecret?: string, apiURL?: string, oauthURL?: string},
	                    callback: (error?: IError) => void = () => {
		                    return;
	                    }) {
		if (credentials.apiURL) {
			APIURL.BASE = credentials.apiURL;
		}
		if (credentials.oauthURL) {
			APIURL.OAUTH = credentials.oauthURL;
		}
		APIClient.setOauthMode({grantType: GrantType.Implicit});
		const objParams = {
			client_id: credentials.clientId,
			client_secret: credentials.clientSecret,
			grant_type: "password",
			password: pPassword,
			username: user,
		};

		APIClient.request({
			body: objParams,
			headers: {"Content-Type": "application/x-www-form-urlencoded"},
			method: "POST", url: APIURL.LOGIN,
		}, false)
			.use(plugins.parse("json"))
			.then((response) => {
				if (response.body.access_token) {
					APIClient._credentials.setAccessToken(response.body.access_token, response.body.expires_in);
					APIClient._credentials.setRefreshToken(response.body.refresh_token);
					callback();
				} else {
					callback({code: "0", message: "access_token not found in the response"});
				}
			}, (error) => {
				callback(error);
			});
	}

	/**
	 * Logs the user out of the API and removes the cached credentials.
	 * @param callback
	 */
	public static logout(callback: (error?: IError) => void = () => {
		return;
	}) {
		APIClient.request({
			method: "GET",
			url: APIURL.LOGOUT,
		})
			.then(() => {
				APIClient._credentials.logout();
				callback();
			}, (error) => {
				callback(error);
			});
	}

	/**
	 * Get a list of the available templates for Cocoon.io projects from the API.
	 * @param callback
	 */
	public static getCocoonTemplates(callback: (templates: ICocoonTemplate[], error?: IError) => void) {
		APIClient.request({
			method: "GET",
			url: APIURL.COCOON_TEMPLATES,
		})
			.use(plugins.parse("json"))
			.then((response) => {
				callback(response.body);
			}, (error) => {
				callback(null, error);
			});
	}

	/**
	 * Get a list of the available Cocoon.io versions.
	 * @param callback
	 */
	public static getCocoonVersions(callback: (versions: ICocoonVersion[], error?: IError) => void) {
		APIClient.request({
			method: "GET",
			url: APIURL.COCOON_VERSIONS,
		})
			.use(plugins.parse("json"))
			.then((response) => {
				callback(response.body);
			}, (error) => {
				callback(null, error);
			});
	}

	/**
	 * Make a request to the API with your credentials.
	 * @param options HTTP options of the request.
	 * @param addCredentials Set to false in case you don't want to automatically add your credentials to the API.
	 * @returns {any}
	 */
	public static request(options: RequestOptions, addCredentials: boolean = true): Request {
		if (addCredentials) {
			if (!options.headers) {
				options.headers = {};
			}
			options.headers.Authorization = "Bearer " + APIClient._credentials.getAccessToken();
		}
		return popsicle(options);
	}

	private static _credentials: ICredentialStorage;
	private static oauthMode: IOauthMode;

	private static setOauthMode(options: IOauthMode = {grantType: GrantType.Implicit}) {
		APIClient.oauthMode = options;
		if (APIClient.oauthMode.storageType === StorageType.Memory || typeof document === "undefined") {
			APIClient._credentials = new MemoryCredentialStorage();
		} else {
			APIClient._credentials = new CookieCredentialStorage();
		}
	}
}
