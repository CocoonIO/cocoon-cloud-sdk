"use strict";

import {IError} from "./interfaces/i-error";
import {ISigningKeyData} from "./interfaces/i-signing-key-data";
import SigningKeyAPI from "./signing-key-api";

export default class SigningKey {
	public get id(): string {
		return this._id;
	}

	public get name(): string {
		return this._name;
	}

	public get platform(): string {
		return this._platform;
	}

	private _id: string;
	private _name: string;
	private _platform: string;

	public constructor(signingKeyData: ISigningKeyData, platform: string) {
		this._id = signingKeyData.id;
		this._name = signingKeyData.title;
		this._platform = platform;
	}

	/**
	 * Delete the signing key.
	 * @param callback
	 */
	public delete(callback: (error?: IError) => void): void {
		SigningKeyAPI.delete(this._id, callback);
	}
}
