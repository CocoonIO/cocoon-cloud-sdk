"use strict";

const cocoonSDK = require("cocoon-cloud-sdk");
const fs = require("fs");
const gulp = require("gulp");
const https = require("https");
const path = require("path");
const readLine = require("readline");
const argv = require("yargs").argv;

const CLIENT_ID = "CLIENT_ID";
const CLIENT_SECRET = "CLIENT_SECRET";
const DEFAULT_OUTPUT_DIR = "./out";
const DEFAULT_TEST_PROJECTS_PATH = "./tests";

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
			return Promise.resolve();
		})
		.catch((error) => {
			console.error("Login not successful.");
			return Promise.reject(error);
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
	const file = fs.createWriteStream(outputPath);
	return new Promise((resolve, reject) => {
		https.get(url, (response) => {
			response.pipe(file).on("finish", () => {
				resolve();
			});
		}).on("error", (error) => {
			reject(error);
		});
	});
}

/**
 * Gets the list of directories in a path
 * @param {string} dir
 * @returns {Array.<string>}
 */
function getFolders(dir) {
	return fs.readdirSync(dir)
	.filter((file) => {
		return fs.statSync(path.join(dir, file)).isDirectory();
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
	.then(Promise.resolve)
	.catch((error) => {
		console.error("Project with ID: " + projectId + " couldn't be fetched.");
		return Promise.reject(error);
	});
}

/**
 * Creates a new Cocoon Project from a zip file
 * @param {File} zipFile
 * @return {Promise<Project>}
 */
function createProject(zipFile) {
	return cocoonSDK.ProjectAPI.createFromZipUpload(zipFile)
	.then(Promise.resolve)
	.catch((error) => {
		console.error("Project couldn't be created.");
		return Promise.reject(error);
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
	.then(Promise.resolve)
	.catch((error) => {
		console.error("Project config with ID: " + project.id + " couldn't be updated.");
		return Promise.reject(error);
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
	.catch(Promise.reject);
}

/**
 * Deletes the project
 * @param {Project} project
 * @return {Promise<void>}
 */
function deleteProject(project) {
	return project.delete()
	.then(() => {
		console.log(1);
		return Promise.resolve();
	})
	.catch((error) => {
		console.error("Project with ID: " + project.id + " couldn't be deleted.");
		return Promise.reject(error);
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
	.catch(Promise.reject);
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
			return deleteProject(project)
			.then(Promise.resolve)
			.catch((error) => {
				console.error("The project with ID: " + project.id + " was created but it wasn't possible to upload the custom XML.");
				return Promise.reject(error);
			});
		})
		.catch(Promise.reject);
	})
	.catch(Promise.reject);
}

/**
 * Uploads the zip file as the new source code of the project
 * @param {File} zipFile
 * @param {Project} project
 * @return {Promise<void>}
 */
function updateSource(zipFile, project) {
	return project.updateZip(zipFile)
	.then(Promise.resolve)
	.catch((error) => {
		console.error("Project source with ID: " + project.id + " couldn't be updated.");
		return Promise.reject(error);
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
	.catch(Promise.reject);
}

/**
 * Places the project in the compilation queue
 * @param {Project} project
 * @return {Promise<void>}
 */
function compileProject(project) {
	return project.compile()
	.then(Promise.resolve)
	.catch((error) => {
		console.error("Project " + project.name + " with ID: " + project.id + " couldn't be compiled.");
		return Promise.reject(error);
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
	.catch(Promise.reject);
}

/**
 * Waits for the project to finish compiling. Then calls the callback
 * @param {Project} project
 * @return {Promise<void>}
 */
function waitForCompletion(project) {
	let warned = false;
	project.refreshUntilCompleted((completed) => {
		if (completed) {
			if (warned) {
				readLine.clearLine(process.stdout);  // clear "Waiting" line
				readLine.cursorTo(process.stdout, 0);  // move cursor to beginning of line
			}
			return Promise.resolve();
		} else {
			if (!warned) {
				process.stdout.write("Waiting for " + project.name + " compilation to end ");
				warned = true;
			}
			process.stdout.write(".");
		}
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
				.then(Promise.resolve)
				.catch((error) => {
					console.error("Couldn't download " + platform + " compilation from project " + project.id + ".");
					return Promise.reject(error);
				});
			} else if (project.compilations[platform].isErred()) {
				console.error("Couldn't download " + platform + " compilation from " + project.name + " project: " + project.id +
					". The compilation failed.");
				return Promise.reject(new Error("Compilation failed"));
			} else {
				console.error("Couldn't download " + platform + " compilation from " + project.name + " project: " + project.id +
					". Status: " + project.compilations[platform].status + ".");
				return Promise.reject(new Error("Platform ignored"));
			}
		} else {
			console.error("Couldn't download " + platform + " compilation from " + project.name + " project: " + project.id +
				". There was not a compilation issued for the platform.");
			return Promise.reject(new Error("No compilation available"));
		}
	})
	.catch(Promise.reject);
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
	.catch(Promise.reject);
}

/**
 * Downloads the results of the latest compilation of the project
 * @param {Project} project
 * @param {string} outputDir
 * @return {Promise<void>}
 */
function downloadProjectCompilations(project, outputDir) {
	const promises = [];
	for (const compilation of project.compilations) {
		promises.push(downloadProjectCompilation(project, compilation.platform, outputDir).catch(Promise.resolve));
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
	.catch(Promise.reject);
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
			if (project.compilations[platform].isReady()) {
				console.log(platform + " compilation from " + project.name + " project: " + project.id + " is completed");
				return Promise.resolve();
			} else if (project.compilations[platform].isErred()) {
				console.error(platform + " compilation from " + project.name + " project: " + project.id + " is erred");
				//endWithError = true;
				return Promise.resolve();
			} else {
				console.error(platform + " compilation from " + project.name + " project: " + project.id +
					" was ignored. Status: " + project.compilations[platform].status + ".");
				//endWithError = true;
				return Promise.resolve();
			}
		} else {
			console.error("There is no " + platform + " compilation from " + project.name + " project: " + project.id + ".");
			return Promise.resolve();
		}
	})
	.catch(Promise.reject);
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
	.catch(Promise.reject);
}

/**
 * Logs the results of the latest compilation of the project
 * @param {Project} project
 * @return {Promise<void>}
 */
function checkProjectCompilations(project) {
	return waitForCompletion(project)
	.then(() => {
		for (const compilation of project.compilations) {
			if (compilation.isReady()) {
				console.log(compilation.platform + " compilation from " + project.name + " project: " + project.id + " is completed");
			} else if (compilation.isErred()) {
				console.error(compilation.platform + " compilation from " + project.name + " project: " + project.id + " is erred");
			} else {
				console.error(compilation.platform + " compilation from " + project.name + " project: " + project.id +
					" was ignored. Status: " + compilation.status + ".");
			}
		}
		return Promise.resolve();
	})
	.catch(Promise.reject);
}

/**
 * Logs the results of the latest compilation of the project with the ID provided
 * @param {string} projectId
 * @return {Promise<void>}
 */
function checkProjectCompilationsWithId(projectId) {
	return fetchProject(projectId)
	.then(checkProjectCompilations)
	.catch(Promise.reject);
}


// ====== Multiple Projects ====== \\
/**
 * Gets the whole list of projects of the logged user
 * @return {Promise<Array.<Project>>}
 */
function fetchProjects() {
	return cocoonSDK.ProjectAPI.list()
	.then(Promise.resolve)
	.catch((error) => {
		console.error("Project list couldn't be fetched.");
		return Promise.reject(error);
	});
}


// ================== GULP TASKS ================== \\

gulp.task("login", (done) => {
	if (argv.username && argv.password) {
		login(argv.username, argv.password)
		.then(done)
		.catch((error) => {
			done(error);
		});
	} else {
		if (!argv.username) {
			console.error("Missing 'username' parameter.");
		}
		if (!argv.password) {
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
			console.log("Project " + project.name + " was created with ID: " + project.id + ".");
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
			console.log("Project " + project.name + " was created with ID: " + project.id + ".");
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
			console.log("Project source with ID: " + argv.projectId + " was updated.");
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
			console.log("Project config with ID: " + argv.projectId + " was updated.");
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
			console.log("Project with ID: " + argv.projectId + " was deleted.");
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
			console.log("Project with ID: " + argv.projectId + " will be compiled.");
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
				console.log("Downloaded " + argv.platform + " compilation from project with ID: " + argv.projectId + ".");
				done();
			})
			.catch((error) => {
				done(error);
			});
		} else {
			downloadProjectCompilationsWithId(argv.projectId, outputDir)
			.then(() => {
				console.log("Compilations for the project with ID: " + argv.projectId + " were downloaded.");
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
				console.log("The project " + project.name + " with ID: " + project.id + " was deleted.");
				return Promise.resolve();
			})
			.catch(Promise.resolve);
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
		Promise.all(projectList.map((project) => {
			return compileProject(project)
			.then(() => {
				console.log("The project " + project.name + " with ID: " + project.id + " was placed in the compilation queue.");
				return Promise.resolve();
			})
			.catch(Promise.resolve);
		}))
		.then(() => {
			done();
		})
		.catch((error) => {
			done(error);
		});
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
				.then(Promise.resolve)
				.catch(Promise.resolve);
			});
		}, Promise.resolve());
	})
	.catch((error) => {
		done(error);
	});
});

gulp.task("uploadTests", ["deleteAll"], (done) => {
	const testProjectsPath = argv.testProjectsPath || DEFAULT_TEST_PROJECTS_PATH;
	const folders = [];
	const auxFolders = getFolders(testProjectsPath);
	for (let i = auxFolders.length - 1; i >= 0; i--) {
		const auxFolders2 = getFolders(testProjectsPath + "/" + auxFolders[i]);
		for (let j = auxFolders2.length - 1; j >= 0; j--) {
			folders.push(testProjectsPath + "/" + auxFolders[i] + "/" + auxFolders2[j]);
		}
	}
	Promise.all(folders.map((folder) => {
		const zipFile = fs.createReadStream(folder + "/source.zip");
		const configXml = fs.readFileSync(folder + "/config.xml");
		return createProjectWithConfig(zipFile, configXml)
		.then((project) => {
			console.log("Project " + project.name + " was created with ID: " + project.id + ".");
			return Promise.resolve();
		})
		.catch(() => {
			console.error("It was not possible to create a project from the path: '" + folder + "'.");
			return Promise.resolve();
		})
		.catch(Promise.resolve);
	}))
	.then(() => {
		done();
	})
	.catch((error) => {
		done(error);
	});
});
