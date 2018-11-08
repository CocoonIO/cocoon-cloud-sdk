"use strict";

import {Platform} from "./enums/e-platform";

export default class APIURL {
	public static get BASE(): string {
		return APIURL._BASE;
	}

	public static set BASE(value: string) {
		APIURL._BASE = value;
	}

	public static get BASE_PROJECT(): string {
		return APIURL.BASE + APIURL._BASE_PROJECT;
	}

	public static get COCOON_VERSIONS(): string {
		return APIURL.BASE + APIURL._COCOON_VERSIONS;
	}

	public static get COCOON_TEMPLATES(): string {
		return APIURL.BASE + APIURL._COCOON_TEMPLATES;
	}

	public static get CREATE_PROJECT_GITHUB(): string {
		return APIURL.BASE_PROJECT + APIURL._CREATE_PROJECT_GITHUB;
	}

	public static get CREATE_PROJECT_URL(): string {
		return APIURL.BASE_PROJECT + APIURL._CREATE_PROJECT_URL;
	}

	public static get CREATE_PROJECT_ZIP(): string {
		return APIURL.BASE_PROJECT + APIURL._CREATE_PROJECT_ZIP;
	}

	public static get SIGNING_KEYS(): string {
		return APIURL.BASE + APIURL._SIGNING_KEYS;
	}

	public static get USER_PROFILE(): string {
		return APIURL.BASE + APIURL._USER_PROFILE;
	}

	public static PROJECT(projectId: string): string {
		return APIURL.BASE_PROJECT + projectId;
	}

	public static COMPILE(projectId: string): string {
		return APIURL.PROJECT(projectId) + APIURL._COMPILE;
	}

	public static COMPILE_DEVAPP(projectId: string): string {
		return APIURL.PROJECT(projectId) + APIURL._COMPILE_DEVAPP;
	}

	public static CONFIG(projectId: string): string {
		return APIURL.PROJECT(projectId) + APIURL._CONFIG;
	}

	public static SYNC_GITHUB(projectId: string): string {
		return APIURL.PROJECT(projectId) + APIURL._SYNC_GITHUB;
	}

	public static SYNC_URL(projectId: string): string {
		return APIURL.PROJECT(projectId) + APIURL._SYNC_URL;
	}

	public static ICON(projectId: string, platform: Platform = Platform.ImplicitDefault): string {
		return APIURL.PROJECT(projectId) + APIURL._ICON + platform;
	}

	public static SPLASH(projectId: string, platform: Platform = Platform.ExplicitDefault): string {
		return APIURL.PROJECT(projectId) + APIURL._SPLASH + platform;
	}

	public static SIGNING_KEY(signingKeyId: string): string {
		return APIURL.SIGNING_KEYS + signingKeyId;
	}

	public static CREATE_SIGNING_KEY(platform: Platform): string {
		return APIURL.SIGNING_KEYS + platform;
	}

	public static PROJECT_SIGNING_KEY(projectId: string, signingKeyId: string): string {
		return APIURL.PROJECT(projectId) + "/" + APIURL._SIGNING_KEYS + signingKeyId;
	}

	public static API_REFRESH(refreshToken: string): string {
		return APIURL.BASE + APIURL._API_REFRESH + "?rToken=" + refreshToken;
	}

	public static get ACCESS_TOKEN_PARAMETER(): string {
		return APIURL._ACCESS_TOKEN_PARAMETER;
	}

	public static get REFRESH_TOKEN_PARAMETER(): string {
		return APIURL._REFRESH_TOKEN_PARAMETER;
	}

	private static _BASE = "https://api.cocoon.io/v1/";
	private static readonly _BASE_PROJECT = "project/";

	// Endpoints
	private static readonly _API_REFRESH = "api/refresh";
	private static readonly _COCOON_TEMPLATES = "cocoon/templates/";
	private static readonly _COCOON_VERSIONS = "cocoon/versions/";
	private static readonly _COMPILE = "/compile/";
	private static readonly _COMPILE_DEVAPP = "/devapp/";
	private static readonly _CONFIG = "/config";
	private static readonly _CREATE_PROJECT_GITHUB = "github/";
	private static readonly _CREATE_PROJECT_URL = "url/";
	private static readonly _CREATE_PROJECT_ZIP = "";
	private static readonly _ICON = "/icon/";
	private static readonly _SPLASH = "/splash/";
	private static readonly _SIGNING_KEYS = "signkey/";
	private static readonly _SYNC_GITHUB = "/github/";
	private static readonly _SYNC_URL = "/url/";
	private static readonly _USER_PROFILE = "me/";

	// Parameters
	private static readonly _ACCESS_TOKEN_PARAMETER = "access_token=";
	private static readonly _REFRESH_TOKEN_PARAMETER = "refresh_token=";
}
