var gulp = require('gulp');
var https = require('https');
var zip = require('gulp-zip');
var fs = require("fs");
var runSequence = require('run-sequence');
var cocoon = require('../../dist/cocoon.sdk.js'); //for production use: require('cocoon-cloud');

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
