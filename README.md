# cocoon-cloud-sdk

Cocoon.io is a cloud service that allows any web developer to build performant mobile native apps/games based on their HTML5 content. 

The Cocoon Cloud SDK is the easiest way to integrate the cocoon.io cloud compiler in any service or app. With this simple API anyone can authenticate with their cocoon.io account and create, update and compile HTML5 projects in the cloud programmatically. It also includes a XML Sugar utility to make Cordova based config.xml changes super easy.

## Setup your project

You need to create a ClientID in order to use this SDK with your application. Please, contact us at support@cocoon.io to ask for the required credentials to use CocoonSDK with your Website or application.

## API Reference

* See [`d.ts declaration file`](dist/cocoon.sdk.d.ts) for a complete overview of the capabilities of the SDK.
* See [`web`](sample/web) for a complete express project which uses the CocoonSDK
* See [`cli`](sample/cli) for a complete gulp project which allows to upload, compile and download apps from the command line

## Usage

Include the [`CocoonSDK library`](dist/cocoon.sdk.js) in your Web Application or NodeJS application

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

Some API Examples. The APIClient object mimics the cocoon.io REST API

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
```

Project objects returned by the APIClient methods have their own methods to ease commonly performed tasks.

```js
//Fetch the project Config XML
project.getConfigXml(function(xml, error) {
	// Check on the XMLSugar helper functions below to see how to easily manipulate the config.xml content
}

//Save the project Config XML
project.putConfigXml(xml, function(error) {
});

//Compile project
project.compile(function(error){

});

//Compile DeveloperApp
project.compileDevApp(function(error){

});

//Check if a project is compiling
project.isCompiling();

//Get download link for a platform 
project.getDownloadLink('ios');

//Get project compilations data
for (var i = 0; i < project.compilations.length; ++i) {
    var compilation = project.compilations[i];
    console.log(compilation.platform);
    console.log(compilation.getStatus());
    (...)
}

//Upload a new zip for a project
project.uploadZip(file, function(error){

})

//Refresh compilation status changes
project.refreshUntilCompleted(function(completed){

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

## Gulp Example

Sample Gulp project which uses Cocoon.io to upload, compile and download apps from the command line

### gulp commands

* gulp upload: uploads a zip file to the cloud
* gulp compile: compiles a project in the cloud
* gulp download: waits until a project is ready and downloads the iOS/Android builts
* gulp deploy: upload, compile and download in a single step

### gulpfile.js

```js
var gulp = require('gulp');
var https = require('https');
var zip = require('gulp-zip');
var fs = require("fs");
var runSequence = require('run-sequence');
var cocoon = require('cocoon-cloud');


var USERNAME = "MY_USERNAME"; //Your Cocoon.io username
var PASSWORD = "MY_PASSWORD"; //Your Cocoon.io passworld
var PROJECT_ID = "MY_PROJECT_ID"; //Your project id (you can also fetch all projects using client.api.list());

var client = new cocoon.APIClient({clientId:"CLIENT_ID", clientSecret:"CLIENT_SECRET"});
var project; //cached project
 
gulp.task('zip', function(){
    return gulp.src('src/**/*')
        .pipe(zip('archive.zip'))
        .pipe(gulp.dest('dist'));
});

gulp.task('login', function(done) {
    if (client.isLoggedIn()) {
        done();
        return;
    }
    client.logInWithPassword(USERNAME, PASSWORD, function(loggedIn, error){
        done(loggedIn ? null : JSON.stringify(error));
    });
});

gulp.task('fetchproject', ['login'], function(done) {
    if (project) {
        done();
        return;
    }
    client.project.get(PROJECT_ID, function(result, error){
        project = result;
        done(error ? JSON.stringify(error) : null);
    });
});

gulp.task('upload', ['zip','fetchproject'], function(done){
    var file = fs.createReadStream('./dist/archive.zip');
    project.uploadZip(file,function(error){
        done(error ? JSON.stringify(error) : null);
    });
    return null;
});

gulp.task('compile', ['fetchproject'], function(done) {
    project.compile(function(error){
        done(error ? JSON.stringify(error) : null);
    });
});

gulp.task('waitCompleted', ['fetchproject'], function(done) {
    project.refreshUntilCompleted(function(completed) {
        if (!completed) { //Print info about waiting status
            for (var i = 0; i < project.compilations.length; ++i) {             
                var compilation = project.compilations[i];
                console.log(compilation.platform + ':' + compilation.getStatus())
            }
        }
        else {
            done();
        }
    });
});

function downloadCompilation(url, outputPath, platform, done) {
    var dir = require('path').dirname(outputPath);
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
    var file = fs.createWriteStream(outputPath);
    https.get(url, function(response) {
        response.pipe(file).on('finish', function() {
            console.log(platform + " downloaded to '" + outputPath + "'");
        })
    })
    .on('error', function(e) {
        console.error(platform + " download failed: " + e.message);
        done(e.message);
    });
}

gulp.task('download', ['waitCompleted'], function(done) {
    var compilations = project.compilations;
    var counter = compilations.length;
    for (var i = 0; i < compilations.length; ++i) {
        var compilation = compilations[i];
        var platform = compilation.platform;
        if (compilation.isReady()) {
            var outputPath = "./output/" + platform + ".zip";
            downloadCompilation(project.getDownloadLink(platform), outputPath, platform, function(err){
                if (--counter <= 0) {
                    done();
                }
            });
        }
        else if (compilation.isErrored()) {
            counter--;
            console.error(platform + " compilation failed");
        }
        else {
            counter--;
            console.log(platform + " download ignored. Status: " + compilation.getStatus());
        }
    }
    if (counter <=0) {
        done();
    }
});

gulp.task('deploy', function(done) {
  runSequence('upload', 'compile', 'download',done);
});

```


