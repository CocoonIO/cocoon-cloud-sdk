"use strict";

export interface ICredentialStorage {
	getAccessToken(): string;
	setAccessToken(value: string, expires?: number): void;
	getRefreshToken(): string;
	setRefreshToken(value: string): void;
	logout(): void;
}
