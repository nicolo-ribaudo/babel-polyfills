"use strict";

const gulpWatch = require("gulp-watch");
const gulp = require("gulp");
const path = require("path");
const rollup = require("rollup").rollup;
const rollupBabel = require("@rollup/plugin-babel").babel;
const rollupNodeResolve = require("@rollup/plugin-node-resolve").nodeResolve;
const rollupJson = require("@rollup/plugin-json");

const esmBundles = [
  { name: "babel-helper-define-polyfill-provider", target: "node" },
  { name: "babel-helper-define-polyfill-provider", target: "browser" },
  { name: "babel-plugin-polyfill-corejs3" },
  { name: "babel-plugin-polyfill-es-shims" },
  { name: "babel-plugin-polyfill-regenerator" },
];

async function buildRollup() {
  const base = path.join(__dirname, "packages");

  return Promise.all(
    esmBundles.map(async ({ name, target }) => {
      const dir = `${base}/${name}`;
      const pkg = require(`${dir}/package.json`);
      const external = specifier => {
        if (specifier.includes("/core-js-compat/")) return true;
        if (specifier.includes("/data/polyfills")) return true;
        if (specifier.startsWith("/")) return false;
        const [name] = /^(?:@[^/]+\/[^/]+|[^/]+)/.exec(specifier);
        if (name === "@babel/core") return true;
        return Object.hasOwnProperty.call(pkg.dependencies || {}, name);
      };

      const bundle = await rollup({
        input: `${dir}/src/index.ts`,
        external,
        plugins: [
          rollupJson(),
          rollupBabel({
            babelrc: false,
            babelHelpers: "bundled",
            extends: "./babel.config.json",
            extensions: [".ts", ".js", ".mjs", ".cjs"],
          }),
          rollupNodeResolve({
            extensions: [".ts", ".js", ".mjs", ".cjs", ".json"],
            browser: target === "browser",
            preferBuiltins: true,
          }),
        ],
      });

      const outputFile = target
        ? `${dir}/lib/index.${target}.js`
        : `${dir}/lib/index.js`;
      await bundle.write({
        file: outputFile,
        format: "es",
        sourcemap: true,
        exports: "named",
        importAttributesKey: "with",
      });
    })
  );
}

gulp.task("build", () => buildRollup());

gulp.task("default", gulp.series("build"));

gulp.task(
  "watch",
  gulp.series("build", function watch() {
    gulpWatch(
      "./packages/*/src/**/*.{js,ts}",
      { debounceDelay: 200 },
      gulp.task("build")
    );
  })
);
