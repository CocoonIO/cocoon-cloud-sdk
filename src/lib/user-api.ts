"use strict";

import {plugins} from "popsicle/dist/common";

import APIURL from "./api-url";
import CocoonAPI from "./cocoon-api";
import {IUserData} from "./interfaces/i-user-data";

export default class UserAPI {
	/**
	 * Fetch the information of the user.
	 * @returns {Promise<IUserData>} Promise of the user.
	 */
	public static get(): Promise<IUserData> {
		return CocoonAPI.request({
			method: "GET",
			url: APIURL.USER_PROFILE,
		})
		.use(plugins.parse("json"))
		.then((response) => {
			return response.body;
		})
		.catch((error) => {
			return Promise.reject(error);
		});
	}
}
