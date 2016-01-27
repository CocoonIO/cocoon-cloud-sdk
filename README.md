# cocoon-sdk

cocoon.io is a cloud service that allows any web developer to build performant mobile native apps/games based on their HTML5 content. 

The Cocoon SDK is the easiest way to integrate the cocoon.io cloud compiler in any service or app. With this simple API anyone can authenticate with their cocoon.io account and create, update and compile HTML5 projects in the cloud programmatically. It also includes a XML Sugar utility to make Cordova based config.xml changes super easy.

## Setup your project

You need to create a ClientID in order to use this SDK with your application. Please, contact us at support@cocoon.io to ask for the required credentials to use CocoonSDK with your Website or application.

## API Reference

See [`d.ts declaration file`](dist/cocoon.sdk.d.ts) for a complete overview of the capabilities of the SDK.

## Usage

Include the [`CocoonSDK library`](dist/cocoon.sdk.js) in your Web Application or NodeJS application

See [`test`](test) for a complete express project which uses the CocoonSDK

```
<script src="scripts/cocoon.sdk.js"></script>
```

Initialize the APIClient

```js
var client = new CocoonSDK.APIClient({clientId:"MY_CLIENT_ID"});
```

Log In into Cocoon

```js
client.logIn({}, function(token, error) {
    if (error) {
        alert("Error: " + JSON.stringify(error));
        return
    }
    loginSucceeded();
});
```

Some API Examples

```js
//List all projects
client.project.list(function(projects, error){

});

//Create a new project by uploading a zip file
client.project.createFromZipUpload(file, function(project, error) {

});

//Create a new project from a repository
client.project.createFromRepository({url:"MY_GITHUB_URL"}, function(project, error) {

});

//Create a new project from a public zip url
client.project.createFromPublicZip("PUBLIC_ZIP_URL", function(project, error) {

});

//Fetch the project Config XML
client.project.getConfigXml(function(xml, error) {
	// Check on the XMLSugar helper functions below to see how to easily manipulate the config.xml content
}

//Save the project Config XML
client.project.putConfigXml(xml, function(error) {
});

//Compile project
client.project.compile(function(error){

});

//Compile DeveloperApp
client.project.compileDevApp(function(error){

});

//Check if a project is compiling
client.project.isCompiling();

//Get download link for a platform 
client.project.getDownloadLink('ios');

//Get project compilations data
for (var i = 0; i < client.project.compilations.length; ++i) {
    var compilation = project.compilations[o];
    console.log(compilation.platform);
    console.log(compilation.getStatus());
    (...)
}

//Upload a new zip for a project
client.project.uploadZip(file, function(error){

})

//Refresh compilation status changes
client.project.refreshUntilCompleted(function(completed){

});

```

XMLSugar Utility: Helper functions to work with the config.xml content.

```js
var sugar = new CocoonSDK.XMLSugar(xml);

//get or set bundleId
sugar.getBundleId();
sugar.setBundleId("com.ludei.devapp");

//install or remove plugins
sugar.addPlugin("cocoon-plugin-multiplayer-ios-gamecenter");
sugar.removePlugin("cocoon-plugin-multiplayer-ios-gamecenter");

//get or set preferences
sugar.getPreference('PREFERENCE_NAME');
sugar.setPreference('PREFERENCE_NAME', value);

//And many more helper methods. Check the XMLSugar.ts source code for details.
(...)

//Export to xml string
console.log(sugar.xml());

```


