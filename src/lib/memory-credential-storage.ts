"use strict";

import {ICredentialStorage} from "./interfaces/i-credential-storage";

export default class MemoryCredentialStorage implements ICredentialStorage {
	private readonly DEFAULT_EXPIRATION = 3600;

	private accessToken: string;
	// TODO: private expires: Date;
	private refreshToken: string;

	public getAccessToken(): string {
		return this.accessToken;
	}

	public setAccessToken(value: string, expires: number = this.DEFAULT_EXPIRATION): void {
		// TODO: const expireDate = new Date();
		// TODO: expireDate.setSeconds(expireDate.getSeconds() + expires);

		this.accessToken = value;
		// TODO: this.expires = expireDate;
	}

	public getRefreshToken(): string {
		return this.refreshToken;
	}

	public setRefreshToken(value: string): void {
		this.refreshToken = value;
	}

	public logout(): void {
		this.accessToken = null;
		this.refreshToken = null;
		// TODO: this.expires = null;
	}
}
