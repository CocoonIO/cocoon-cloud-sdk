"use strict";

export interface ICocoonVersion {
	name: string;
	default: boolean;
	platforms: [{name: string; version: string}];
}
