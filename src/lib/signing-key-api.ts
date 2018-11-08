"use strict";

import {form, plugins} from "popsicle";

import APIURL from "./api-url";
import CocoonAPI from "./cocoon-api";
import {Platform} from "./enums/e-platform";
import {ISigningKeyData} from "./interfaces/i-signing-key-data";
import SigningKey from "./signing-key";

export default class SigningKeyAPI {
	/**
	 * Create an Android signing key.
	 * @param name Name for the signing key.
	 * @param pAlias A name you will use when you sign your project.
	 * @param keystore A binary file that contains a set of private keys.
	 * @param keystorePassword Password of the keystore.
	 * @param certificatePassword Password of the certificate used to create the keystore.
	 * @returns {Promise<SigningKey>} Promise of the signing key created.
	 */
	public static async createAndroid(
		name: string,
		pAlias: string,
		keystore: File,
		keystorePassword: string,
		certificatePassword: string,
	): Promise<SigningKey> {
		return new SigningKey(
			await SigningKeyAPI.createAndroidUnprocessed(name, pAlias, keystore, keystorePassword, certificatePassword),
			Platform.Android,
		);
	}

	/**
	 * Create an Android signing key.
	 * @param name Name for the signing key.
	 * @param pAlias A name you will use when you sign your project.
	 * @param keystore A binary file that contains a set of private keys.
	 * @param keystorePassword Password of the keystore.
	 * @param certificatePassword Password of the certificate used to create the keystore.
	 * @returns {Promise<ISigningKeyData>} Promise of the date of the signing key created.
	 */
	public static async createAndroidUnprocessed(
		name: string,
		pAlias: string,
		keystore: File,
		keystorePassword: string,
		certificatePassword: string,
	): Promise<ISigningKeyData> {
		const formData = form({});
		const data = {
			alias: pAlias,
			passAlias: certificatePassword,
			passKeystore: keystorePassword,
			title: name,
		};
		formData.append("data", JSON.stringify(data));
		formData.append("keystore", keystore);

		return (await CocoonAPI.request({
			body: formData,
			method: "POST",
			url: APIURL.CREATE_SIGNING_KEY(Platform.Android),
		}, [plugins.parse("json")])).body;
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
	 * @returns {Promise<SigningKey>} Promise of the signing key created.
	 */
	public static async createIOS(
		name: string,
		password: string,
		provisioningProfile: File,
		certificate: File,
	): Promise<SigningKey> {
		return new SigningKey(
			await SigningKeyAPI.createIOSUnprocessed(name, password, provisioningProfile, certificate),
			Platform.IOS,
		);
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
	 * @returns {Promise<ISigningKeyData>} Promise of the date of the signing key created.
	 */
	public static async createIOSUnprocessed(
		name: string,
		password: string,
		provisioningProfile: File,
		certificate: File,
	): Promise<ISigningKeyData> {
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
	 * @returns {Promise<SigningKey>} Promise of the signing key created.
	 */
	public static async createMacOS(
		name: string,
		password: string,
		provisioningProfile: File,
		certificate: File,
	): Promise<SigningKey> {
		return new SigningKey(
			await SigningKeyAPI.createMacOSUnprocessed(name, password, provisioningProfile, certificate),
			Platform.MacOS,
		);
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
	 * @returns {Promise<ISigningKeyData>} Promise of the data of the signing key created.
	 */
	public static async createMacOSUnprocessed(
		name: string,
		password: string,
		provisioningProfile: File,
		certificate: File,
	): Promise<ISigningKeyData> {
		return SigningKeyAPI.createApple(name, password, provisioningProfile, certificate, Platform.MacOS);
	}

	/**
	 * Create an Windows signing key.
	 * @param name Name for the signing key.
	 * @param pPassword
	 * @param pPackageThumbprint
	 * @param pPublisherId
	 * @param keystore
	 * @returns {Promise<SigningKey>} Promise of the signing key created.
	 */
	public static async createWindows(
		name: string,
		pPassword: string,
		pPackageThumbprint: string,
		pPublisherId: string,
		keystore: File,
	): Promise<SigningKey> {
		return new SigningKey(
			await SigningKeyAPI.createWindowsUnprocessed(name, pPassword, pPackageThumbprint, pPublisherId, keystore),
			Platform.Windows,
		);
	}

	/**
	 * Create an Windows signing key.
	 * @param name Name for the signing key.
	 * @param pPassword
	 * @param pPackageThumbprint
	 * @param pPublisherId
	 * @param keystore
	 * @returns {Promise<ISigningKeyData>} Promise of the data of the signing key created.
	 */
	public static async createWindowsUnprocessed(
		name: string,
		pPassword: string,
		pPackageThumbprint: string,
		pPublisherId: string,
		keystore: File,
	): Promise<ISigningKeyData> {
		const formData = form({});
		const data = {
			packageThumbprint: pPackageThumbprint,
			password: pPassword,
			publisherId: pPublisherId,
			title: name,
		};
		formData.append("data", JSON.stringify(data));
		formData.append("packageCertificateKeyFile", keystore);

		return (await CocoonAPI.request({
			body: formData,
			method: "POST",
			url: APIURL.CREATE_SIGNING_KEY(Platform.Windows),
		}, [plugins.parse("json")])).body;
	}

	/**
	 * Fetch the information of a signing key.
	 * @param signingKeyId ID of the signing key to fetch.
	 * @returns {Promise<SigningKey>} Promise of the signing key fetched.
	 */
	public static async get(signingKeyId: string): Promise<SigningKey> {
		const signingKeysData = await SigningKeyAPI.listUnprocessed();
		for (const platform in signingKeysData) {
			if (!signingKeysData.hasOwnProperty(platform)) {
				continue;
			}
			for (const signingKeyData of signingKeysData[platform]) {
				if (signingKeyData.id === signingKeyId) {
					return new SigningKey(signingKeyData, platform as any);
				}
			}
		}
		throw new Error("There is no Signing Key with the ID: " + signingKeyId);
	}

	/**
	 * Fetch the information of a signing key.
	 * @param signingKeyId ID of the signing key to fetch.
	 * @returns {Promise<ISigningKeyData>} Promise of the data of the signing key fetched.
	 */
	public static async getUnprocessed(signingKeyId: string): Promise<ISigningKeyData> {
		const signingKeysData = await SigningKeyAPI.listUnprocessed();
		for (const platform in signingKeysData) {
			if (!signingKeysData.hasOwnProperty(platform)) {
				continue;
			}
			for (const signingKeyData of signingKeysData[platform]) {
				if (signingKeyData.id === signingKeyId) {
					return signingKeyData;
				}
			}
		}
		throw new Error("There is no Signing Key with the ID: " + signingKeyId);
	}

	/**
	 * Delete a signing key.
	 * @param signingKeyId ID of the signing key to delete.
	 * @returns {Promise<void>} Promise of a successful operation.
	 */
	public static async delete(signingKeyId: string): Promise<void> {
		await CocoonAPI.request({
			method: "DELETE",
			url: APIURL.SIGNING_KEY(signingKeyId),
		});
	}

	/**
	 * Fetch a list containing the information of all the signing keys.
	 * @returns {Promise<{ string: SigningKey[] }>} Promise of the list of all the signing keys.
	 */
	public static async list(): Promise<{[platform: string]: SigningKey[]}> {
		const signingKeysData = await SigningKeyAPI.listUnprocessed();
		const signingKeys: {[platform: string]: SigningKey[]} = {};
		for (const platform in signingKeysData) {
			if (!signingKeysData.hasOwnProperty(platform)) {
				continue;
			}
			signingKeys[platform] = signingKeysData[platform].map((signingKeyData) => {
				return new SigningKey(signingKeyData, platform as any);
			});
		}
		return signingKeys;
	}

	/**
	 * Fetch a list containing the information of all the signing keys.
	 * @returns {Promise<{ string: ISigningKeyData[] }>} Promise of the list of all the data of the signing keys.
	 */
	public static async listUnprocessed(): Promise<{[platform: string]: ISigningKeyData[]}> {
		return (await CocoonAPI.request({
			method: "GET",
			url: APIURL.SIGNING_KEYS,
		}, [plugins.parse("json")])).body.keys;
	}

	private static async createApple(
		name: string,
		password: string,
		provisioningProfile: File,
		certificate: File,
		platform: Platform,
	): Promise<ISigningKeyData> {
		const formData = form({});
		const data = {
			pass: password,
			title: name,
		};
		formData.append("data", JSON.stringify(data));
		formData.append("p12", certificate);
		formData.append("provisioning", provisioningProfile);

		return (await CocoonAPI.request({
			body: formData,
			method: "POST",
			url: APIURL.CREATE_SIGNING_KEY(platform),
		}, [plugins.parse("json")])).body;
	}
}
