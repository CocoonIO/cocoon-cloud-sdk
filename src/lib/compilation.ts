"use strict";

import APIURL from "./api-url";
import CocoonAPI from "./cocoon-api";
import {Platform} from "./enums/e-platform";
import {Status} from "./enums/e-status";
import {IProjectData} from "./interfaces/i-project-data";

export default class Compilation {
	public get downloadLink(): string {
		return this._downloadLink ?
			this._downloadLink + "?" + APIURL.ACCESS_TOKEN_PARAMETER + CocoonAPI.credentials.getAccessToken()
			: "";
	}

	public get error(): string {
		return this.isErred() ? this._error : "";
	}

	public get platform(): Platform {
		return this._platform;
	}

	public get status(): Status {
		return this._status;
	}

	private devapp: boolean;
	private _downloadLink: string;
	private _error: string;
	private _platform: Platform;
	private _status: Status;

	public constructor(data: IProjectData, platform: Platform) {
		this.devapp = data.devapp && data.devapp.length > 0 && data.devapp.indexOf(platform as any) >= 0;
		this._downloadLink = data.download ? data.download[platform] : null;
		this._error = data.error ? data.error[platform] : null;
		this._platform = platform;
		this._status = data.status ? data.status[platform] : (data.date_compiled ? Status.Disabled : Status.Created);
	}

	/**
	 * Check if the compilations is for a DevApp.
	 * @returns {boolean}
	 */
	public isDevApp(): boolean {
		return this.devapp;
	}

	/**
	 * Check if the compilation erred.
	 * @returns {boolean}
	 */
	public isErred(): boolean {
		return !!this._error;
	}

	/**
	 * Check if the compilation has finished correctly.
	 * @returns {boolean}
	 */
	public isReady(): boolean {
		return this._status === Status.Completed && !this.isErred();
	}
}
