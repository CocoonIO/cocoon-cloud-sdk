"use strict";

export interface ICredentialStorage {
	expireDate: Date;
	getAccessToken(): string;
	setAccessToken(value: string, expires?: number): void;
	getRefreshToken(): string;
	setRefreshToken(value: string): void;
	logout(): void;
}
