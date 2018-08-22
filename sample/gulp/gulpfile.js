"use strict";

const cocoonSDK = require("cocoon-cloud-sdk");
const fs = require("fs");
const gulp = require("gulp");
const path = require("path");
const readLine = require("readline");
const request = require("request");
const argv = require("yargs").argv;

const CLIENT_ID = argv.clientId || process.env.COCOON_CLIENT_ID;
const CLIENT_SECRET = argv.clientSecret || process.env.COCOON_CLIENT_SECRET;
const USERNAME = argv.username || process.env.COCOON_USERNAME;
const PASSWORD = argv.password || process.env.COCOON_PASSWORD;
const DEFAULT_OUTPUT_DIR = "./out";

const oAuth = new cocoonSDK.OAuth("password", CLIENT_ID, CLIENT_SECRET);

// ================== FUNCTIONS ================== \\
/**
 * Logs the user in if not already logged in.
 * @param {string} username
 * @param {string} password
 * @return {Promise<void>}
 */
function login(username, password) {
	if (!cocoonSDK.CocoonAPI.checkAPIAccess()) {
		return oAuth.tokenExchangePassword(username, password)
		.then((result) => {
			cocoonSDK.CocoonAPI.setupAPIAccess(result.access_token, result.refresh_token, result.expires_in);
			return undefined;
		})
		.catch((error) => {
			console.error("Login not successful.");
			console.trace(error);
			throw error;
		});
	} else {
		return Promise.resolve();
	}
}

/**
 * Downloads the URL as a file
 * @param {string} url
 * @param {string} outputPath
 * @return {Promise<void>}
 */
function downloadFile(url, outputPath) {
	const dir = path.dirname(outputPath);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}
	return new Promise((resolve, reject) => {
		const file = fs.createWriteStream(outputPath);
		const sendReq = request.get(url);
		sendReq.pipe(file);

		sendReq
		.on("response", (response) => {
			if (response.statusCode !== 200) {
				fs.unlink(outputPath);
				const error = new Error("Response status code was " + response.statusCode + ".");
				console.trace(error);
				reject(error);
			}
		})
		.on("error", (error) => {
			fs.unlink(outputPath);
			console.trace(error);
			reject(error);
		});

		file
		.on("finish", () => {
			file.close(() => {
				resolve();
			});
		})
		.on("error", (error) => {
			fs.unlink(outputPath);
			console.trace(error);
			reject(error);
		});
	});
}

// ====== Single Projects ====== \\
/**
 * Gets a project with the provided ID
 * @param {string} projectId
 * @return {Promise<Project>}
 */
function fetchProject(projectId) {
	return cocoonSDK.ProjectAPI.get(projectId)
	.catch((error) => {
		console.error("Project with ID: " + projectId + " couldn't be fetched.");
		console.trace(error);
		throw error;
	});
}

/**
 * Creates a new Cocoon Project from a zip file
 * @param {File} zipFile
 * @return {Promise<Project>}
 */
function createProject(zipFile) {
	return cocoonSDK.ProjectAPI.createFromZipUpload(zipFile)
	.catch((error) => {
		console.error("Project couldn't be created.");
		console.trace(error);
		throw error;
	});
}

/**
 * Updates the config.xml of the project with the one provided
 * @param {string} configXml
 * @param {Project} project
 * @return {Promise<void>}
 */
function updateConfig(configXml, project) {
	return project.updateConfigXml(configXml)
	.catch((error) => {
		console.error("Project config with ID: " + project.id + " couldn't be updated.");
		console.trace(error);
		throw error;
	});
}

/**
 * Updates the config.xml of the project with the same ID with the XML provided
 * @param {string} configXml
 * @param {string} projectId
 * @return {Promise<void>}
 */
function updateConfigWithId(configXml, projectId) {
	return fetchProject(projectId)
	.then((project) => {
		return updateConfig(configXml, project);
	})
	.catch((error) => {
		console.trace(error);
		throw error;
	});
}

/**
 * Deletes the project
 * @param {Project} project
 * @return {Promise<void>}
 */
