"use strict";

import {IPaymentPlan} from "./i-payment-plan";
import {ISigningKeyData} from "./i-signing-key-data";

export interface IUserData {
	id: string;
	username: string;
	email: string;
	name: string;
	lastname: string;
	eula: boolean;
	plan: IPaymentPlan;
	connections: string[];
	keys: {[platform: string]: ISigningKeyData[]};
	platforms: string[];
	migration?: any;
}
