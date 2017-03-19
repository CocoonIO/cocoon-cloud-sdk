"use strict";

import {plugins} from "popsicle/dist/common";

import APIClient from "./api-client";
import APIURL from "./api-url";
import {IError} from "./interfaces/i-error";
import {IUserData} from "./interfaces/i-user-data";

export default class UserAPI {
	/**
	 * Fetch the information of the user.
	 * @param callback
	 */
	public static get(callback: (userData: IUserData, error?: IError) => void) {
		APIClient.request({
			method: "GET",
			url: APIURL.USER_PROFILE,
		})
			.use(plugins.parse("json"))
			.then((response) => {
				callback(response.body);
			}, (error) => {
				callback(null, error);
			});
	}
}