function deleteProject(project) {
	return project.delete()
	.catch((error) => {
		console.error("Project with ID: " + project.id + " couldn't be deleted.");
		console.trace(error);
		throw error;
	});
}

/**
 * Deletes the project associated with the ID
 * @param {string} projectId
 * @return {Promise<void>}
 */
function deleteProjectWithId(projectId) {
	return fetchProject(projectId)
	.then(deleteProject)
	.catch((error) => {
		console.trace(error);
		throw error;
	});
}

/**
 * Creates a new Cocoon Project from a zip file and a config XML
 * @param {File} zipFile
 * @param {string} configXml
 * @return {Promise<Project>}
 */
function createProjectWithConfig(zipFile, configXml) {
	return createProject(zipFile)
	.then((project) => {
		return updateConfig(configXml, project)
		.then(() => {
			return project;
		})
		.catch((errorFromUpdate) => {
			deleteProject(project)
			.then(() => {
				console.error("The project with ID: " + project.id + " was not created because it wasn't possible to upload the custom XML.");
				throw errorFromUpdate;
			})
			.catch((errorFromDelete) => {
				console.error("The project with ID: " + project.id + " was created but it wasn't possible to upload the custom XML.");
				console.trace(errorFromDelete);
				throw errorFromDelete;
			});
		});
	})
	.catch((error) => {
		console.trace(error);
		throw error;
	});
}

/**
 * Uploads the zip file as the new source code of the project
 * @param {File} zipFile
 * @param {Project} project
 * @return {Promise<void>}
 */
function updateSource(zipFile, project) {
	return project.updateZip(zipFile)
	.catch((error) => {
		console.error("Project source with ID: " + project.id + " couldn't be updated.");
		console.trace(error);
		throw error;
	});
}

/**
 * Uploads the zip file as the new source code of the project with the same ID
 * @param {File} zipFile
 * @param {string} projectId
 * @return {Promise<void>}
 */
function updateSourceWithId(zipFile, projectId) {
	return fetchProject(projectId)
	.then((project) => {
		return updateSource(zipFile, project);
	})
	.catch((error) => {
		console.trace(error);
		throw error;
	});
}

/**
 * Places the project in the compilation queue
 * @param {Project} project
 * @return {Promise<void>}
 */
function compileProject(project) {
	return project.compile()
	.catch((error) => {
		console.error("Project " + project.name + " with ID: " + project.id + " couldn't be compiled.");
		console.trace(error);
		throw error;
	});
}

/**
 * Places the project associated with the ID in the compilation queue
 * @param {string} projectId
 * @return {Promise<void>}
 */
function compileProjectWithId(projectId) {
	return fetchProject(projectId)
	.then(compileProject)
	.catch((error) => {
		console.trace(error);
		throw error;
	});
}

/**
 * Waits for the project to finish compiling. Then calls the callback
 * @param {Project} project
 * @return {Promise<void>}
 */
function waitForCompletion(project) {
	return new Promise((resolve, reject) => {
		let warned = false;
		project.refreshUntilCompleted((completed, error) => {
			if (!error) {
				if (completed) {
					if (warned) {
						readLine.clearLine(process.stdout);  // clear "Waiting" line
						readLine.cursorTo(process.stdout, 0);  // move cursor to beginning of line
					}
					resolve();
				} else {
					if (!warned) {
						process.stdout.write("Waiting for " + project.name + " compilation to end ");
						warned = true;
					}
					process.stdout.write(".");
				}
			} else {
				reject(error);
			}
		});
	});
}

/**
 * Downloads the result of the latest platform compilation of the project
 * @param {Project} project
 * @param {string} platform
 * @param {string} outputDir
 * @return {Promise<void>}
 */
