"use strict";

import {ICredentialStorage} from "./interfaces/i-credential-storage";

export default class MemoryCredentialStorage implements ICredentialStorage {
	private readonly DEFAULT_EXPIRATION = 3600;

	private accessToken: string;
	private expires: Date;
	private refreshToken: string;

	public getAccessToken(): string {
		return this.accessToken;
	}

	public setAccessToken(value: string, expires: number = this.DEFAULT_EXPIRATION) {
		const expireDate = new Date();
		expireDate.setSeconds(expireDate.getSeconds() + expires);

		this.accessToken = value;
		this.expires = expireDate;
	}

	public getRefreshToken(): string {
		return this.refreshToken;
	}

	public setRefreshToken(value: string) {
		this.refreshToken = value;
	}

	public logout() {
		this.accessToken = null;
		this.refreshToken = null;
		this.expires = null;
	}
}
