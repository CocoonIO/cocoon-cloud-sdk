var gulp = require('gulp');
var ts = require('gulp-typescript');

var tsProject = ts.createProject('tsconfig.json');

gulp.task('scripts', function() {
    var tsResult = tsProject.src()
        .pipe(ts(tsProject));

    return tsResult.js.pipe(gulp.dest('release'));
});

gulp.task('watch', ['scripts'], function() {
    gulp.watch('src/*.ts', ['scripts']);
});