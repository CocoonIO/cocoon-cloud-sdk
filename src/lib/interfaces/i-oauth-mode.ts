"use strict";

import {GrantType} from "../enums/e-grant-type";
import {StorageType} from "../enums/e-storage-type";

export interface IOauthMode {
	grantType: GrantType;
	storageType?: StorageType;
	customServer?: string;
}
