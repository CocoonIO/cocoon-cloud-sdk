"use strict";

import {form, plugins} from "popsicle/dist/common";

import APIClient from "./api-client";
import APIURL from "./api-url";
import {Platform} from "./enums/e-platform";
import {IError} from "./interfaces/i-error";
import {ISigningKeyData} from "./interfaces/i-signing-key-data";

export default class SigningKeyAPI {
	/**
	 * Create an Android signing key.
	 * @param name Name for the signing key.
	 * @param pAlias A name you will use when you sign your project.
	 * @param keystore A binary file that contains a set of private keys.
	 * @param keystorePassword Password of the keystore.
	 * @param certificatePassword Password of the certificate used to create the keystore.
	 * @param callback
	 */
	public static createAndroid(name: string, pAlias: string, keystore: File,
	                            keystorePassword: string, certificatePassword: string,
	                            callback: (signingKeyData: ISigningKeyData, error?: IError) => void) {
		const formData = form({});
		const data = {
			alias: pAlias,
			passAlias: certificatePassword,
			passKeystore: keystorePassword,
			title: name,
		};
		formData.append("data", JSON.stringify(data));
		formData.append("keystore", keystore);

		APIClient.request({
			body: formData,
			method: "POST",
			url: APIURL.CREATE_SIGNING_KEY(Platform.Android),
		})
			.use(plugins.parse("json"))
			.then((response) => {
				callback(response.body);
			}, (error) => {
				callback(null, error);
			});
	}

	/**
	 * Create an iOS signing key.
	 * @param name Name for the signing key.
	 * @param password The password of the p12 certificate.
	 * @param provisioningProfile The provisioning profile must be a Distribution one. You can create an “Ad Hoc”
	 * provisioning profile if you plan you distribute it internally to a group of persons or an “App Store” provisioning
	 * profile for uploading the final app to the Apple App Store.
	 * @param certificate The p12 signing certificate must be a production one, either you are creating an “Ad Hoc” IPA or
	 * an IPA to upload to the Apple App Store.
	 * @param callback
	 */
	public static createIOS(name: string, password: string, provisioningProfile: File, certificate: File,
	                        callback: (signingKeyData: ISigningKeyData, error?: IError) => void) {
		SigningKeyAPI.createApple(name, password, provisioningProfile, certificate, Platform.IOS, callback);
	}

	/**
	 * Create an MacOS signing key.
	 * @param name Name for the signing key.
	 * @param password The password of the p12 certificate.
	 * @param provisioningProfile The provisioning profile must be a Distribution one. You can create an “Ad Hoc”
	 * provisioning profile if you plan you distribute it internally to a group of persons or an “App Store” provisioning
	 * profile for uploading the final app to the Apple App Store.
	 * @param certificate The p12 signing certificate must be a production one, either you are creating an “Ad Hoc” IPA or
	 * an IPA to upload to the Apple App Store.
	 * @param callback
	 */
	public static createMacOS(name: string, password: string, provisioningProfile: File, certificate: File,
	                          callback: (signingKeyData: ISigningKeyData, error?: IError) => void) {
		SigningKeyAPI.createApple(name, password, provisioningProfile, certificate, Platform.MacOS, callback);
	}

	/**
	 * Create an Windows signing key.
	 * @param name Name for the signing key.
	 * @param pPassword
	 * @param pPackageThumbprint
	 * @param pPublisherId
	 * @param keystore
	 * @param callback
	 */
	public static createWindows(name: string, pPassword: string, pPackageThumbprint: string, pPublisherId: string,
	                            keystore: File, callback: (signingKeyData: ISigningKeyData, error?: IError) => void) {
		const formData = form({});
		const data = {
			packageThumbprint: pPackageThumbprint,
			password: pPassword,
			publisherId: pPublisherId,
			title: name,
		};
		formData.append("data", JSON.stringify(data));
		formData.append("packageCertificateKeyFile", keystore);

		APIClient.request({
			body: formData,
			method: "POST",
			url: APIURL.CREATE_SIGNING_KEY(Platform.Windows),
		})
			.use(plugins.parse("json"))
			.then((response) => {
				callback(response.body);
			}, (error) => {
				callback(null, error);
			});
	}

	/**
	 * Fetch the information of a signing key.
	 * @param signingKeyId ID of the signing key to fetch.
	 * @param callback
	 */
	public static get(signingKeyId: string, callback: (signingKeyData: ISigningKeyData, error?: IError) => void) {
		APIClient.request({
			method: "GET",
			url: APIURL.SIGNING_KEY(signingKeyId),
		})
			.use(plugins.parse("json"))
			.then((response) => {
				callback(response.body);
			}, (error) => {
				callback(null, error);
			});
	}

	/**
	 * Delete a signing key.
	 * @param signingKeyId ID of the signing key to delete.
	 * @param callback
	 */
	public static delete(signingKeyId: string, callback: (error?: IError) => void) {
		APIClient.request({
			method: "DELETE",
			url: APIURL.SIGNING_KEY(signingKeyId),
		})
			.then(() => {
				callback();
			}, (error) => {
				callback(error);
			});
	}

	/**
	 * Fetch a list containing the information of all the signing keys.
	 * @param callback
	 */
	public static list(callback: (signingKeysData: {[platform: string]: ISigningKeyData[]}, error?: IError) => void) {
		APIClient.request({
			method: "GET",
			url: APIURL.SIGNING_KEYS,
		})
			.use(plugins.parse("json"))
			.then((response) => {
				callback(response.body.keys);
			}, (error) => {
				callback(null, error);
			});
	}

	private static createApple(name: string, password: string, provisioningProfile: File, certificate: File,
	                           platform: Platform, callback: (signingKeyData: ISigningKeyData, error?: IError) => void) {
		const formData = form({});
		const data = {
			pass: password,
			title: name,
		};
		formData.append("data", JSON.stringify(data));
		formData.append("p12", certificate);
		formData.append("provisioning", provisioningProfile);

		APIClient.request({
			body: formData,
			method: "POST",
			url: APIURL.CREATE_SIGNING_KEY(platform),
		})
			.use(plugins.parse("json"))
			.then((response) => {
				callback(response.body);
			}, (error) => {
				callback(null, error);
			});
	}

}
