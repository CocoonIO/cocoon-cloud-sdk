const gulp = require("gulp");
const typedoc = require("gulp-typedoc");

gulp.task("typedoc", () => {
	return gulp
	.src(["src/lib/*.ts"])
	.pipe(typedoc({
		// TypeScript options (see typescript docs)
		module: "commonjs",
		target: "es6",
		excludeExternals: false,
		excludeNotExported: true,
		excludePrivate: true,
		experimentalDecorators: true,
		includeDeclarations: true,

		// Output options (see typedoc docs)
		out: "./docs",
		json: "docs/project.json",

		// TypeDoc options (see typedoc docs)
		name: "Cocoon Cloud SDK",
		readme: "README.md",
		ignoreCompilerErrors: false,
		version: true,
	}));
});
