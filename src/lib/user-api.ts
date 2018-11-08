"use strict";

import {plugins} from "popsicle";

import APIURL from "./api-url";
import CocoonAPI from "./cocoon-api";
import {IUserData} from "./interfaces/i-user-data";
import User from "./user";

export default class UserAPI {
	/**
	 * Fetch the information of the user.
	 * @returns {Promise<User>} Promise of the user.
	 */
	public static async get(): Promise<User> {
		return new User(await UserAPI.getUnprocessed());
	}

	/**
	 * Fetch the information of the user.
	 * @returns {Promise<IUserData>} Promise of the data of the user.
	 */
	public static async getUnprocessed(): Promise<IUserData> {
		return (await CocoonAPI.request({
			method: "GET",
			url: APIURL.USER_PROFILE,
		}, [plugins.parse("json")])).body;
	}
}
