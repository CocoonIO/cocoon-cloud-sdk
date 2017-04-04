"use strict";

import {form, plugins} from "popsicle/dist/common";

import APIURL from "./api-url";
import CocoonAPI from "./cocoon-api";
import {Platform} from "./enums/e-platform";
import {ISigningKeyData} from "./interfaces/i-signing-key-data";

export default class SigningKeyAPI {
	/**
	 * Create an Android signing key.
	 * @param name Name for the signing key.
	 * @param pAlias A name you will use when you sign your project.
	 * @param keystore A binary file that contains a set of private keys.
	 * @param keystorePassword Password of the keystore.
	 * @param certificatePassword Password of the certificate used to create the keystore.
	 */
	public static createAndroid(name: string, pAlias: string, keystore: File,
	                            keystorePassword: string, certificatePassword: string): Promise<ISigningKeyData> {
		const formData = form({});
		const data = {
			alias: pAlias,
			passAlias: certificatePassword,
			passKeystore: keystorePassword,
			title: name,
		};
		formData.append("data", JSON.stringify(data));
		formData.append("keystore", keystore);

		return CocoonAPI.request({
			body: formData,
			method: "POST",
			url: APIURL.CREATE_SIGNING_KEY(Platform.Android),
		})
		.use(plugins.parse("json"))
		.then((response) => {
			return response.body;
		})
		.catch((error) => {
			return error;
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
	 */
	public static createIOS(name: string, password: string,
	                        provisioningProfile: File, certificate: File): Promise<ISigningKeyData> {
		return SigningKeyAPI.createApple(name, password, provisioningProfile, certificate, Platform.IOS);
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
	 */
	public static createMacOS(name: string, password: string,
	                          provisioningProfile: File, certificate: File): Promise<ISigningKeyData> {
		return SigningKeyAPI.createApple(name, password, provisioningProfile, certificate, Platform.MacOS);
	}

	/**
	 * Create an Windows signing key.
	 * @param name Name for the signing key.
	 * @param pPassword
	 * @param pPackageThumbprint
	 * @param pPublisherId
	 * @param keystore
	 */
	public static createWindows(name: string, pPassword: string, pPackageThumbprint: string, pPublisherId: string,
	                            keystore: File): Promise<ISigningKeyData> {
		const formData = form({});
		const data = {
			packageThumbprint: pPackageThumbprint,
			password: pPassword,
			publisherId: pPublisherId,
			title: name,
		};
		formData.append("data", JSON.stringify(data));
		formData.append("packageCertificateKeyFile", keystore);

		return CocoonAPI.request({
			body: formData,
			method: "POST",
			url: APIURL.CREATE_SIGNING_KEY(Platform.Windows),
		})
		.use(plugins.parse("json"))
		.then((response) => {
			return response.body;
		})
		.catch((error) => {
			return error;
		});
	}

	/**
	 * Fetch the information of a signing key.
	 * @param signingKeyId ID of the signing key to fetch.
	 */
	public static get(signingKeyId: string): Promise<ISigningKeyData> {
		return CocoonAPI.request({
			method: "GET",
			url: APIURL.SIGNING_KEY(signingKeyId),
		})
		.use(plugins.parse("json"))
		.then((response) => {
			return response.body;
		})
		.catch((error) => {
			return error;
		});
	}

	/**
	 * Delete a signing key.
	 * @param signingKeyId ID of the signing key to delete.
	 */
	public static delete(signingKeyId: string): Promise<void> {
		return CocoonAPI.request({
			method: "DELETE",
			url: APIURL.SIGNING_KEY(signingKeyId),
		})
		.then(() => {
			return;
		})
		.catch((error) => {
			return error;
		});
	}

	/**
	 * Fetch a list containing the information of all the signing keys.
	 */
	public static list(): Promise<{ [platform: string]: ISigningKeyData[] }> {
		return CocoonAPI.request({
			method: "GET",
			url: APIURL.SIGNING_KEYS,
		})
		.use(plugins.parse("json"))
		.then((response) => {
			return response.body.keys;
		})
		.catch((error) => {
			return error;
		});
	}

	private static createApple(name: string, password: string, provisioningProfile: File, certificate: File,
	                           platform: Platform): Promise<ISigningKeyData> {
		const formData = form({});
		const data = {
			pass: password,
			title: name,
		};
		formData.append("data", JSON.stringify(data));
		formData.append("p12", certificate);
		formData.append("provisioning", provisioningProfile);

		return CocoonAPI.request({
			body: formData,
			method: "POST",
			url: APIURL.CREATE_SIGNING_KEY(platform),
		})
		.use(plugins.parse("json"))
		.then((response) => {
			return response.body;
		})
		.catch((error) => {
			return error;
		});
	}

}
