"use strict";

import {ICredentialStorage} from "./interfaces/i-credential-storage";

export default class MemoryCredentialStorage implements ICredentialStorage {
	get expireDate(): Date {
		return this._expireDate;
	}

	private readonly DEFAULT_EXPIRATION = 3600;

	private accessToken: string;
	private _expireDate: Date;
	private refreshToken: string;

	public getAccessToken(): string {
		return this.accessToken;
	}

	public setAccessToken(value: string, expires: number = this.DEFAULT_EXPIRATION): void {
		const expireDate = new Date();
		expireDate.setSeconds(expireDate.getSeconds() + expires);

		this.accessToken = value;
		this._expireDate = expireDate;
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
		this._expireDate = null;
	}
}
