"use strict";

export enum GrantType {
	AuthorizationCode = "authorization_code" as any,
	ClientCredentials = "client_credentials" as any,
	Implicit = "implicit" as any,
	Password = "password" as any,
	RefreshToken = "refresh_token" as any,
}
