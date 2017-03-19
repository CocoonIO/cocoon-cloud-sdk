# Cocoon Cloud SDK [![Travis Build Status](https://travis-ci.org/CocoonIO/cocoon-cloud-sdk.svg)](https://travis-ci.org/CocoonIO/cocoon-cloud-sdk) [![NPM Version](https://img.shields.io/npm/v/cocoon-cloud-sdk.svg)](https://www.npmjs.com/package/cocoon-cloud-sdk)

[![bitHound Overall Score](https://www.bithound.io/github/CocoonIO/cocoon-cloud-sdk/badges/score.svg)](https://www.bithound.io/github/CocoonIO/cocoon-cloud-sdk)
[![bitHound Dependencies](https://www.bithound.io/github/CocoonIO/cocoon-cloud-sdk/badges/dependencies.svg)](https://www.bithound.io/github/CocoonIO/cocoon-cloud-sdk/master/dependencies/npm)
[![bitHound Dev Dependencies](https://www.bithound.io/github/CocoonIO/cocoon-cloud-sdk/badges/devDependencies.svg)](https://www.bithound.io/github/CocoonIO/cocoon-cloud-sdk/master/dependencies/npm)
[![bitHound Code](https://www.bithound.io/github/CocoonIO/cocoon-cloud-sdk/badges/code.svg)](https://www.bithound.io/github/CocoonIO/cocoon-cloud-sdk)

[![Code Climate](https://codeclimate.com/github/CocoonIO/cocoon-cloud-sdk/badges/gpa.svg)](https://codeclimate.com/github/CocoonIO/cocoon-cloud-sdk)
[![Test Coverage](https://codeclimate.com/github/CocoonIO/cocoon-cloud-sdk/badges/coverage.svg)](https://codeclimate.com/github/CocoonIO/cocoon-cloud-sdk/coverage)
[![Issue Count](https://codeclimate.com/github/CocoonIO/cocoon-cloud-sdk/badges/issue_count.svg)](https://codeclimate.com/github/CocoonIO/cocoon-cloud-sdk)
---

The Cocoon Cloud SDK is the easiest way to integrate the Cocoon.io cloud compiler in any service or app.
With this simple API, anyone can authenticate with their Cocoon.io account and create, update and compile HTML5 projects
in the cloud programmatically.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing
purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

First things first. In order to access the Cocoon.io API you will need a ClientID credential. You can contact us at
[support@cocoon.io](support@cocoon.io) to request it.

Other than that, you only need to have [NodeJS and NPM](https://nodejs.org/en/download/package-manager/) installed in
your system.

```bash
curl -sL https://deb.nodesource.com/setup_7.x | sudo -E bash -
sudo apt install -y nodejs
```

### Installing

Clone the repository.

```bash
git clone https://github.com/CocoonIO/cocoon-cloud-sdk.git
```

And install its dependencies

```bash
npm install
```

The transpiled code should be in the **out** folder.

## Running the tests

The tests are found in [spec/tests](spec/tests).

```bash
npm test
```

### Coding style tests

To inspect the code style of the [source code](src):

```bash
npm run inspect-src
```

To inspect the code style of the [tests](spec/tests):

```bash
npm run inspect-spec
```

## Deployment

To use this repo as a NPM module in your project follow these instructions.

As mentioned previously: to access the Cocoon.io API you will need a ClientID credential. You can contact us at
[support@cocoon.io](support@cocoon.io) to request it.

Install [NodeJS and NPM](https://nodejs.org/en/download/package-manager/) in your system.

```bash
curl -sL https://deb.nodesource.com/setup_7.x | sudo -E bash -
sudo apt install -y nodejs
```

Install the module from [NPM](https://www.npmjs.com/package/cocoon-cloud-sdk).

```bash
npm install cocoon-cloud-sdk
```

And import it in your NodeJS or Web project.

```js
import cocoonSDK from "cocoon-cloud-sdk";
```

```html
<script src="cocoon-cloud-sdk/index.js"></script>
```

### Example

You can see an example of the usage in [sample](sample).

### Usage

Log In into Cocoon.

```js
cocoonSDK.APIClient.logIn("john.smith@example.com", "12345678", {clientId: "MY_CLIENT_ID"}, (error) => {
	if (!error) {
		loginSucceeded();
	} else {
		alert(JSON.stringify(error));
	}
});
```

Some API Examples. The APIClient object mimics the Cocoon.io REST API.

The Project API:

```js
//List all projects
cocoonSDK.ProjectAPI.list((projectsData, error) => {

});

//Create a new project by uploading a zip file
cocoonSDK.ProjectAPI.createFromZipUpload(file, (projectData, error) => {

});

//Create a new project from a url
cocoonSDK.ProjectAPI.createFromURL("MY_URL", (projectData, error) => {

});

//Create a new project from a repository
cocoonSDK.ProjectAPI.createFromRepository({url:"MY_GITHUB_URL"}, (projectData, error) => {

});
```

For Signing Keys:

```js
//List all signing keys
cocoonSDK.SigningKeyAPI.list((signingKeysData, error) => {

});

//Create a new Android signing key
cocoonSDK.SigningKeyAPI.createAndroid(name, alias, keystore, keystorePassword, certificatePassword, (signingKeyData, error) => {

});
```

The data objects returned by the API can be used to create objects with their own methods to ease commonly performed tasks.

```js
let project
let signingKey

//Creating a Project object
cocoonSDK.ProjectAPI.get("PROJECT_ID", (projectData, error) => {
	project = new cocoonSDK.Project(projectData);
	//project.isCompiling();
	//project.updateZip(zipFile, callback);
	//project.delete(callback);
	//project.assignSigningKey(signingKey, callback);
	//...
});

cocoonSDK.SigningKeyAPI.get("SIGNING_KEY_ID", (signingKeyData, error) => {
	signingKey = new cocoonSDK.SigningKey(signingKeyData);
	//signingKey.delete(callback);
});
```

## Built With

* [Typescript](https://www.typescriptlang.org/) - Language
* [NPM](http://www.npmjs.com/) - Dependency Management
* [Jasmine](https://jasmine.github.io/) - Testing Framework
* [Popsicle](https://github.com/blakeembrey/popsicle) - Simple HTTP requests library for node and the browser
* [XMLSugar](https://github.com/CocoonIO/cocoon-xml-sugar) Helper functions to work with the config.xml

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the
[tags on this repository](https://github.com/your/project/tags). 

## Authors

* **Imanol Fernandez** - *Version 1.0.0* - [MortimerGoro](https://github.com/MortimerGoro)
* **Jorge Domínguez** - *Version 2.0.0* - [BlueSialia](https://github.com/BlueSialia)

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
