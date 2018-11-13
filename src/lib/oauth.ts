"use strict";

import {default as popsicle, plugins, Response} from "popsicle";

import APIURL from "./api-url";
import {GrantType} from "./enums/e-grant-type";
import {IAccessToken} from "./interfaces/i-access-token";

export default class OAuth {
	public static setup(
		grantType: GrantType, clientId: string, clientSecret?: string,
		redirectURI?: string, oAuthURL?: string,
	): void {
		this.grantType = grantType;
		this.clientId = clientId;
		this.clientSecret = clientSecret;
		this.redirectURI = redirectURI;
		if (oAuthURL) {
			APIURL.OAUTH = oAuthURL;
		}
	}

	/**
	 * Generate the URL where the user can authorize the application following the Authorization Code OAuth flow.
	 * @param scope Scope of the access the application requests.
	 * @returns {string} The URL where the user can authorize the application.
	 */
	public static authorizeAuthorizationCode(scope?: string): string {
		OAuth.checkOAuthHasBeenSetup();
		if (this.grantType === GrantType.AuthorizationCode) {
			this.state = OAuth.generateRandomString();
			return (
				APIURL.AUTHORIZATION +
				"?response_type=" +
				"code" +
				"&client_id=" +
				this.clientId +
				"&redirect_uri=" +
				this.redirectURI +
				(scope ? "&scope=" + scope : "") +
				"&state=" +
				this.state
			);
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
	 * This object created it when generating the authorization URL.
	 * The server should have returned the same string and will be tested now.
	 * @returns {Promise<IAccessToken>} Promise of the access token.
	 */
	public static async tokenExchangeAuthorizationCode(pCode: string, state: string): Promise<IAccessToken> {
		OAuth.checkOAuthHasBeenSetup();
		const parameters = {
			client_id: this.clientId,
			client_secret: this.clientSecret,
			code: pCode,
			grant_type: this.grantType,
			redirect_uri: this.redirectURI,
		};

		if (this.grantType !== GrantType.AuthorizationCode) {
			throw new Error("Grant Type is " + this.grantType + " when it should be " + GrantType.AuthorizationCode);
		}
		if (!OAuth.isStateValid(state)) {
			throw new Error("State is " + state + " when it should be " + this.state);
		}

		return (await popsicle(
			{
				body: parameters,
				headers: {"Content-Type": "application/x-www-form-urlencoded"},
				method: "POST",
				url: APIURL.ACCESS_TOKEN,
			},
		).use(plugins.parse("json"))).body;
	}

	public static tokenExchangeClientCredentials() {
		console.warn("Access with Client Credentials not available yet");
		OAuth.checkOAuthHasBeenSetup();
		// const request = CocoonAPI.request({
		// 	method: "POST",
		// 	url: APIURL.ACCESS_TOKEN
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
	 * @returns {string} The URL where the user can authorize the application.
	 */
	public static authorizeImplicit(scope?: string): string {
		OAuth.checkOAuthHasBeenSetup();
		if (this.grantType === GrantType.Implicit) {
			return (
				APIURL.AUTHORIZATION +
				"?response_type=" +
				"token" +
				"&client_id=" +
				this.clientId +
				"&redirect_uri=" +
				this.redirectURI +
				(scope ? "&scope=" + scope : "")
			);
		} else {
			console.error("Grant Type is " + this.grantType + " when it should be " + GrantType.Implicit);
			throw new Error("Invalid OAuth flow");
		}
	}

	/**
	 * Exchange a username and password for the access token following the Password OAuth flow.
	 * @param pUsername Username of a user.
	 * @param pPassword Password of a user.
	 * @returns {Promise<IAccessToken>} Promise of the access token.
	 */
	public static async tokenExchangePassword(pUsername: string, pPassword: string): Promise<IAccessToken> {
		OAuth.checkOAuthHasBeenSetup();
		const parameters = {
			client_id: this.clientId,
			client_secret: this.clientSecret, // FIXME: Password flow should't need clientSecret
			grant_type: this.grantType,
			password: pPassword,
			username: pUsername,
		};

		if (this.grantType !== GrantType.Password) {
			throw new Error("Grant Type is " + this.grantType + " when it should be " + GrantType.Password);
		}

		return (await popsicle(
			{
				body: parameters,
				headers: {"Content-Type": "application/x-www-form-urlencoded"},
				method: "POST",
				url: APIURL.ACCESS_TOKEN,
			},
		).use(plugins.parse("json"))).body;

	}

	/**
	 * Exchange a refresh token for a new access token following the Refresh Token OAuth flow.
	 * @param pRefreshToken Refresh token to use to get new credentials.
	 * @returns {Promise<IAccessToken>} Promise of the access token.
	 */
	public static async tokenExchangeRefreshToken(pRefreshToken: string): Promise<IAccessToken> {
		OAuth.checkOAuthHasBeenSetup();
		const parameters = {
			client_id: this.clientId,
			client_secret: this.clientSecret, // FIXME: Refresh Token flow should't need clientSecret
			grant_type: GrantType.RefreshToken,
			refresh_token: pRefreshToken,
		};
		return (await popsicle(
			{
				body: parameters,
				headers: {"Content-Type": "application/x-www-form-urlencoded"},
				method: "POST",
				url: APIURL.ACCESS_TOKEN,
			},
		).use(plugins.parse("json"))).body;
	}

	/**
	 * Log out of the API.
	 * @returns {Promise<Response>} Promise of a successful logout.
	 */
	public static async logout(): Promise<Response> {
		OAuth.checkOAuthHasBeenSetup();
		return popsicle(
			{
				method: "GET",
				url: APIURL.LOGOUT,
			},
		);
	}

	private static clientId: string;
	private static clientSecret: string;
	private static grantType: GrantType;
	private static redirectURI: string;
	private static state: string;

	private static generateRandomString(length: number = 16): string {
		let text = "";
		const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		for (let i = 0; i < length; i++) {
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		}
		return text;
	}

	private static checkOAuthHasBeenSetup(): void {
		if (!this.grantType || !this.clientId) {
			throw new Error("OAuth has not been set up yet. " +
				"Use OAuth.setup([grantType], [clientId]) before attempting to use any of the other methods.");
		}
	}

	private static isStateValid(state: string): boolean {
		return this.state === state;
	}
}
