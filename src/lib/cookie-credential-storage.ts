"use strict";

import CookieHelper from "./cookie-helper";
import {ICredentialStorage} from "./interfaces/i-credential-storage";

export default class CookieCredentialStorage implements ICredentialStorage {
	private readonly DEFAULT_EXPIRATION = 3600;
	private readonly MAX_DATE = new Date(8640000000000000);

	public getAccessToken(): string {
		return CookieHelper.getItem("access_token");
	}

	public setAccessToken(value: string, expires: number = this.DEFAULT_EXPIRATION) {
		const expireDate = new Date();
		expireDate.setSeconds(expireDate.getSeconds() + expires);

		CookieHelper.setItem("access_token", value, expireDate);
	}

	public getRefreshToken(): string {
		return CookieHelper.getItem("refresh_token");
	}

	public setRefreshToken(value: string) {
		CookieHelper.setItem("access_token", value, this.MAX_DATE);
	}

	public logout() {
		CookieHelper.removeItem("access_token");
		CookieHelper.removeItem("refresh_token");
	}
}
