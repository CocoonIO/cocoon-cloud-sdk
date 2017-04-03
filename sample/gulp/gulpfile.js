"use strict";

const argv = require("yargs").argv;
const cocoonSDK = require("cocoon-cloud-sdk");
const Project = cocoonSDK.Project;
const fs = require("fs");
const gulp = require("gulp");
const https = require("https");
const path = require("path");
const readLine = require("readline");

const CLIENT_ID = "CLIENT_ID";
const CLIENT_SECRET = "CLIENT_SECRET";
const API_URL = null;
const OAUTH_URL = null;
const DEFAULT_OUTPUT_DIR = "./out";

/**
 * This callback is called when the functions ends.
 * @callback endCallback
 */

/**
 * This callback is called when the functions ends.
 * @callback endStatusCallback
 * @param {IError} [error] If there was a critical error
 */

/**
 * This callback is called when the functions ends.
 * @callback projectCallback
 * @param {Project} project project returned by the function
 * @param {IError} [error] If there was a critical error
 */

/**
 * This callback is called when the functions ends.
 * @callback projectListCallback
 * @param {Array.<Project>} projectList project list returned by the function
 * @param {IError} [error] If there was a critical error
 */

// ================== FUNCTIONS ================== \\
/**
 * Logs the user in if not already logged in.
 * @param {String} userName
 * @param {String} password
 * @param {String} clientId
 * @param {String} [clientSecret]
 * @param {String} [apiURL]
 * @param {String} [oauthURL]
 * @param {endStatusCallback} [callback]
 */
function login(userName, password, clientId, clientSecret, apiURL, oauthURL, callback) {
	if (!cocoonSDK.APIClient.isLoggedIn()) {
		cocoonSDK.APIClient.logIn(userName, password, {
			apiURL: apiURL,
			clientId: clientId,
			clientSecret: clientSecret,
			oauthURL: oauthURL
		}, (error) => {
			if (!error) {
				callback();
			} else {
				console.error("Login not successful.");
				callback(error);
			}
		});
	} else {
		callback();
	}
}

/**
 * Downloads the URL as a file
 * @param {String} url
 * @param {String} outputPath
 * @param {endStatusCallback} callback
 */
function downloadFile(url, outputPath, callback) {
	let dir = path.dirname(outputPath);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}
	let file = fs.createWriteStream(outputPath);
	https.get(url, (response) => {
		response.pipe(file).on("finish", () => {
			callback();
		});
	}).on("error", (error) => {
		callback(error);
	});
}

// ====== Single Projects ====== \\
/**
 * Gets a project with the provided ID
 * @param {String} projectId
 * @param {projectCallback} callback
 */
function fetchProject(projectId, callback) {
	cocoonSDK.ProjectAPI.get(projectId, (projectData, error) => {
		if (!error) {
			callback(new Project(projectData));
		} else {
			console.error("The project with ID " + projectId + " couldn't be fetched.");
			callback(null, error);
		}
	});
}

/**
 * Creates a new Cocoon Project from a zip file
 * @param {File} zipFile
 * @param {projectCallback} callback
 */
function createProject(zipFile, callback) {
	cocoonSDK.ProjectAPI.createFromZipUpload(zipFile, (projectData, error) => {
		if (!error) {
			callback(new Project(projectData), error);
		} else {
			console.error("The project couldn't be created.");
			callback(null, error);
		}
	});
}

/**
 * Updates the config.xml of the project with the one provided
 * @param {String} configXml
 * @param {Project} project
 * @param {projectCallback} callback
 */
function updateConfig(configXml, project, callback) {
	project.updateConfigXml(configXml, (error) => {
		if (!error) {
			callback(project);
		} else {
			console.error("Config of the project " + project.name + " (" + project.id + ") couldn't be updated.");
			callback(null, error);
		}
	});
}

/**
 * Updates the config.xml of the project with the same ID with the XML provided
 * @param {String} configXml
 * @param {String} projectId
 * @param {endStatusCallback} callback
 */
function updateConfigWithId(configXml, projectId, callback) {
	fetchProject(projectId, (project, error) => {
		if (!error) {
			updateConfig(configXml, project, callback);
		} else {
			callback(error);
		}
	});
}

/**
 * Deletes the project
 * @param {Project} project
 * @param {endStatusCallback} callback
 */
function deleteProject(project, callback) {
	project.delete((error) => {
		if (error) {
			console.error("The project " + project.name + " (" + project.id + ") couldn't be deleted.");
		}
		callback(error);
	});
}

