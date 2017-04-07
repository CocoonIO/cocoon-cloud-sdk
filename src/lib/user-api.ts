"use strict";

import {plugins} from "popsicle/dist/common";

import APIURL from "./api-url";
import CocoonAPI from "./cocoon-api";
import {IUserData} from "./interfaces/i-user-data";
import User from "./user";

export default class UserAPI {
	/**
	 * Fetch the information of the user.
	 * @returns {Promise<User>} Promise of the user.
	 */
	public static get(): Promise<User> {
		return UserAPI.getUnprocessed()
		.then((userData) => {
			return Promise.resolve(new User(userData));
		})
		.catch(Promise.reject);
	}

	/**
	 * Fetch the information of the user.
	 * @returns {Promise<IUserData>} Promise of the data of the user.
	 */
	public static getUnprocessed(): Promise<IUserData> {
		return CocoonAPI.request({
			method: "GET",
			url: APIURL.USER_PROFILE,
		})
		.use(plugins.parse("json"))
		.then((response) => {
			return Promise.resolve(response.body);
		})
		.catch(Promise.reject);
	}
}
