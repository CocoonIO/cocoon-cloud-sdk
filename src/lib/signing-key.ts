"use strict";

import {Platform} from "./enums/e-platform";
import {ISigningKeyData} from "./interfaces/i-signing-key-data";
import SigningKeyAPI from "./signing-key-api";

export default class SigningKey {
	public get id(): string {
		return this._id;
	}

	public get name(): string {
		return this._name;
	}

	public get platform(): Platform {
		return this._platform;
	}

	private _id: string;
	private _name: string;
	private _platform: Platform;

	public constructor(signingKeyData: ISigningKeyData, platform: Platform) {
		this._id = signingKeyData.id;
		this._name = signingKeyData.title;
		this._platform = platform;
	}

	/**
	 * Delete the signing key.
	 * @returns {Promise<void>} Promise of a successful operation.
	 */
	public delete(): Promise<void> {
		return SigningKeyAPI.delete(this._id);
	}
}