/**
 * Deletes the project associated with the ID
 * @param {String} projectId
 * @param {endStatusCallback} callback
 */
function deleteProjectWithId(projectId, callback) {
	fetchProject(projectId, (project, error) => {
		if (error) {
			callback(error);
		} else {
			deleteProject(project, callback);
		}
	});
}

/**
 * Creates a new Cocoon Project from a zip file and a config XML
 * @param {File} zipFile
 * @param {String} configXml
 * @param {projectCallback} callback
 */
function createProjectWithConfig(zipFile, configXml, callback) {
	createProject(zipFile, (project, error) => {
		if (!error) {
			updateConfig(configXml, project, (error) => {
				if (!error) {
					callback(project);
				} else {
					deleteProject(project, (error) => {
						if (!error) {
							callback(project);
						} else {
							console.error("The project was created but it wasn't possible to upload the custom XML.");
							callback(null, error);
						}
					});
				}
			});
		} else {
			callback(project, error);
		}
	});
}

/**
 * Uploads the zip file as the new source code of the project
 * @param {File} zipFile
 * @param {Project} project
 * @param {projectCallback} callback
 */
function updateSource(zipFile, project, callback) {
	project.updateZip(zipFile, (error) => {
		if (!error) {
			callback(project);
		} else {
			console.error("Source of the project " + project.name + " (" + project.id + ") couldn't be updated.");
			callback(null, error);
		}
	});
}

/**
 * Uploads the zip file as the new source code of the project with the same ID
 * @param {File} zipFile
 * @param {String} projectId
 * @param {projectCallback} callback
 */
function updateSourceWithId(zipFile, projectId, callback) {
	fetchProject(projectId, (project, error) => {
		if (!error) {
			updateSource(zipFile, project, callback);
		} else {
			callback(null, error);
		}
	});
}

/**
 * Places the project in the compilation queue
 * @param {Project} project
 * @param {endStatusCallback} callback
 */
function compileProject(project, callback) {
	project.compile((error) => {
		if (error) {
			console.error("The project " + project.name + " (" + project.id + ") couldn't be compiled.");
		}
		callback(error);
	});
}

/**
 * Places the project associated with the ID in the compilation queue
 * @param {String} projectId
 * @param {endStatusCallback} callback
 */
function compileProjectWithId(projectId, callback) {
	fetchProject(projectId, (project, error) => {
		if (error) {
			callback(error);
		} else {
			compileProject(project, callback);
		}
	});
}

/**
 * Waits for the project to finish compiling. Then calls the callback
 * @param {Project} project
 * @param {endCallback} callback
 */
function waitForCompletion(project, callback) {
	let warned = false;
	project.refreshUntilCompleted((completed) => {
		if (completed) {
			if (warned) {
				readLine.clearLine(process.stdout);  // clear "Waiting" line
				readLine.cursorTo(process.stdout, 0);  // move cursor to beginning of line
			}
			callback();
		} else {
			if (!warned) {
				process.stdout.write("Waiting for " + project.name + " (" + project.id + ") compilation to end ");
				warned = true;
			}
			process.stdout.write(".");
		}
	});
}

/**
 * Downloads the result of the latest platform compilation of the project
 * @param {Project} project
 * @param {String} platform
 * @param {String} outputDir
 * @param {endStatusCallback} callback
 */
function downloadProjectCompilation(project, platform, outputDir, callback) {
	waitForCompletion(project, (error) => {
		if (!error) {
			let compilation = project.compilations[platform];
			if (compilation) {
				if (compilation.isReady()) {
					downloadFile(compilation.downloadLink, outputDir + "/" + project.name + "-" + platform + ".zip", (error) => {
						if (error) {
							console.error("Couldn't download " + platform + " compilation from project " + project.name + " (" + project.id + ").");
						}
						callback(error);
					});
				} else if (compilation.isErred()) {
					console.error("Couldn't download " + platform + " compilation from project " + project.name + " (" + project.id + "). The compilation failed.");
					callback(new Error("Compilation failed"));
				} else {
					console.error("Couldn't download " + platform + " compilation from project " + project.name + " (" + project.id + "). Status: " + compilation.getStatus() + ".");
					callback(new Error("Platform ignored"));
				}
			} else {
				console.error("Couldn't download " + platform + " compilation from project " + project.name + " (" + project.id + "). There was not a compilation issued for the platform.");
				callback(new Error("No compilation available"));
			}
		} else {
			callback(error);
		}
	});
}