function downloadProjectCompilation(project, platform, outputDir) {
	return waitForCompletion(project)
	.then(() => {
		if (project.compilations[platform]) {
			if (project.compilations[platform].isReady()) {
				return downloadFile(project.compilations[platform].downloadLink,
					outputDir + "/" + project.name + "-" + platform + ".zip")
				.catch((error) => {
					console.error("Couldn't download " + platform + " compilation from project " + project.id + ".");
					console.trace(error);
					throw error;
				});
			} else if (project.compilations[platform].isErred()) {
				console.error("Couldn't download " + platform + " compilation from " + project.name + " project: " + project.id +
					". The compilation failed.");
				throw new Error("Compilation failed");
			} else {
				console.error("Couldn't download " + platform + " compilation from " + project.name + " project: " + project.id +
					". Status: " + project.compilations[platform].status + ".");
				throw new Error("Platform ignored");
			}
		} else {
			console.error("Couldn't download " + platform + " compilation from " + project.name + " project: " + project.id +
				". There was not a compilation issued for the platform.");
			throw new Error("No compilation available");
		}
	})
	.catch((error) => {
		console.trace(error);
		throw error;
	});
}

/**
 * Downloads the result of the latest platform compilation of the project with the ID provided
 * @param {string} projectId
 * @param {string} platform
 * @param {string} outputDir
 * @return {Promise<void>}
 */
function downloadProjectCompilationWithId(projectId, platform, outputDir) {
	return fetchProject(projectId)
	.then((project) => {
		return downloadProjectCompilation(project, platform, outputDir);
	})
	.catch((error) => {
		console.trace(error);
		throw error;
	});
}

/**
 * Downloads the results of the latest compilation of the project
 * @param {Project} project
 * @param {string} outputDir
 * @return {Promise<void>}
 */
function downloadProjectCompilations(project, outputDir) {
	const promises = [];
	for (const platform in project.compilations) {
		if (!project.compilations.hasOwnProperty(platform)) {
			continue;
		}
		promises.push(downloadProjectCompilation(project, platform, outputDir).catch(() => {
			return undefined;
		}));
	}
	return Promise.all(promises);
}

/**
 * Downloads the results of the latest compilation of the project with the ID provided
 * @param {string} projectId
 * @param {string} outputDir
 * @return {Promise<void>}
 */
function downloadProjectCompilationsWithId(projectId, outputDir) {
	return fetchProject(projectId)
	.then((project) => {
		return downloadProjectCompilations(project, outputDir);
	})
	.catch((error) => {
		console.trace(error);
		throw error;
	});
}

/**
 * Logs the result of the latest platform compilation of the project
 * @param {Project} project
 * @param {string} platform
 * @return {Promise<void>}
 */
function checkProjectCompilation(project, platform) {
	return waitForCompletion(project)
	.then(() => {
		if (project.compilations[platform]) {
			const compilation = project.compilations[platform];
			if (compilation.isReady()) {
				console.info(platform + " compilation from " + project.name + " project: " + project.id + " is completed.");
				return undefined;
			} else if (compilation.isErred()) {
				console.error(platform + " compilation from " + project.name + " project: " + project.id + " is erred.");
				return undefined;
			} else {
				console.error(platform + " compilation from " + project.name + " project: " + project.id +
					" was ignored. Status: " + compilation.status + ".");
				return undefined;
			}
		} else {
			console.error("There is no " + platform + " compilation from " + project.name + " project: " + project.id + ".");
			return undefined;
		}
	})
	.catch((error) => {
		console.trace(error);
		throw error;
	});
}

/**
 * Logs the result of the latest platform compilation of the project with the ID provided
 * @param {string} projectId
 * @param {string} platform
 * @return {Promise<void>}
 */
function checkProjectCompilationWithId(projectId, platform) {
	return fetchProject(projectId)
	.then((project) => {
		return checkProjectCompilation(project, platform);
	})
	.catch((error) => {
		console.trace(error);
		throw error;
	});
}

/**
 * Logs the results of the latest compilation of the project
 * @param {Project} project
 * @return {Promise<void>}
 */
