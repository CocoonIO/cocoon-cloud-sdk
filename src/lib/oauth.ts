"use strict";

import {plugins} from "popsicle/dist/common";

import CocoonAPI from "./cocoon-api";
import {GrantType} from "./enums/e-grant-type";

export default class OAuth {

	private static generateRandomString(length: number = 16): string {
		let text = "";
		const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		for (let i = 0; i < length; i++) {
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		}
		return text;
	}

	private clientId: string;
	private clientSecret: string;
	private grantType: GrantType;
	private oAuthURL: string;
	private redirectURI: string;
	private readonly ACCESS_TOKEN = "access_token";
	private readonly AUTHORIZATION = "login";
	private readonly LOGOUT = "logout";

	private state: string;

	public constructor(grantType: GrantType, clientId: string, clientSecret?: string,
	                   redirectURI?: string, oAuthURL: string = "https://cloud.cocoon.io/oauth/") {
		this.clientId = clientId;
		this.clientSecret = clientSecret;
		this.grantType = grantType;
		this.oAuthURL = oAuthURL;
		this.redirectURI = redirectURI;
	}

	public get accessTokenURL(): string {
		return this.oAuthURL + this.ACCESS_TOKEN;
	}

	public get authorizationURL(): string {
		return this.oAuthURL + this.AUTHORIZATION;
	}

	public get logoutURL(): string {
		return this.oAuthURL.replace("oauth", this.LOGOUT);
	}

	/**
	 * Generate the URL where the user can authorize the application following the Authorization Code OAuth flow.
	 * @param scope Scope of the access the application requests.
	 * @returns {string} The URL where the user can authorize the application.
	 */
	public authorizeAuthorizationCode(scope?: string): string {
		if (this.grantType === GrantType.AuthorizationCode) {
			this.state = OAuth.generateRandomString(16);
			return this.authorizationURL
				+ "?response_type=" + "code"
				+ "&client_id=" + this.clientId
				+ "&redirect_uri=" + this.redirectURI
				+ (scope ? "&scope=" + scope : "")
				+ "&state=" + this.state;
		} else {
			console.error("Grant Type is " + this.grantType + " when it should be " + GrantType.AuthorizationCode);
			throw new Error("Invalid OAuth flow");
		}
	}

	/**
	 * Exchange the code you got after the user authorized the application for the access token following
	 * the Authorization Code OAuth flow.
	 * @param pCode Code found in the redirect URL, as a parameter, after the user authorizes the application.
	 * @param state Random string present in the redirect URL, as a parameter, after the user authorizes the application.
	 * The SDK created it when generating the authorization URL.
	 * The server should have returned the same string and will be tested now.
	 */
	public tokenExchangeAuthorizationCode(pCode: string, state: string): Promise<{}> {
		const parameters = {
			client_id: this.clientId,
			client_secret: this.clientSecret,
			code: pCode,
			grant_type: this.grantType,
			redirect_uri: this.redirectURI,
		};
		const request = CocoonAPI.request({
			body: parameters,
			headers: {"Content-Type": "application/x-www-form-urlencoded"},
			method: "POST",
			url: this.accessTokenURL,
		}, false)
		.use(plugins.parse("json"));

		if (this.grantType === GrantType.AuthorizationCode && this.isStateValid(state)) {
			if (this.grantType !== GrantType.AuthorizationCode) {
				console.error("Grant Type is " + this.grantType + " when it should be " + GrantType.AuthorizationCode);
			}
			if (!this.isStateValid(state)) {
				console.error("State is " + state + " when it should be " + this.state);
			}
			request.abort();
		}

		return new Promise((resolve, reject) => {
			request
			.then((response) => {
				resolve(response.body);
			})
			.catch((error) => {
				reject(error);
			});
		});
	}

	public tokenExchangeClientCredentials() {
		console.warn("Access with Client Credentials not available yet");
		// const request = CocoonAPI.request({
		// 	method: "POST",
		// 	url: this.accessTokenURL
		// 	+ "?grant_type=" + this.grantType
		// 	+ "&client_id=" + this.clientId
		// 	+ "&client_secret=" + this.clientSecret,
		// }, false)
		// .use(plugins.parse("json"));
		//
		// if (this.grantType !== GrantType.ClientCredentials) {
		// 	console.error("Grant Type is " + this.grantType + " when it should be " + GrantType.ClientCredentials);
		// 	request.abort();
		// }
		// return request;
	}

	/**
	 * Generate the URL where the user can authorize the application following the Implicit OAuth flow.
	 * @param scope Scope of the access the application requests.
	 * @returns {string}
	 */
	public authorizeImplicit(scope?: string): string {
		if (this.grantType === GrantType.Implicit) {
			return this.authorizationURL
				+ "?response_type=" + "token"
				+ "&client_id=" + this.clientId
				+ "&redirect_uri=" + this.redirectURI
				+ (scope ? "&scope=" + scope : "");
		} else {
			console.error("Grant Type is " + this.grantType + " when it should be " + GrantType.Implicit);
			throw new Error("Invalid OAuth flow");
		}
	}

	/**
	 * Exchange a username and password for the access token following the Password OAuth flow.
	 * @param pUsername Username of a user.
	 * @param pPassword Password of a user.
	 */
	public tokenExchangePassword(pUsername: string, pPassword: string): Promise<{}> {
		const parameters = {
			client_id: this.clientId,
			client_secret: this.clientSecret, // FIXME: Password flow should't need clientSecret
			grant_type: this.grantType,
			password: pPassword,
			username: pUsername,
		};
		const request = CocoonAPI.request({
			body: parameters,
			headers: {"Content-Type": "application/x-www-form-urlencoded"},
			method: "POST",
			url: this.accessTokenURL,
		}, false)
		.use(plugins.parse("json"));

		if (this.grantType !== GrantType.Password) {
			console.error("Grant Type is " + this.grantType + " when it should be " + GrantType.Password);
			request.abort();
		}

		return new Promise((resolve, reject) => {
			request
			.then((response) => {
				resolve(response.body);
			})
			.catch((error) => {
				reject(error);
			});
		});
	}

	/**
	 * Log out of the API.
	 */
	public logout(): Promise<{}> {
		return new Promise((resolve, reject) => {
			CocoonAPI.request({
				method: "GET",
				url: this.logoutURL,
			})
			.then(() => {
				resolve();
			})
			.catch((error) => {
				reject(error);
			});
		});
	}

	private isStateValid(state: string): boolean {
		return this.state === state;
	}
}
