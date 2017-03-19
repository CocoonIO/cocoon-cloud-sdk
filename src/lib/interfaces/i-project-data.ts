"use strict";

import {Status} from "../enums/e-status";
import {ISigningKeyData} from "./i-signing-key-data";

export interface IProjectData {
	id: string;
	title: string;
	package: string;
	build_count: number;
	version: string;
	origin: {[key: string]: string};
	config: string;
	source: string;
	icon: string;
	date_created: number;
	date_updated?: number;
	date_compiled?: number;
	status: {[key: string]: Status};
	download: {[key: string]: string};
	devapp: string[];
	keys: {[platform: string]: ISigningKeyData};
	error: {[key: string]: string};
	icons: {[key: string]: string};
	splashes: {[key: string]: string};
	platforms: string[];
}