function checkProjectCompilations(project) {
	return waitForCompletion(project)
	.then(() => {
		for (const platform in project.compilations) {
			if (!project.compilations.hasOwnProperty(platform)) {
				continue;
			}
			const compilation = project.compilations[platform];
			if (compilation.isReady()) {
				console.info(compilation.platform + " compilation from " + project.name + " project: " + project.id + " is completed.");
			} else if (compilation.isErred()) {
				console.error(compilation.platform + " compilation from " + project.name + " project: " + project.id + " is erred.");
				console.error("ERROR LOG of the " + compilation.platform + " platform:");
				console.error(compilation.error);
			} else {
				console.error(compilation.platform + " compilation from " + project.name + " project: " + project.id +
					" was ignored. Status: " + compilation.status + ".");
			}
		}
		return undefined;
	})
	.catch((error) => {
		console.trace(error);
		throw error;
	});
}

/**
 * Logs the results of the latest compilation of the project with the ID provided
 * @param {string} projectId
 * @return {Promise<void>}
 */
function checkProjectCompilationsWithId(projectId) {
	return fetchProject(projectId)
	.then((project) => {
		return checkProjectCompilations(project);
	})
	.catch((error) => {
		console.trace(error);
		throw error;
	});
}


// ====== Multiple Projects ====== \\
/**
 * Gets the whole list of projects of the logged user
 * @return {Promise<Project[]>}
 */
function fetchProjects() {
	return cocoonSDK.ProjectAPI.list()
	.then((projectList) => {
		return projectList;
	})
	.catch((error) => {
		console.error("Project list couldn't be fetched.");
		console.trace(error);
		throw error;
	});
}


// ================== GULP TASKS ================== \\

gulp.task("login", (done) => {
	if (USERNAME && PASSWORD) {
		login(USERNAME, PASSWORD)
		.then(done)
		.catch((error) => {
			done(error);
		});
	} else {
		if (!USERNAME) {
			console.error("Missing 'username' parameter.");
		}
		if (!PASSWORD) {
			console.error("Missing 'password' parameter.");
		}
		done(new Error("Missing parameters."));
	}
});

// ====== Single Projects ====== \\

gulp.task("createProject", ["login"], (done) => {
	if (argv.zipPath) {
		const file = fs.createReadStream(argv.zipPath);
		createProject(file)
		.then((project) => {
			console.info("Project " + project.name + " was created with ID: " + project.id + ".");
			done();
		})
		.catch((error) => {
			done(error);
		});
	} else {
		console.error("Missing 'zipPath' parameter.");
		done(new Error("Missing 'zipPath' parameter."));
	}
});

gulp.task("createProjectWithConfig", ["login"], (done) => {
	if (argv.zipPath && argv.configPath) {
		const zipFile = fs.createReadStream(argv.zipPath);
		const configXml = fs.readFileSync(argv.configPath, "utf8");
		createProjectWithConfig(zipFile, configXml)
		.then((project) => {
			console.info("Project " + project.name + " was created with ID: " + project.id + ".");
			done();
		})
		.catch(done);
	} else {
		if (!argv.zipPath) {
			console.error("Missing 'zipPath' parameter.");
		}
		if (!argv.configPath) {
			console.error("Missing 'configPath' parameter.");
		}
		done(new Error("Missing parameters."));
	}
});

gulp.task("updateSource", ["login"], (done) => {
	if (argv.projectId && argv.zipPath) {
		const file = fs.createReadStream(argv.zipPath);
		updateSourceWithId(file, argv.projectId)
		.then(() => {
			console.info("Project source with ID: " + argv.projectId + " was updated.");
			done();
		})
		.catch((error) => {
			done(error);
		});
	} else {
		if (!argv.projectId) {
			console.error("Missing 'projectId' parameter.");
		}
		if (!argv.zipPath) {
			console.error("Missing 'zipPath' parameter.");
		}
		done(new Error("Missing parameters."));
	}
});

