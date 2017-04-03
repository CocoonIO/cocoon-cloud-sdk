"use strict";

import {IPaymentPlan} from "./interfaces/i-payment-plan";
import {IUserData} from "./interfaces/i-user-data";

export default class User {
	public get userName(): string {
		return this._userName;
	}

	public set userName(value: string) {
		this._userName = value;
	}

	public get name(): string {
		return this._name;
	}

	public set name(value: string) {
		this._name = value;
	}

	public get lastName(): string {
		return this._lastName;
	}

	public set lastName(value: string) {
		this._lastName = value;
	}

	public get email(): string {
		return this._email;
	}

	public set email(value: string) {
		this._email = value;
	}

	public get eula(): boolean {
		return this._eula;
	}

	public get plan(): IPaymentPlan {
		return this._plan;
	}

	public get platforms(): string[] {
		return this._platforms;
	}

	private _userName: string;
	private _name: string;
	private _lastName: string;
	private _email: string;
	private _eula: boolean;
	private _plan: IPaymentPlan;
	private _platforms: string[];

	public constructor(userData: IUserData) {
		this._userName = userData.username;
		this._name = userData.name;
		this._lastName = userData.lastname;
		this._email = userData.email;
		this._eula = userData.eula;
		this._plan = userData.plan;
		this._platforms = userData.platforms;
	}
}