/**
 * Downloads the result of the latest platform compilation of the project with the ID provided
 * @param {String} projectId
 * @param {String} platform
 * @param {String} outputDir
 * @param {endStatusCallback} callback
 */
function downloadProjectCompilationWithId(projectId, platform, outputDir, callback) {
	fetchProject(projectId, (project, error) => {
		if (!error) {
			downloadProjectCompilation(project, platform, outputDir, callback);
		} else {
			callback(error);
		}
	});
}

/**
 * Downloads the results of the latest compilation of the project
 * @param {Project} project
 * @param {String} outputDir
 * @param {endCallback} callback
 */
function downloadProjectCompilations(project, outputDir, callback) {
	let auxFunction = (i) => {
		if (i < project.compilations.length) {
			downloadProjectCompilation(project, project.compilations[i].platform, outputDir, () => {
				auxFunction(i + 1);
			});
		} else {
			callback();
		}
	};
	auxFunction(0);
}

/**
 * Downloads the results of the latest compilation of the project with the ID provided
 * @param {String} projectId
 * @param {String} outputDir
 * @param {endStatusCallback} callback
 */
function downloadProjectCompilationsWithId(projectId, outputDir, callback) {
	fetchProject(projectId, (project, error) => {
		if (!error) {
			downloadProjectCompilations(project, outputDir, callback);
		} else {
			callback(error);
		}
	});
}

/**
 * Logs the result of the latest platform compilation of the project
 * @param {Project} project
 * @param {String} platform
 * @param {endStatusCallback} callback
 */
function checkProjectCompilation(project, platform, callback) {
	waitForCompletion(project, (error) => {
		if (!error) {
			let compilation = project.compilations[platform];
			if (compilation) {
				if (compilation.isReady()) {
					console.log(platform + " compilation from " + project.name + " (" + project.id + ") is completed");
					callback();
				} else if (compilation.isErred()) {
					console.error(platform + " compilation from " + project.name + " (" + project.id + ") is erred");
					callback();
				} else {
					console.error(platform + " compilation from " + project.name + " (" + project.id + ") was ignored. Status: " + compilation.status + ".");
					callback();
				}
			} else {
				console.error("There is no " + platform + " compilation from " + project.name + " (" + project.id + ").");
				callback();
			}
		} else {
			callback(error);
		}
	});
}

/**
 * Logs the result of the latest platform compilation of the project with the ID provided
 * @param {String} projectId
 * @param {String} platform
 * @param {endStatusCallback} callback
 */
function checkProjectCompilationWithId(projectId, platform, callback) {
	fetchProject(projectId, (project, error) => {
		if (!error) {
			checkProjectCompilation(project, platform, callback);
		} else {
			callback(error);
		}
	});
}

/**
 * Logs the results of the latest compilation of the project
 * @param {Project} project
 * @param {endCallback} callback
 */
function checkProjectCompilations(project, callback) {
	let auxFunction = (i) => {
		if (i < project.compilations.length) {
			checkProjectCompilation(project, project.compilations[i].platform, () => {
				auxFunction(i + 1);
			});
		} else {
			callback();
		}
	};
	auxFunction(0);
}

/**
 * Logs the results of the latest compilation of the project with the ID provided
 * @param {String} projectId
 * @param {endStatusCallback} callback
 */
function checkProjectCompilationsWithId(projectId, callback) {
	fetchProject(projectId, (project, error) => {
		if (!error) {
			checkProjectCompilations(project, callback);
		} else {
			callback(error);
		}
	});
}


// ====== Multiple Projects ====== \\
/**
 * Gets the whole list of projects of the logged user
 * @param {projectListCallback} callback
 */
function fetchProjects(callback) {
	cocoonSDK.ProjectAPI.list((projectDataList, error) => {
		if (!error) {
			let projectList = [];
			for (let projectData of projectDataList) {
				projectList.push(new Project(projectData));
			}
			callback(projectList);
		} else {
			console.error("Project list couldn't be fetched.");
			callback(null, error);
		}
	});
}


// ================== GULP TASKS ================== \\

