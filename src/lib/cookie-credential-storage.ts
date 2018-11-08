"use strict";

import CookieHelper from "./cookie-helper";
import {ICredentialStorage} from "./interfaces/i-credential-storage";

export default class CookieCredentialStorage implements ICredentialStorage {
	get expireDate(): Date {
		return this._expireDate;
	}

	private readonly DEFAULT_EXPIRATION = 3600;
	private readonly MAX_DATE = new Date(8640000000000000);

	private _expireDate: Date;

	public getAccessToken(): string {
		return CookieHelper.getItem("access_token");
	}

	public setAccessToken(value: string, expires: number = this.DEFAULT_EXPIRATION): void {
		const expireDate = new Date();
		expireDate.setSeconds(expireDate.getSeconds() + expires);

		CookieHelper.setItem("access_token", value, expireDate);
		this._expireDate = expireDate;
	}

	public getRefreshToken(): string {
		return CookieHelper.getItem("refresh_token");
	}

	public setRefreshToken(value: string): void {
		CookieHelper.setItem("refresh_token", value, this.MAX_DATE);
	}

	public logout(): void {
		CookieHelper.removeItem("access_token");
		CookieHelper.removeItem("refresh_token");
		this._expireDate = null;
	}
}
