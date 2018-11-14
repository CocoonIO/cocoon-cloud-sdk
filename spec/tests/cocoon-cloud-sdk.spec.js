"use strict";

const cocoonSDK = require("../../out");
const fs = require("fs");

jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

// To test locally
// const USERNAME = "USERNAME";
// const PASSWORD = "PASSWORD";
// const CLIENT_ID = "CLIENT_ID";
// const CLIENT_SECRET = "CLIENT_SECRET";

// To test with Travis
const USERNAME = process.env.COCOON_TEST_USERNAME;
const PASSWORD = process.env.COCOON_TEST_PASSWORD;
const CLIENT_ID = process.env.COCOON_SDK_CLIENT_ID;
const CLIENT_SECRET = process.env.COCOON_SDK_CLIENT_SECRET;

describe("A spec for the Cocoon SDK", () => {
	beforeAll(() => {
		cocoonSDK.OAuth.setup("password", CLIENT_ID, CLIENT_SECRET);
	});

	it("should allow a user to log in", (done) => {
		cocoonSDK.OAuth.tokenExchangePassword(USERNAME, PASSWORD)
			.then((result) => {
				cocoonSDK.CocoonAPI.setupAPIAccess(result.access_token, result.refresh_token, result.expires_in);
				done();
			})
			.catch((error) => {
				done.fail(error);
			});
	});

	it("should allow a user to log out", (done) => {
		cocoonSDK.OAuth.logout()
			.then(() => {
				cocoonSDK.CocoonAPI.closeAPIAccess();
				done();
			})
			.catch((error) => {
				done.fail(error);
			});
	});

	describe("when the user is authenticated", () => {
		beforeAll((done) => {
			cocoonSDK.OAuth.setup("password", CLIENT_ID, CLIENT_SECRET);
			if (!cocoonSDK.CocoonAPI.checkAPIAccess()) {
				cocoonSDK.OAuth.tokenExchangePassword(USERNAME, PASSWORD)
					.then((result) => {
						cocoonSDK.CocoonAPI.setupAPIAccess(result.access_token, result.refresh_token, result.expires_in);
						done();
					})
					.catch((error) => {
						done.fail(error);
					});
			} else {
				done();
			}
		});

		afterAll((done) => {
			cocoonSDK.OAuth.logout()
				.then(() => {
					cocoonSDK.CocoonAPI.closeAPIAccess();
					done();
				})
				.catch((error) => {
					done.fail(error);
				});
		});

		it("should be able to fetch the projects list", (done) => {
			cocoonSDK.ProjectAPI.list()
				.then((projectList) => {
					for (let project of projectList) {
						expect(project.id).toBeDefined();
						expect(project.name).toBeDefined();
						expect(project.bundleID).toBeDefined();
						expect(project.version).toBeDefined();
						expect(project.origin).toBeDefined();
						expect(project.dateCompiled).toBeDefined();
						expect(project.dateCreated).toBeDefined();
						expect(project.dateUpdated).toBeDefined();
						expect(project.sourceURL).toBeDefined();
						expect(project.configURL).toBeDefined();
						for (let platform in project.compilations) {
							if (!project.compilations.hasOwnProperty(platform)) {
								continue;
							}
							expect(project.compilations[platform].platform).toBe(platform);
							expect(project.compilations[platform].status).toBeDefined();
						}
					}
					done();
				})
				.catch((error) => {
					done.fail(error);
				});
		}, 60000);

		it("should be able to fetch the signing keys list", (done) => {
			cocoonSDK.SigningKeyAPI.list()
				.then((signingKeysObj) => {
					for (let platform in signingKeysObj) {
						if (!signingKeysObj.hasOwnProperty(platform)) {
							continue;
						}
						for (let signingKey of signingKeysObj[platform]) {
							expect(signingKey.id).toBeDefined();
							expect(signingKey.name).toBeDefined();
							expect(signingKey.platform).toBe(platform);
						}
					}
					done();
				})
				.catch((error) => {
					done.fail(error);
				});
		});

		it("should be able to get the user information", (done) => {
			cocoonSDK.UserAPI.get()
				.then((user) => {
					expect(user.userName).toBeDefined();
					expect(user.name).toBeDefined();
					expect(user.lastName).toBeDefined();
					expect(user.email).toBeDefined();
					expect(user.eula).toBeDefined();
					expect(user.plan).toBeDefined();
					expect(user.platforms).toBeDefined();
					done();
				})
				.catch((error) => {
					done.fail(error);
				});
		});

		it("should be able to get the project templates", (done) => {
			cocoonSDK.CocoonAPI.getCocoonTemplates()
				.then((templates) => {
					expect(templates.length).toBeGreaterThan(0);
					for (let template of templates) {
						expect(template.name).toBeDefined();
						expect(template.description).toBeDefined();
						expect(template.image_url).toBeDefined();
						expect(template.github_url).toBeDefined();
						expect(template.orientation).toBeDefined();
						expect(template.environment).toBeDefined();
					}
					done();
				})
				.catch((error) => {
					done.fail(error);
				});
		});

		it("should be able to get the cocoon versions", (done) => {
			cocoonSDK.CocoonAPI.getCocoonVersions()
				.then((versions) => {
					expect(versions.length).toBeGreaterThan(0);
					for (let version of versions) {
						expect(version.name).toBeDefined();
						expect(version.default).toBeDefined();
						expect(version.platforms).toBeDefined();
					}
					done();
				})
				.catch((error) => {
					done.fail(error);
				});
		});

		describe("and a project has been fetched", () => {
			let project;
			beforeAll((done) => {
				let zipFile = fs.createReadStream(__dirname.replace("tests", "assets/example/source.zip"));
				cocoonSDK.ProjectAPI.createFromZipUpload(zipFile)
					.then((pProject) => {
						project = pProject;
						done();
					})
					.catch((error) => {
						done.fail(error);
					});
			});

			beforeEach((done) => {
				let zipFile = fs.createReadStream(__dirname.replace("tests", "assets/example/source.zip"));
				project.updateZip(zipFile)
					.then(() => {
						done();
					})
					.catch((error) => {
						done.fail(error);
					});
			});

			afterAll((done) => {
				project.delete()
					.then(() => {
						project = null;
						done();
					})
					.catch((error) => {
						done.fail(error);
					});
			});

			it("should be able to upload a project", (done) => {
				expect(project.id).toBeDefined();
				expect(project.name).toBe("HelloCordova");
				expect(project.bundleID).toBe("io.cordova.hellocordova");
				expect(project.version).toBe("1.0.0");
				expect(project.origin).toBeDefined();
				expect(project.dateCompiled).toBeDefined();
				expect(project.dateCreated).toBeDefined();
				expect(project.dateUpdated).toBeDefined();
				expect(project.sourceURL).toBeDefined();
				expect(project.configURL).toBeDefined();
				Object.keys(project.compilations).forEach((platform) => {
					expect(project.compilations[platform].platform).toBeDefined();
					expect(project.compilations[platform].status).toBeDefined();
				});
				project.getConfigXML()
					.then((xmlSugar) => {
						expect(project.name).toBe(xmlSugar.getName());
						expect(project.bundleID).toBe(xmlSugar.getBundleId());
						expect(project.version).toBe(xmlSugar.getVersion());
						done();
					})
					.catch((error) => {
						done.fail(error);
					});
			});

			it("should be able to update the zip file", (done) => {
				let zipFile = fs.createReadStream(__dirname.replace("tests", "assets/example2/source.zip"));
				project.updateZip(zipFile)
					.then(() => {
						expect(project.name).toBe("HelloCocoon");
						expect(project.bundleID).toBe("io.cocoon.hellococoon");
						expect(project.version).toBe("2.0.0");
						return project.getConfigXML();
					})
					.then((xmlSugar) => {
						expect(project.name).toBe(xmlSugar.getName());
						expect(project.bundleID).toBe(xmlSugar.getBundleId());
						expect(project.version).toBe(xmlSugar.getVersion());
						done();
					})
					.catch((error) => {
						done.fail(error);
					});
			});

			it("should be able to update the config file", (done) => {
				let configXml = fs.readFileSync(__dirname.replace("tests", "assets/example2/config.xml"), "utf8");
				project.updateConfigXml(configXml)
					.then(() => {
						expect(project.name).toBe("HelloCocoon");
						expect(project.bundleID).toBe("io.cocoon.hellococoon");
						expect(project.version).toBe("2.0.0");
						return project.getConfigXML();
					})
					.then((xmlSugar) => {
						expect(project.name).toBe(xmlSugar.getName());
						expect(project.bundleID).toBe(xmlSugar.getBundleId());
						expect(project.version).toBe(xmlSugar.getVersion());
						done();
					})
					.catch((error) => {
						done.fail(error);
					});
			});
		});

		describe("and a signing key has been fetched", () => {
			let signingKey;
			const rndName = Math.random().toString(36).substr(2, 10);
			beforeAll((done) => {
				let keystoreFile = fs.createReadStream(__dirname.replace("tests", "assets/example.keystore"));
				cocoonSDK.SigningKeyAPI.createAndroid(rndName, "Test Alias", keystoreFile,
					"testKeystorePassword", "testCertificatePassword")
					.then((pSigningKey) => {
						signingKey = pSigningKey;
						done();
					})
					.catch((error) => {
						done.fail(error);
					});
			});

			afterAll((done) => {
				signingKey.delete()
					.then(() => {
						signingKey = null;
						done();
					})
					.catch((error) => {
						done.fail(error);
					});
			});

			it("should be able to upload a signing key", () => {
				expect(signingKey.id).toBeDefined();
				expect(signingKey.name).toBe(rndName);
				expect(signingKey.platform).toBe("android");
			});
		});

		describe("and a project & signing key have been fetched", () => {
			let project;
			let signingKey;
			const rndName = Math.random().toString(36).substr(2, 10);
			beforeAll((done) => {
				let zipFile = fs.createReadStream(__dirname.replace("tests", "assets/example/source.zip"));
				cocoonSDK.ProjectAPI.createFromZipUpload(zipFile)
					.then((pProject) => {
						project = pProject;
						let keystoreFile = fs.createReadStream(__dirname.replace("tests", "assets/example.keystore"));
						return cocoonSDK.SigningKeyAPI.createAndroid(rndName, "Test Alias", keystoreFile,
							"testKeystorePassword", "testCertificatePassword");
					})
					.then((pSigningKey) => {
						signingKey = pSigningKey;
						done();
					})
					.catch((error) => {
						done.fail(error);
					});
			});

			afterAll((done) => {
				project.delete()
					.then(() => {
						project = null;
						return signingKey.delete();
					})
					.then(() => {
						signingKey = null;
						done();
					})
					.catch((error) => {
						done.fail(error);
					});
			});

			it("should be able to assign the key to the project", (done) => {
				project.assignSigningKey(signingKey)
					.then(() => {
						expect(project.keys[signingKey.platform]).toBe(signingKey);
						done();
					})
					.catch((error) => {
						done.fail(error);
					});
			});
		});
	});
});