gulp.task("login", (done) => {
	if (argv.username && argv.password) {
		login(argv.username, argv.password, CLIENT_ID, CLIENT_SECRET, API_URL, OAUTH_URL, (error) => {
			done(JSON.stringify(error));
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
		let file = fs.createReadStream(argv.zipPath);
		createProject(file, (project, error) => {
			if (!error) {
				console.log("Project " + project.name + " was created with ID: " + project.id + ".");
			}
			done(JSON.stringify(error));
		});
	} else {
		console.error("Missing 'zipPath' parameter.");
		done(new Error("Missing 'zipPath' parameter."));
	}
});

gulp.task("createProjectWithConfig", ["login"], (done) => {
	if (argv.zipPath && argv.configPath) {
		let zipFile = fs.createReadStream(argv.zipPath);
		let configXml = fs.readFileSync(argv.configPath, "utf8");
		createProjectWithConfig(zipFile, configXml, (project, error) => {
			if (!error) {
				console.log("Project " + project.name + " was created with ID: " + project.id + ".");
			}
			done(JSON.stringify(error));
		});
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
		let file = fs.createReadStream(argv.zipPath);
		updateSourceWithId(file, argv.projectId, (error) => {
			if (!error) {
				console.log("Project source with ID: " + argv.projectId + " was updated.");
			}
			done(JSON.stringify(error));
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
		let configXml = fs.readFileSync(argv.configPath, "utf8");
		updateConfigWithId(configXml, argv.projectId, (error) => {
			if (!error) {
				console.log("Project config with ID: " + argv.projectId + " was updated.");
			}
			done(JSON.stringify(error));
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
		deleteProjectWithId(argv.projectId, (error) => {
			if (!error) {
				console.log("Project with ID: " + argv.projectId + " was deleted.");
			}
			done(JSON.stringify(error));
		});
	} else {
		console.error("Missing 'projectId' parameter.");
		done(new Error("Missing 'projectId' parameter."));
	}
});

gulp.task("compile", ["login"], (done) => {
	if (argv.projectId) {
		compileProjectWithId(argv.projectId, (error) => {
			if (!error) {
				console.log("Project with ID: " + argv.projectId + " will be compiled.");
			}
			done(JSON.stringify(error));
		});
	} else {
		console.error("Missing 'projectId' parameter.");
		done(new Error("Missing 'projectId' parameter."));
	}
});

gulp.task("downloadCompilation", ["login"], (done) => {
	if (argv.projectId) {
		let outputDir = argv.outputDir || DEFAULT_OUTPUT_DIR;
		if (argv.platform) {
			downloadProjectCompilationWithId(argv.projectId, argv.platform, outputDir, (error) => {
				if (!error) {
					console.log("Downloaded " + argv.platform + " compilation from project with ID: " + argv.projectId + ".");
				}
				done(JSON.stringify(error));
			});
		} else {
			downloadProjectCompilationsWithId(argv.projectId, outputDir, (error) => {
				if (!error) {
					console.log("Compilations for the project with ID: " + argv.projectId + " were downloaded.");
				}
				done(JSON.stringify(error));
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
			checkProjectCompilationWithId(argv.projectId, argv.platform, (error) => {
				done(JSON.stringify(error));
			});
		} else {
			checkProjectCompilationsWithId(argv.projectId, (error) => {
				done(JSON.stringify(error));
			});
		}
	} else {
		console.error("Missing 'projectId' parameter.");
		done(new Error("Missing 'projectId' parameter."));
	}
});

// ====== Multiple Projects ====== \\

gulp.task("deleteAll", ["login"], (done) => {
	fetchProjects((projectList, error) => {
		if (!error) {
			let auxFunction = (i) => {
				if (i < projectList.length) {
					deleteProject(projectList[i], (error) => {
						if (!error) {
							console.log("The project " + projectList[i].name + " with ID: " + projectList[i].id + " was deleted.");
						}
						auxFunction(i + 1);
					});
				} else {
					done();
				}
			};
			auxFunction(0);
		} else {
			done(JSON.stringify(error));
		}
	});
});

gulp.task("compileAll", ["login"], (done) => {
	fetchProjects((projectList, error) => {
		if (!error) {
			let auxFunction = (i) => {
				if (i < projectList.length) {
					compileProject(projectList[i], (error) => {
						if (!error) {
							console.log("The project " + projectList[i].name + " with ID: " + projectList[i].id + " was placed in the compilation queue.");
						}
						auxFunction(i + 1);
					});
				} else {
					done();
				}
			};
			auxFunction(0);
		} else {
			done(JSON.stringify(error));
		}
	});
});

gulp.task("checkAll", ["login"], (done) => {
	fetchProjects((projectList, error) => {
		if (!error) {
			let auxFunction = (i) => {
				if (i < projectList.length) {
					checkProjectCompilations(projectList[i], () => {
						console.log(); //newline to format output
						auxFunction(i + 1);
					});
				} else {
					done();
				}
			};
			auxFunction(0);
		} else {
			done(JSON.stringify(error));
		}
	});
});