gulp.task("updateConfig", ["login"], (done) => {
	if (argv.projectId && argv.configPath) {
		const configXml = fs.readFileSync(argv.configPath, "utf8");
		updateConfigWithId(configXml, argv.projectId)
		.then(() => {
			console.info("Project config with ID: " + argv.projectId + " was updated.");
			done();
		})
		.catch((error) => {
			done(error);
		});
	} else {
		if (!argv.projectId) {
			console.error("Missing 'projectId' parameter.");
		}
		if (!argv.configPath) {
			console.error("Missing 'configPath' parameter.");
		}
		done(new Error("Missing parameters."));
	}
});

gulp.task("delete", ["login"], (done) => {
	if (argv.projectId) {
		deleteProjectWithId(argv.projectId)
		.then(() => {
			console.info("Project with ID: " + argv.projectId + " was deleted.");
			done();
		})
		.catch((error) => {
			done(error);
		});
	} else {
		console.error("Missing 'projectId' parameter.");
		done(new Error("Missing 'projectId' parameter."));
	}
});

gulp.task("compile", ["login"], (done) => {
	if (argv.projectId) {
		compileProjectWithId(argv.projectId)
		.then(() => {
			console.info("Project with ID: " + argv.projectId + " will be compiled.");
			done();
		})
		.catch((error) => {
			done(error);
		});
	} else {
		console.error("Missing 'projectId' parameter.");
		done(new Error("Missing 'projectId' parameter."));
	}
});

gulp.task("downloadCompilation", ["login"], (done) => {
	if (argv.projectId) {
		const outputDir = argv.outputDir || DEFAULT_OUTPUT_DIR;
		if (argv.platform) {
			downloadProjectCompilationWithId(argv.projectId, argv.platform, outputDir)
			.then(() => {
				console.info("Downloaded " + argv.platform + " compilation from project with ID: " + argv.projectId + ".");
				done();
			})
			.catch((error) => {
				done(error);
			});
		} else {
			downloadProjectCompilationsWithId(argv.projectId, outputDir)
			.then(() => {
				console.info("Compilations for the project with ID: " + argv.projectId + " were downloaded.");
				done();
			})
			.catch((error) => {
				done(error);
			});
		}
	} else {
		console.error("Missing 'projectId' parameter.");
		done(new Error("Missing 'projectId' parameter."));
	}
});

gulp.task("checkCompilation", ["login"], (done) => {
	if (argv.projectId) {
		if (argv.platform) {
			checkProjectCompilationWithId(argv.projectId, argv.platform)
			.then(done)
			.catch((error) => {
				done(error);
			});
		} else {
			checkProjectCompilationsWithId(argv.projectId)
			.then(done)
			.catch((error) => {
				done(error);
			});
		}
	} else {
		console.error("Missing 'projectId' parameter.");
		done(new Error("Missing 'projectId' parameter."));
	}
});


// ====== Multiple Projects ====== \\

gulp.task("deleteAll", ["login"], (done) => {
	fetchProjects()
	.then((projectList) => {
		Promise.all(projectList.map((project) => {
			return deleteProject(project)
			.then(() => {
				console.info("The project " + project.name + " with ID: " + project.id + " was deleted.");
				return undefined;
			})
			.catch(() => {
				return undefined;
			});
		}))
		.then(() => {
			done();
		})
		.catch(done);
	})
	.catch((error) => {
		done(error);
	});
});

gulp.task("compileAll", ["login"], (done) => {
	fetchProjects()
	.then((projectList) => {
		return Promise.all(projectList.map((project) => {
			return compileProject(project)
			.then(() => {
				console.info("The project " + project.name + " with ID: " + project.id + " was placed in the compilation queue.");
				return undefined;
			})
			.catch(() => {
				return undefined;
			});
		}));
	})
	.then(() => {
		done();
	})
	.catch((error) => {
		done(error);
	});
});

gulp.task("checkAll", ["login"], (done) => {
	fetchProjects()
	.then((projectList) => {
		projectList.reduce((previousPromise, currentProject) => {
			return previousPromise.then(() => {
				return checkProjectCompilations(currentProject)
				.then(() => {
					console.log();
					return undefined;
				})
				.catch(() => {
					return undefined;
				});
			});
		}, Promise.resolve());
	})
	.catch((error) => {
		done(error);
	});
});
